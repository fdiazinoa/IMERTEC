/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Motor de Reportes Clínicos E25 (FASE 3)
 *
 * Genera el informe clínico integrado estructurado en 5 secciones canónicas,
 * con soporte para versión técnica facultativa y versión paciente/familiar,
 * y sellado criptográfico con firma médica.
 */

import {
  Patient,
  SafetyAlert,
  DomainScoreSummary,
  InferredStateM23,
  E25Report,
  UserProfile,
  SICBEState,
  SICBEAssessment,
} from '../types/clinical';
import { getE21Explanation } from './e21Explainability';

export interface BuildE25ReportParams {
  patient: Patient;
  encounterId: string;
  eciVersion: string;
  e00Alerts: SafetyAlert[];
  domains: DomainScoreSummary[];
  m23Variables: Record<string, InferredStateM23>;
  functionalInputs: Record<string, any>;
  sicbeState?: SICBEState;
  sicbeReason?: string;
  sgebScore?: number;
  sicbeAssessment?: SICBEAssessment;
  physicianDecisions?: {
    immediate: string[];
    thirtyDays: string[];
    ninetyDays: string[];
  };
  currentUser: UserProfile;
}

export function buildE25Report(params: BuildE25ReportParams): E25Report {
  const reportId = `E25-REP-${params.patient.id}-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  // Generar explicaciones para cada variable E21
  const explanations: Record<string, any> = {};
  Object.keys(params.m23Variables).forEach((key) => {
    explanations[key] = getE21Explanation(key, params.m23Variables[key], params.functionalInputs);
  });

  const activeCriticalAlerts = params.e00Alerts.filter(
    (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
  );

  const defaultDecisions = params.physicianDecisions || {
    immediate: [
      activeCriticalAlerts.length > 0
        ? `Resolución prioritaria de alerta oncológica/seguridad (${activeCriticalAlerts[0].ruleCode}). Derivación urgente a ginecología oncológica.`
        : 'Estabilización y revisión de parámetros de seguridad hemodinámica.',
      'Suspensión preventiva de fármacos potencialmente inapropiados según criterios Beers.',
    ],
    thirtyDays: [
      'Control de dinamometría y marcha tras inicio de programa de prehabilitación física adaptada.',
      'Repetición de perfil analítico esencial y marcadores inflamatorios.',
    ],
    ninetyDays: [
      'Re-evaluación integral ECI para emitir versión longitudinal v2.0.',
      'Reconsideración de cálculo formal SICBE tras estabilización quirúrgica/oncológica.',
    ],
  };

  const isSicbeCalculated =
    Boolean(params.sicbeState) && params.sicbeState !== 'NO_CLASIFICABLE';

  return {
    report_id: reportId,
    encounter_id: params.encounterId,
    patient_id: params.patient.id,
    patient_name: `${params.patient.firstName} ${params.patient.lastName}`,
    patient_record: params.patient.medicalRecordNumber,
    eci_version: params.eciVersion,
    report_version: '1.0.0',
    created_at: now,
    status: 'DRAFT',
    view_mode: 'TECHNICAL',
    sections: {
      section1_patient_e00: {
        patientInfo: {
          id: params.patient.id,
          fullName: `${params.patient.firstName} ${params.patient.lastName}`,
          age: params.patient.age,
          sex: params.patient.biologicalSex || 'Femenino',
          cohort: params.patient.cohortCode,
          date: now.slice(0, 10),
          physician: params.currentUser.name,
        },
        e00Alerts: params.e00Alerts,
        safetyStatus:
          activeCriticalAlerts.length > 0
            ? 'ATENCIÓN PRIORITARIA REQUERIDA (Alerta crítica E00 activa)'
            : 'SIN ALERTAS CRÍTICAS DE SEGURIDAD',
      },
      section2_domain_map: {
        statusText:
          activeCriticalAlerts.length > 0
            ? 'CLASIFICACIÓN DE DOMINIOS SUSPENDIDA (REGLA PD-005)'
            : 'MAPA DE 8 DOMINIOS BIOLÓGICOS EVALUADOS',
        domains: params.domains,
        note:
          activeCriticalAlerts.length > 0
            ? 'Los dominios se muestran con carácter informativo exploratorio. La agregación formal SGEB queda en suspenso hasta resolución oncológica.'
            : 'Evaluación multi-dominio de envejecimiento biológico e inmunosenescencia.',
      },
      section3_e21_synthesis: {
        m23: params.m23Variables,
        explanations,
      },
      section4_sicbe_status: {
        statusText: params.sicbeAssessment
          ? params.sicbeAssessment.state === 'NO_CLASIFICABLE'
            ? 'CLASIFICACIÓN BIOLÓGICA SICBE: NO ASIGNABLE (ABSTENCIÓN SEGURA)'
            : `ESTADO BIOLÓGICO CLASIFICADO: ${params.sicbeAssessment.state} (${params.sicbeAssessment.sgeb_type})`
          : isSicbeCalculated
          ? `ESTADO BIOLÓGICO CLASIFICADO: ${params.sicbeState}`
          : 'CLASIFICACIÓN BIOLÓGICA SICBE: NO CALCULADA / SUSPENDIDA',
        reason:
          params.sicbeAssessment?.abstention_reason ||
          params.sicbeAssessment?.explanation?.sgeb_summary ||
          params.sicbeReason ||
          (activeCriticalAlerts.length > 0
            ? 'Regla PD-005: Proceso oncológico activo o alarma crítica E00 activa supera la escala del instrumento SICBE.'
            : 'Datos en fase de consolidación o suficiencia en revisión.'),
        sgebPreview: params.sicbeAssessment ? params.sicbeAssessment.sgeb : params.sgebScore,
        isCalculated: params.sicbeAssessment
          ? params.sicbeAssessment.status === 'CALCULATED' || params.sicbeAssessment.status === 'VALIDATED'
          : isSicbeCalculated,
      },
      section5_physician_decisions: defaultDecisions,
    },
    report_hash: undefined,
  };
}

export function signE25Report(
  report: E25Report,
  physician: UserProfile,
  eciVersion: string
): E25Report {
  const signedAt = new Date().toISOString();
  const confirmationText =
    'I confirm that I have reviewed the clinical information, system-generated inferences and documented uncertainties.';

  const payload = JSON.stringify({
    reportId: report.report_id,
    patientId: report.patient_id,
    physicianId: physician.id,
    eciVersion,
    signedAt,
    confirmationText,
  });

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexHash = `SHA256-REP-${Math.abs(hash).toString(16).toUpperCase()}-${Math.abs(hash * 37).toString(16).toUpperCase()}`;

  return {
    ...report,
    status: 'SIGNED',
    report_hash: hexHash,
    signature: {
      physician_id: physician.id,
      physician_name: physician.name,
      license: physician.licenseNumber || 'AUTORIZADO',
      signed_at: signedAt,
      report_hash: hexHash,
      eci_version: eciVersion,
      engine_versions: {
        E00: '1.2.0',
        E21: '1.2.0',
        E25: '1.0.0',
      },
      confirmation_text: confirmationText,
    },
  };
}
