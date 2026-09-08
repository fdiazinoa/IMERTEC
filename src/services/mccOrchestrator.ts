/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * MCC — MetaMotor de Coordinación Clínica (FASE 3)
 *
 * Responsabilidad: Orquestar el ciclo de vida de todos los motores clínicos,
 * garantizando la prioridad absoluta de E00, registrando cada ejecución con
 * trazabilidad auditable y administrando los motores experimentales como plugins
 * con estado PENDING_CLINICAL_VALIDATION.
 */

import { ClinicalEngineExecution } from '../types/clinical';

export interface MCCEnginePlugin {
  engine_id: string;
  name: string;
  category: string;
  version: string;
  is_approved: boolean;
  statusDescription: string;
  supportedOutputs: string[];
}

export const KNOWN_MCC_ENGINES: MCCEnginePlugin[] = [
  // Motores Aprobados en FASE 3
  {
    engine_id: 'E00',
    name: 'Motor de Seguridad y Banderas Rojas E00',
    category: 'SEGURIDAD_VITAL',
    version: '1.2.0',
    is_approved: true,
    statusDescription: 'Activo y mandatorio. Prioridad absoluta en todo el pipeline clínico.',
    supportedOutputs: ['SafetyAlert[]', 'isSafeToProceed', 'contraindications'],
  },
  {
    engine_id: 'E21',
    name: 'Motor de Síntesis Pre-Clasificación E21',
    category: 'SINTESIS_INFERENCIAL',
    version: '1.2.0',
    is_approved: true,
    statusDescription: 'Activo. Deduce variables funcionales y cognitivas M23 con nivel de evidencia.',
    supportedOutputs: ['InferredStateM23', 'Explanations'],
  },
  {
    engine_id: 'E25',
    name: 'Motor de Generación de Informe Clínico E25',
    category: 'COMUNICACION_Y_REPORTES',
    version: '1.0.0',
    is_approved: true,
    statusDescription: 'Activo. Consolida E00, E21, mapas de dominios y decisiones médicas firmadas.',
    supportedOutputs: ['E25Report', 'TechnicalReportView', 'PatientReportView', 'IntegrityHash'],
  },

  // Motores No Aprobados / Plugins de Extensión (PENDING_CLINICAL_VALIDATION)
  {
    engine_id: 'E03',
    name: 'Motor de Riesgo Cardiometabólico Avanzado',
    category: 'CARDIOMETABOLICO',
    version: '0.4.1-alpha',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica por comité de cardiología geriátrica.',
    supportedOutputs: ['CardioMetabolicIndex', 'VascularStiffnessRisk'],
  },
  {
    engine_id: 'E12',
    name: 'Motor de Carga Alostática Neuroendocrina',
    category: 'ENDOCRINO_ESTRES',
    version: '0.2.0-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Reglas de cortisol y variabilidad HRV en revisión.',
    supportedOutputs: ['AllostaticScore', 'CortisolAwakeningResponse'],
  },
  {
    engine_id: 'E13',
    name: 'Motor de Inmunosenescencia e Inflammaging Citoquínico',
    category: 'INMUNOLOGIA',
    version: '0.3.0-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Requiere calibración con paneles IL-6 y TNF-alfa.',
    supportedOutputs: ['ImmuneAgeEstimate', 'SASP_Profile'],
  },
  {
    engine_id: 'E14',
    name: 'Motor de Integridad Mitocondrial y Estrés Oxidativo',
    category: 'BIOENERGETICA',
    version: '0.1.5-experimental',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. No validado en poblaciones comunitarias > 80 años.',
    supportedOutputs: ['MitochondrialDecayRisk'],
  },
  {
    engine_id: 'E15',
    name: 'Motor de Reserva Autonómica y Dinámica HRV',
    category: 'NEUROAUTONOMICO',
    version: '0.2.2-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Algoritmos de análisis espectral ECG en evaluación.',
    supportedOutputs: ['SDNN_Normalized', 'AutonomicResilience'],
  },
  {
    engine_id: 'E16',
    name: 'Motor de Farmacocinética Senescente y Depuración Renal',
    category: 'FARMACOGERIATRIA',
    version: '0.5.0-alpha',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Modelos PBPK no aprobados para prescripción autónoma.',
    supportedOutputs: ['AdjustedClearancePredictions'],
  },
  {
    engine_id: 'E17',
    name: 'Motor de Riesgo de Fragilidad Musculoesquelética y Caídas',
    category: 'LOCOMOTOR',
    version: '0.4.0-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Calibración de cinemática con acelerometría en curso.',
    supportedOutputs: ['FallRiskIndexBiomechanical'],
  },
  {
    engine_id: 'E18',
    name: 'Motor de Microarquitectura Ósea y Resorción Trabecular',
    category: 'OSTEOMETABOLICO',
    version: '0.1.0-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Reglas TBS (Trabecular Bone Score) en comité.',
    supportedOutputs: ['TrabecularResilienceScore'],
  },
  {
    engine_id: 'E19',
    name: 'Motor de Trayectoria de Decline Cognitivo Preclínico',
    category: 'NEUROCOGNITIVO',
    version: '0.3.1-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Reglas de biomarcadores p-tau217 sin aprobación local.',
    supportedOutputs: ['CognitiveTrajectoryVelocity'],
  },
  {
    engine_id: 'E20',
    name: 'Motor de Cronobiología y Arquitectura del Sueño',
    category: 'CRONOBIOLOGIA',
    version: '0.2.0-draft',
    is_approved: false,
    statusDescription: 'Pendiente de validación clínica. Polisomnografía simplificada en fase piloto.',
    supportedOutputs: ['SleepArchitectureIndex', 'CircadianDisruptionScore'],
  },
];

