/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * MIACI — Motor Inteligente de Adquisición Clínica Integrada (FASE 3)
 *
 * Principio: Adquisición clínica adaptativa, probabilística y gobernada por seguridad.
 * No asume que datos faltantes son normales. Separa hechos de inferencias.
 */

import {
  Patient,
  Encounter,
  ClinicalObservation,
  SafetyAlert,
  Uncertainty,
  DataGap,
  Conflict,
  MIACIDirective,
} from '../types/clinical';
import { DMV_VARIABLES } from '../data/dmvData';

export interface MIACIContext {
  patient: Patient;
  encounter?: Encounter | null;
  clinicalObjective?: string;
  observations: ClinicalObservation[];
  alerts: SafetyAlert[];
  uncertainties?: Uncertainty[];
  dataGaps?: DataGap[];
  conflicts?: Conflict[];
  activeEngines?: string[];
  mode: 'INTERACTIVE' | 'DOCUMENT';
  documentMetadata?: {
    document_id: string;
    document_title: string;
    page_or_section?: string;
    imported_by?: string;
    imported_at?: string;
  };
}

export interface MIACIPlan {
  summary: string;
  safetyBlockActive: boolean;
  directives: MIACIDirective[];
  detectedGaps: DataGap[];
  detectedUncertainties: Uncertainty[];
  recommendedModules: string[];
  activeEnginesToTrigger: string[];
}

/**
 * Ejecuta el ciclo evaluador de MIACI para generar directivas de adquisición clínica.
 */