/**
 * Genera el estado de orquestación de ejecuciones para un encuentro clínico.
 */
export function initializeEngineExecutions(encounterId: string = 'GLOBAL', hasE00Critical: boolean = false): ClinicalEngineExecution[] {
  const now = new Date().toISOString();

  return KNOWN_MCC_ENGINES.map((eng) => {
    if (eng.engine_id === 'E00') {
      return {
        execution_id: `EXEC-E00-${Date.now().toString().slice(-4)}`,
        encounter_id: encounterId,
        engine_id: 'E00',
        engine_name: eng.name,
        engine_version: eng.version,
        status: 'COMPLETED',
        started_at: now,
        completed_at: now,
        inputs: { surveillanceMode: 'CONTINUOUS', alertsEvaluated: true },
        outputs: { criticalAlertsFound: hasE00Critical },
        warnings: hasE00Critical ? ['Alerta crítica detectada: bloquea cálculo downstream'] : [],
        is_approved_engine: true,
      };
    }

    if (eng.engine_id === 'E21') {
      return {
        execution_id: `EXEC-E21-${Date.now().toString().slice(-4)}`,
        encounter_id: encounterId,
        engine_id: 'E21',
        engine_name: eng.name,
        engine_version: eng.version,
        status: hasE00Critical ? 'BLOCKED' : 'COMPLETED',
        started_at: now,
        completed_at: hasE00Critical ? undefined : now,
        inputs: { functionalVariablesCount: 9, rulePack: 'E21-R01-R09' },
        outputs: hasE00Critical ? {} : { m23VariablesGenerated: 9 },
        warnings: hasE00Critical ? ['Ejecución detenida: E00 activo en el encuentro'] : [],
        blocked_reason: hasE00Critical ? 'Regla PD-005: E00 activo requiere abstención inferencial o resolución' : undefined,
        is_approved_engine: true,
      };
    }

    if (eng.engine_id === 'E25') {
      return {
        execution_id: `EXEC-E25-${Date.now().toString().slice(-4)}`,
        encounter_id: encounterId,
        engine_id: 'E25',
        engine_name: eng.name,
        engine_version: eng.version,
        status: 'ACTIVE',
        started_at: now,
        inputs: { reportTemplates: ['TECHNICAL', 'PATIENT'], sectionsRequired: 5 },
        outputs: {},
        warnings: [],
        is_approved_engine: true,
      };
    }

    // Motores no aprobados
    return {
      execution_id: `EXEC-${eng.engine_id}-${Date.now().toString().slice(-4)}`,
      encounter_id: encounterId,
      engine_id: eng.engine_id,
      engine_name: eng.name,
      engine_version: eng.version,
      status: 'PENDING_CLINICAL_VALIDATION',
      started_at: now,
      inputs: {},
      outputs: {},
      warnings: ['Motor en etapa experimental o no aprobado para uso clínico autónomo'],
      blocked_reason: eng.statusDescription,
      is_approved_engine: false,
    };
  });
}