export function runMIACIEvaluation(ctx: MIACIContext): MIACIPlan {
  const directives: MIACIDirective[] = [];
  const detectedGaps: DataGap[] = [];
  const detectedUncertainties: Uncertainty[] = [];
  const activeEnginesToTrigger: string[] = [];
  const recommendedModules: string[] = [];

  const encounterId = ctx.encounter?.id || 'ENC-TEMP';
  const now = new Date().toISOString();

  // 1. EVALUACIÓN DE SEGURIDAD PRIORITARIA (E00 Gateway)
  const criticalAlerts = ctx.alerts.filter(
    (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
  );

  if (criticalAlerts.length > 0) {
    const alert = criticalAlerts[0];
    directives.push({
      id: `DIR-SAFETY-${Date.now()}`,
      directive_type: 'STOP_FOR_SAFETY',
      priority: 'EMERGENCY',
      target_id: alert.id,
      target_name: alert.title,
      reason: `Alerta crítica de seguridad E00 activa (${alert.ruleCode}): ${alert.evidence}. Protocolo de detención segura activo.`,
      source_mode: ctx.mode,
      document_source: ctx.documentMetadata,
      metadata: { alertId: alert.id, ruleCode: alert.ruleCode },
    });

    return {
      summary: `Atención: adquisición condicionada por alerta crítica activa ${alert.ruleCode}. Detención segura recomendada antes de pruebas de esfuerzo o altas cargas.`,
      safetyBlockActive: true,
      directives,
      detectedGaps: [],
      detectedUncertainties: [],
      recommendedModules: ['MOD-URG-E00'],
      activeEnginesToTrigger: ['E00_SAFETY'],
    };
  }

  // 2. REVISIÓN DE VARIABLES ESENCIALES (Diccionario Maestro DMV)
  const observations = ctx.observations || [];
  const knownObservationKeys = new Set(observations.map((o) => o.canonicalVariableId || o.variableName));

  // Chequeo de Signos Vitales Básicos
  const vitalsNeeded = [
    { key: 'DMV-0001', name: 'Presión Arterial Sistólica', module: 'MOD-01-VITALS' },
    { key: 'DMV-0002', name: 'Presión Arterial Diastólica', module: 'MOD-01-VITALS' },
    { key: 'DMV-0003', name: 'Frecuencia Cardíaca', module: 'MOD-01-VITALS' },
    { key: 'DMV-0005', name: 'Saturación O2', module: 'MOD-01-VITALS' },
  ];

  const missingVitals = vitalsNeeded.filter((v) => !knownObservationKeys.has(v.key));
  if (missingVitals.length > 0) {
    directives.push({
      id: `DIR-VITALS-${Date.now()}`,
      directive_type: 'REQUEST_MEASUREMENT',
      priority: 'HIGH',
      target_id: 'MOD-01-VITALS',
      target_name: 'Signos Vitales y Estabilidad Hemodinámica',
      reason: `Faltan constantes vitales básicas (${missingVitals.map((v) => v.name).join(', ')}). Requerido para seguridad basal.`,
      source_mode: ctx.mode,
      document_source: ctx.documentMetadata,
    });
    recommendedModules.push('MOD-01-VITALS');
  }

  // Chequeo de Capacidad Funcional & Sarcopenia (Grip Strength, Velocidad Marcha, ABVD)
  const functionalVariables = [
    { key: 'DMV-0010', name: 'Dinamometría Manual (Fuerza de Prensión)', module: 'MOD-02-FUNCTION' },
    { key: 'DMV-0011', name: 'Velocidad de Marcha Usual (4m)', module: 'MOD-02-FUNCTION' },
    { key: 'DMV-0012', name: 'Índice de Barthel (ABVD)', module: 'MOD-02-FUNCTION' },
  ];

  functionalVariables.forEach((f) => {
    if (!knownObservationKeys.has(f.key)) {
      detectedGaps.push({
        data_gap_id: `GAP-${f.key}-${Date.now().toString().slice(-4)}`,
        patient_id: ctx.patient.id,
        encounter_id: encounterId,
        variable_id: f.key,
        variable_name: f.name,
        reason: 'NOT_MEASURED',
        impact: 'HIGH',
        severity: 'WARNING',
        consumer: 'E21_AND_SICBE',
        blocking: false,
        created_at: now,
      });

      directives.push({
        id: `DIR-${f.key}-${Date.now()}`,
        directive_type: 'REQUEST_MEASUREMENT',
        priority: 'MEDIUM',
        target_id: f.key,
        target_name: f.name,
        reason: `Variable biométrica clave no registrada para estimación de reserva funcional E21/SICBE.`,
        source_mode: ctx.mode,
        document_source: ctx.documentMetadata,
      });
      if (!recommendedModules.includes(f.module)) {
        recommendedModules.push(f.module);
      }
    }
  });

  // 3. DETECCIÓN DE INCERTIDUMBRE TEMPORAL EN OBSERVACIONES ANTIGUAS (U-03)
  ctx.observations.forEach((obs) => {
    const obsDate = new Date(obs.clinicalTime || obs.recordedTime || now);
    const diffDays = Math.floor((Date.now() - obsDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 180) {
      // Dato con más de 6 meses
      detectedUncertainties.push({
        uncertainty_id: `UNC-TEMP-${obs.id}-${Date.now().toString().slice(-4)}`,
        type: 'U-03',
        typeName: 'Incertidumbre Temporal (Caducidad Biológica)',
        patient_id: ctx.patient.id,
        encounter_id: encounterId,
        observation_id: obs.id,
        variable_id: obs.canonicalVariableId,
        description: `Observación ${obs.variableName} (${obs.value} ${obs.unitOriginal || ''}) registrada hace ${diffDays} días (> 180 d). Alta probabilidad de deriva temporal.`,
        magnitude: diffDays > 365 ? 'ALTA' : 'MEDIA',
        impact: 'Podría falsear estado biológico actual si hubo descompensación intercurrente.',
        source: 'MIACI_TEMPORAL_VALIDATOR_V1',
        created_by: 'MIACI_ENGINE',
        created_at: now,
        resolved: false,
      });

      directives.push({
        id: `DIR-EXP-${obs.id}`,
        directive_type: 'REQUEST_MEASUREMENT',
        priority: 'MEDIUM',
        target_id: obs.canonicalVariableId || obs.id,
        target_name: `Re-evaluación de ${obs.variableName}`,
        reason: `Dato vencido hace ${diffDays} días. Se aconseja re-medición para actualizar el ECI.`,
        source_mode: ctx.mode,
      });
    }
  });

  // 4. DETECCIÓN DE MÓDULOS DE RIESGO ONCOLÓGICO / GERIÁTRICO SEGÚN PERFIL
  if (ctx.patient.age >= 80) {
    activeEnginesToTrigger.push('E21_CLINICAL_SYNTHESIS');
    activeEnginesToTrigger.push('E25_CLINICAL_REPORT');
  }

  if (ctx.patient.id === 'PAT-002') {
    // Casilda: sospecha oncológica activa
    directives.push({
      id: `DIR-DOC-ONCO-${Date.now()}`,
      directive_type: 'REQUEST_DOCUMENT',
      priority: 'HIGH',
      target_id: 'DOC-ANATOMOPATHOLOGY',
      target_name: 'Informe Biopsia Laparoscópica / Histopatología',
      reason: 'Confirmación histológica indispensable para clasificar masa ovárica y reanudar SICBE.',
      source_mode: ctx.mode,
      document_source: ctx.documentMetadata,
    });
  }

  // 5. DIRECTIVA DE ACTIVACIÓN DE MOTORES VALIDADOS
  directives.push({
    id: `DIR-ENG-E00-${Date.now()}`,
    directive_type: 'ACTIVATE_ENGINE',
    priority: 'HIGH',
    target_id: 'E00_SAFETY',
    target_name: 'Motor de Seguridad E00',
    reason: 'Vigilancia continua activa de contraindicaciones y banderas rojas.',
    source_mode: ctx.mode,
  });

  directives.push({
    id: `DIR-ENG-E21-${Date.now()}`,
    directive_type: 'ACTIVATE_ENGINE',
    priority: 'MEDIUM',
    target_id: 'E21_SYNTHESIS',
    target_name: 'Motor de Síntesis Clínica E21',
    reason: 'Generación de variables M23 derivadas a partir de datos observacionales.',
    source_mode: ctx.mode,
  });

  // Directiva de validación médica mandatoria
  directives.push({
    id: `DIR-CLIN-VAL-${Date.now()}`,
    directive_type: 'REQUEST_CLINICAL_VALIDATION',
    priority: 'HIGH',
    target_id: 'E21_M23_VALIDATION',
    target_name: 'Validación Médica de Inferencias E21',
    reason: 'El facultativo debe revisar, sobreescribir o confirmar las variables derivadas antes del sellado del ECI.',
    source_mode: ctx.mode,
  });

  return {
    summary: `Plan de Adquisición MIACI generado: ${directives.length} directivas activas, ${detectedGaps.length} brechas de datos registradas y ${detectedUncertainties.length} incertidumbres temporales identificadas.`,
    safetyBlockActive: false,
    directives,
    detectedGaps,
    detectedUncertainties,
    recommendedModules,
    activeEnginesToTrigger,
  };
}
