/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Definición Formal de Tipos Clínicos, Ontológicos y Semánticos
 * Edición Ontológica Integrada 2.2 / UCO 1.0.1 / SICBE v1.0
 * FASE 2: MVP Clínico Funcional
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCIENTIFIC_ADMIN'
  | 'PHYSICIAN'
  | 'NURSE'
  | 'TECHNICIAN'
  | 'LAB_USER'
  | 'RESEARCHER'
  | 'PATIENT';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  licenseNumber?: string;
  specialty?: string;
  email: string;
  avatarUrl?: string;
}

export type EpistemicClass =
  | 'OBSERVED'
  | 'REFERRED'
  | 'MEASURED'
  | 'IMPORTED'
  | 'CALCULATED'
  | 'INFERRED'
  | 'CLINICAL_INTERPRETATION';

export type UncertaintyType =
  | 'U-01' // Epistémica (conocimiento insuficiente)
  | 'U-02' // Instrumental (limitación de medición)
  | 'U-03' // Temporal (dato caducado o posible cambio)
  | 'U-04' // Semántica (ambigüedad conceptual)
  | 'U-05' // Poblacional (umbral extrapolado)
  | 'U-06' // Residual (variabilidad biológica)
  | 'U-07'; // Interferencia analítica (ej. biotina)

export type DomainId =
  | 'D-I'    // Arquitectura Nuclear
  | 'D-II'   // Genoma y Metabolismo
  | 'D-III'  // Epigenética y Transcriptómica
  | 'D-IV'   // Proteostasis y Autofagia
  | 'D-V'    // Función Mitocondrial
  | 'D-VI'   // Inflamación e Inmunosenescencia
  | 'D-VII'  // Regeneración Tisular y Reserva Funcional
  | 'D-VIII'; // Integración Sistémica e Imagenología

export type DomainStatus =
  | 'OPTIMO'
  | 'PRESERVADO'
  | 'PRESERVADO_EXCEPCIONAL'
  | 'VIGILANCIA'
  | 'COMPROMETIDO'
  | 'ALARMA_ACTIVA'
  | 'SIN_DATOS';

export type SICBEState =
  | 'ESTADO_I'     // Envejecimiento óptimo (SGEB 0-25)
  | 'ESTADO_II'    // Carga leve (SGEB 26-45)
  | 'ESTADO_III'   // Carga moderada (SGEB 46-60)
  | 'ESTADO_IV'    // Fragilidad biológica (SGEB 61-75)
  | 'ESTADO_V'     // Fragilidad severa (SGEB 76-100)
  | 'NO_CLASIFICABLE'; // Abstención segura (Regla PD-005: neoplasia activa o E00)

export type ICCGrade = 'ICC-A' | 'ICC-B' | 'ICC-C' | 'ICC-D' | 'ICC-E';
export type ICBStatus = 'ALTO' | 'MEDIO' | 'BAJO' | 'CONFLICTIVO';

export type ECILifecycleState =
  | 'E0_NO_INICIADO'
  | 'E1_INICIALIZADO'
  | 'E2_EN_ADQUISICION'
  | 'E3_EN_VALIDACION'
  | 'E4_EN_RECONCILIACION'
  | 'E5_PARCIALMENTE_CONSOLIDADO'
  | 'E6_EVALUANDO_SUFICIENCIA'
  | 'E7_PUBLICABLE'
  | 'E8_PUBLICADO'
  | 'E9_EN_ACTUALIZACION'
  | 'E10_CERRADO_HISTORICO'
  | 'E11_ARCHIVADO';

export interface Patient {
  id: string;
  cohortCode: string; // ej. SICBE-PILOT-002
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  biologicalSex: 'Femenino' | 'Masculino' | 'Intersexual';
  genderIdentity?: string;
  nationalId: string;
  maritalStatus: string;
  educationLevel: string;
  occupation: string;
  address: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  primaryCaregiver?: {
    name: string;
    phone: string;
    relationship: string;
  };
  consentFlags: {
    clinicalCare: boolean;
    imageStorage: boolean;
    researchAnonymous: boolean;
    teleconsultation: boolean;
  };
  photoUrl?: string;
  isDemoData?: boolean;
  notes?: string;
}

export interface ActiveProblem {
  id: string; // P1, P2...
  title: string;
  onsetDate: string;
  status: 'Activo' | 'En estudio' | 'Resuelto';
  certainty: 'Confirmado' | 'Probable' | 'Posible';
  priority: 'Alta' | 'Media' | 'Baja';
  objective: string;
  actionPlan: string;
  responsible: string;
  domainImpact?: DomainId;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  indication: string;
  adherence: 'Buena' | 'Regular' | 'Mala';
  isHighRiskBeers?: boolean;
  yearsOfUse?: number;
}

export interface Allergy {
  id: string;
  agent: string;
  reactionType: string;
  severity: 'Leve' | 'Moderada' | 'Grave' | 'Potencialmente Mortal';
  identifiedDate?: string;
}

/**
 * Entidad Canónica: ClinicalObservation (No Borrado Clínico, Inmutable)
 */
export interface ClinicalObservation {
  id: string;
  observation_id?: string; // alias
  patientId: string;
  patient_id?: string; // alias
  encounterId: string;
  encounter_id?: string; // alias
  canonicalVariableId: string; // ej. DMV-0001
  variable_id?: string; // alias
  variableId?: string; // alias
  variableName: string;
  epistemicClass: EpistemicClass;
  value: number | string | boolean;
  original_value?: number | string | boolean;
  unitOriginal?: string;
  original_unit?: string;
  unit?: string; // alias
  valueNormalized?: number | string | boolean;
  normalized_value?: number | string | boolean;
  unitUCUM?: string;
  canonical_unit?: string;
  clinicalTime: string;
  clinical_time?: string;
  recordedTime: string;
  recorded_time?: string;
  methodId?: string;
  method?: string;
  sourceType: 'patient' | 'family' | 'physician_exam' | 'device' | 'laboratory' | 'document';
  source?: 'patient' | 'family' | 'physician_exam' | 'device' | 'laboratory' | 'document';
  reliability: 'Alta' | 'Moderada' | 'Limitada';
  uncertaintyType?: UncertaintyType;
  uncertaintyMagnitude?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  uncertainty?: {
    type: UncertaintyType;
    magnitude: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    description?: string;
  };
  definitionHash: string;
  operatorId: string;
  created_by?: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'DISPUTED' | 'INVALID';
  correctionHistory?: Array<{
    previousValue: number | string | boolean;
    correctedValue: number | string | boolean;
    correctedBy: string;
    timestamp: string;
    reason: string;
  }>;
}

/**
 * Diccionario Maestro de Variables (DMV)
 */
export interface VariableDefinition {
  id: string; // ej. DMV-0001
  code: string; // ej. SYS_BP
  name: string;
  domainId: DomainId;
  category:
    | 'Signos Vitales'
    | 'Antropometría'
    | 'Funcionalidad'
    | 'Bioquímica'
    | 'Inmunología'
    | 'Cognición'
    | 'Geriatría'
    | 'Otro';
  epistemicClassDefault: EpistemicClass;
  canonicalUnit: string;
  allowedUnits: string[];
  dataType: 'numeric' | 'categorical' | 'boolean' | 'text';
  referenceRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  version: string;
  description: string;
  loincCode?: string;
  snomedCode?: string;
}

/**
 * Alertas de Seguridad E00
 */
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFORMATIONAL' | 'ROJO_CRITICO' | 'ALERTA_AMARILLA';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface SafetyAlert {
  id: string;
  alert_id?: string;
  patientId: string;
  patient_id?: string;
  encounterId: string;
  encounter_id?: string;
  title: string;
  ruleCode: string; // ej. E00-ONCO-CA125, E00-CARDIO-PA
  rule_id?: string;
  severity: AlertSeverity;
  evidence: string;
  triggeredAt: string;
  created_at?: string;
  status?: AlertStatus;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolved_by?: string;
  resolution?: string;
  resolutionReason?: string;
  reason?: string;
  requiredAction: string;
}

/**
 * Declarative Adaptive Form Engine: Question -> Answer -> Rule -> Action
 */
export type AdaptiveActionType =
  | 'OPEN_MODULE'
  | 'CLOSE_MODULE'
  | 'ASK_QUESTION'
  | 'REQUEST_OBSERVATION'
  | 'TRIGGER_ALERT'
  | 'ACTIVATE_ENGINE'
  | 'ADD_UNCERTAINTY';

export interface AdaptiveRule {
  id: string;
  condition: {
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'is_true' | 'is_false';
    value: any;
  };
  action: AdaptiveActionType;
  target: string; // ID de módulo, de pregunta o código de regla E00
  payload?: any;
}

export interface AdaptiveQuestion {
  id: string;
  moduleId: string;
  moduleName: string;
  category: string;
  text: string;
  helpText?: string;
  responseType: 'boolean' | 'single_choice' | 'multiple_choice' | 'number' | 'text';
  options?: Array<{ label: string; value: string | number | boolean }>;
  variableId?: string; // DMV ID asociado
  rules: AdaptiveRule[];
}

export interface AdaptiveModule {
  id: string;
  title: string;
  order: number;
  category: string;
  isOpen: boolean;
  isCompleted: boolean;
  questions: AdaptiveQuestion[];
}

export interface InferredStateM23 {
  variableKey: string;
  label: string;
  systemValue: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  sourceObservationIds: string[];
  ruleUsed: string;
  ruleVersion: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  status: 'OK' | 'ADVERTENCIA' | 'VACIO';
  physicianOverride?: {
    overriddenValue: string;
    physicianId: string;
    reason: string;
    timestamp: string;
  };
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  patient_id?: string;
  encounterId?: string;
  encounter_id?: string;
  title: string;
  documentType: 'Laboratorio' | 'Tomografía' | 'Ecografía' | 'Histología' | 'Informe Médico' | 'Fotografía' | 'Otro';
  document_type?: 'LABORATORY' | 'IMAGING' | 'CLINICAL_REPORT' | 'PDF' | 'PHOTO' | 'VIDEO' | 'OTHER';
  date: string;
  uploadedAt?: string;
  uploaded_at?: string;
  uploadedBy?: string;
  uploaded_by?: string;
  institution: string;
  source?: string;
  summary: string;
  keyFindings: string[];
  metadata?: Record<string, any>;
  linkedProblemId?: string;
  linkedObservationId?: string;
  linkedDomain?: DomainId;
  fileUrl?: string;
  isCriticalAlert?: boolean;
}

export interface LaboratoryResult {
  id: string;
  patientId: string;
  patient_id?: string;
  encounterId?: string;
  encounter_id?: string;
  variableId: string; // DMV ID
  testName: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  isOutOfRange: boolean;
  date: string;
  originLab: string;
  documentId?: string;
  status: 'PRELIMINARY' | 'FINAL' | 'CORRECTED';
  notes?: string;
}

export interface DomainScoreSummary {
  domainId: DomainId;
  domainName: string;
  score: number; // 0-100 (0 óptimo, 100 peor)
  status: DomainStatus;
  weight: number;
  activeBiomarkersCount: number;
  imputedBiomarkersCount: number;
  evidenceSummary: string;
}

export interface LongitudinalPoint {
  visitId: 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'ALARMA';
  date: string;
  monthsFromBase: number;
  sgeb: number;
  panelType: 'Esencial' | 'Completo';
  state: SICBEState;
  weightKg: number;
  systolicBP: number;
  diastolicBP: number;
  gaitSpeedMs: number;
  gripStrengthKg: number;
  il6PgMl?: number;
  hsCrpMgL?: number;
  domains: Record<DomainId, number>;
  eventsIntercurrent?: string;
}

export type EncounterStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'WAITING_VALIDATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'En progreso'
  | 'En validación'
  | 'Cerrado y firmado';

export interface EncounterParticipant {
  id: string;
  name: string;
  role: UserRole;
}

export interface Encounter {
  id: string;
  encounter_id?: string;
  patientId: string;
  patient_id?: string;
  encounterType: 'Inicial' | 'Seguimiento' | 'Preventiva' | 'Problema activo' | 'Pre-SICBE' | 'AMBULATORY' | 'FOLLOW_UP' | 'EMERGENCY' | 'TRIAGE';
  type?: string;
  clinicalObjective?: string;
  clinical_objective?: string;
  visitMilestone?: 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
  date: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  physicianId: string;
  physicianName: string;
  physician?: {
    id: string;
    name: string;
    license?: string;
  };
  participants?: EncounterParticipant[];
  status: EncounterStatus;
  isE00Active: boolean;
  chiefComplaint: string;
  clinicalSummary: string;
  notes?: string;
  observations?: string[];
  documents?: string[];
  alerts?: string[];
  audit_events?: string[];
  m23Variables?: Record<string, InferredStateM23>;
  eciState?: ECILifecycleState;
  signature?: {
    signedBy: string;
    license: string;
    timestamp: string;
    hash: string;
  };
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'VIEW_SENSITIVE_DATA'
  | 'UPLOAD'
  | 'DELETE_REQUEST'
  | 'ALERT'
  | 'ALERT_RESOLUTION'
  | 'ENCOUNTER_OPEN'
  | 'ENCOUNTER_CLOSE'
  | 'OVERRIDE'
  | 'RESOLVE_ALERT'
  | 'SIGN_ENCOUNTER'
  | 'VIEW'
  | 'ENGINE_EXECUTION'
  | 'RULE_EXECUTION'
  | 'INFERENCE_GENERATED'
  | 'INFERENCE_ACCEPTED'
  | 'INFERENCE_OVERRIDDEN'
  | 'INFERENCE_REJECTED'
  | 'ECI_STATE_CHANGE'
  | 'ECI_PUBLICATION'
  | 'REPORT_GENERATION'
  | 'REPORT_SIGNATURE'
  | 'CONFLICT_CREATED'
  | 'CONFLICT_RECONCILIATION'
  | 'ECI_CREATED'
  | 'ECI_VALIDATED'
  | 'ECI_PUBLISHED'
  | 'E21_GENERATED'
  | 'E21_OVERRIDE'
  | 'E25_GENERATED'
  | 'E25_SIGNED'
  | 'SICBE_CALCULATION_STARTED'
  | 'SICBE_CALCULATION_COMPLETED'
  | 'SICBE_BLOCKED'
  | 'DOMAIN_SCORE_CALCULATED'
  | 'SGEB_CALCULATED'
  | 'BIOLOGICAL_STATE_ASSIGNED'
  | 'PD_RULE_EXECUTED'
  | 'PHYSICIAN_REVIEWED'
  | 'SICBE_REPORT_GENERATED';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

// ============================================================================
// FASE 3: NÚCLEO INTELIGENTE (MIACI + MCC + DATA GAP + INCERTIDUMBRE + ECI + E21 + E25)
// ============================================================================

export type DataGapReason =
  | 'NOT_MEASURED'
  | 'NOT_AVAILABLE'
  | 'EXPIRED'
  | 'UNKNOWN'
  | 'CONFLICTING'
  | 'TECHNICALLY_UNAVAILABLE';

export interface DataGap {
  data_gap_id: string;
  patient_id: string;
  encounter_id: string;
  variable_id: string;
  variable_name?: string;
  reason: DataGapReason;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL';
  consumer: string; // ej. 'SICBE', 'E21', 'CARDIOLOGY'
  blocking: boolean;
  created_at: string;
  resolved_at?: string;
  resolution?: string;
}

export type UncertaintyCategory =
  | 'U-01' // Epistemic (conocimiento insuficiente)
  | 'U-02' // Instrumental (limitación de medición)
  | 'U-03' // Temporal (dato caducado o posible cambio)
  | 'U-04' // Semantic (ambigüedad conceptual)
  | 'U-05' // Population (umbral extrapolado)
  | 'U-06' // Residual (variabilidad biológica)
  | 'U-07'; // Analytical Interference (ej. biotina)

export interface Uncertainty {
  uncertainty_id: string;
  type: UncertaintyCategory;
  typeName?: string;
  patient_id: string;
  encounter_id: string;
  observation_id?: string;
  variable_id?: string;
  description: string;
  magnitude: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  impact: string;
  source: string;
  created_by: string;
  created_at: string;
  resolved: boolean;
  resolution?: string;
}

export interface ConflictEvidence {
  evidence_id: string;
  observation_id?: string;
  source_type: string; // 'LABORATORY', 'POINT_OF_CARE', 'DOCUMENT', 'PATIENT_REFERRED', etc.
  value: any;
  unit?: string;
  date: string;
  claim: string;
  provenance: string;
}

export interface ConflictReconciliation {
  clinician: string;
  decision: 'ACCEPTED_FIRST' | 'ACCEPTED_SECOND' | 'NEW_VALUE' | 'ACCEPTED_WITH_RESERVATION' | 'DISCARDED_BOTH';
  chosen_value?: any;
  reason: string;
  timestamp: string;
}

export interface Conflict {
  conflict_id: string;
  patient_id: string;
  encounter_id: string;
  variable_id: string;
  variable_name?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RECONCILED' | 'ACCEPTED_WITH_RESERVATION';
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL';
  description: string;
  created_at: string;
  evidences: ConflictEvidence[];
  reconciliation?: ConflictReconciliation;
}

export interface ICCGrading {
  result: 'ICC-A' | 'ICC-B' | 'ICC-C' | 'ICC-D' | 'ICC-E';
  description: string;
  reason: string;
  scorePercent: number; // 0 - 100%
  inputs: {
    totalRequiredVariables: number;
    collectedVariables: number;
    missingCriticalVariables: number;
    activeUncertaintiesCount: number;
    unresolvedConflictsCount: number;
    expiredObservationsCount: number;
  };
  rule_version: string;
  timestamp: string;
}

export type ICBAxisKey =
  | 'CLINICAL_LAB'
  | 'LAB_IMAGING'
  | 'IMAGING_FUNCTION'
  | 'CHRONOLOGY'
  | 'THERAPEUTIC_RESPONSE';

export interface ICBAxisDetail {
  axisKey: ICBAxisKey;
  axisName: string;
  status: 'COHERENT' | 'INCOHERENT' | 'INSUFFICIENT';
  details: string;
  evidenceNotes: string;
}

export interface ICBGrading {
  result: 'HIGH' | 'MEDIUM' | 'LOW' | 'CONFLICTIVE';
  description: string;
  score: number; // 0 - 100
  axes: Record<ICBAxisKey, ICBAxisDetail>;
  reason: string;
  conflict_ids?: string[];
  uncertainty_ids?: string[];
  blocks_publication: boolean;
  rule_version: string;
  timestamp: string;
}

export type EngineStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'WAITING_DATA'
  | 'WAITING_CLINICIAN'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'PENDING_CLINICAL_VALIDATION';

export interface ClinicalEngineExecution {
  execution_id: string;
  encounter_id: string;
  engine_id: string;
  engine_name: string;
  engine_version: string;
  status: EngineStatus;
  started_at: string;
  completed_at?: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  warnings: string[];
  blocked_reason?: string;
  is_approved_engine: boolean;
}

export interface E21SynthesisExplanation {
  variableKey: string;
  label: string;
  calculatedValue: string;
  inputs: Array<{ key: string; label: string; value: any; source?: string }>;
  ruleId: string;
  ruleVersion: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  uncertaintyDetected: string;
  clinicalRationale: string;
}

export interface SufficiencyEvaluation {
  consumer: string;
  ready: boolean;
  ready_for_sicbe?: boolean;
  status: 'READY' | 'READY_WITH_RESERVATIONS' | 'NOT_READY' | 'BLOCKED';
  reasons: string[];
  missingDomains: string[];
  activeBlockingFactors: string[];
  timestamp: string;
}

export interface PublicationGateCheck {
  gate: string;
  label: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

export interface PublicationGateResult {
  allowed: boolean;
  checklist: PublicationGateCheck[];
  blocked_reasons: string[];
  timestamp: string;
}

export interface ECIStateTransitionEvent {
  id: string;
  from_state: ECILifecycleState;
  to_state: ECILifecycleState;
  timestamp: string;
  user_or_system: string;
  reason: string;
  preconditions_met: boolean;
}

export interface ECIVersionHistoryRecord {
  version: string;
  previous_version?: string;
  change_type: 'PATCH' | 'MINOR' | 'MAJOR';
  reason: string;
  created_by: string;
  created_at: string;
  sha256_hash: string;
}

export interface ECI {
  eci_id: string;
  patient_id: string;
  encounter_id: string;
  version: string; // semver ej. 1.0.0, 1.1.0
  status: ECILifecycleState;
  clinical_objective: string;
  created_at: string;
  published_at?: string;
  created_by: string;
  parent_version?: string;
  is_immutable: boolean;
  sha256_hash?: string;
  components: {
    X_t: ClinicalObservation[]; // Observaciones canónicas
    G_t: Array<{ from: string; to: string; relationType: string; strength?: number }>; // Relaciones clínicas
    Z_t: Record<string, InferredStateM23>; // Representaciones derivadas (E21, etc.)
    U_t: Uncertainty[]; // Incertidumbres activas
    M_t: Record<string, any>; // Metadatos W3C PROV-O
    T_t: { visitMilestone: string; timelineDate: string; temporalValidityDays: number }; // Contexto temporal
  };
  data_gaps: DataGap[];
  conflicts: Conflict[];
  icc: ICCGrading;
  icb: ICBGrading;
  sufficiency: SufficiencyEvaluation;
  publication_gate: PublicationGateResult;
  history: ECIVersionHistoryRecord[];
  state_transitions: ECIStateTransitionEvent[];
}

export interface E25Report {
  report_id: string;
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  patient_record: string;
  eci_version: string;
  report_version: string;
  created_at: string;
  status: 'DRAFT' | 'SIGNED' | 'FINAL';
  view_mode: 'TECHNICAL' | 'PATIENT';
  sections: {
    section1_patient_e00: {
      patientInfo: {
        id: string;
        fullName: string;
        age: number;
        sex: string;
        cohort: string;
        date: string;
        physician: string;
      };
      e00Alerts: SafetyAlert[];
      safetyStatus: string;
    };
    section2_domain_map: {
      statusText: string;
      domains: DomainScoreSummary[];
      note: string;
    };
    section3_e21_synthesis: {
      m23: Record<string, InferredStateM23>;
      explanations: Record<string, E21SynthesisExplanation>;
    };
    section4_sicbe_status: {
      statusText: string;
      reason: string;
      sgebPreview?: number;
      isCalculated: boolean;
    };
    section5_physician_decisions: {
      immediate: string[];
      thirtyDays: string[];
      ninetyDays: string[];
    };
  };
  signature?: {
    physician_id: string;
    physician_name: string;
    license: string;
    signed_at: string;
    report_hash: string;
    eci_version: string;
    engine_versions: Record<string, string>;
    confirmation_text: string;
  };
  report_hash?: string;
}

export type MIACIDirectiveType =
  | 'ASK_QUESTION'
  | 'OPEN_MODULE'
  | 'REQUEST_MEASUREMENT'
  | 'REQUEST_DOCUMENT'
  | 'ACTIVATE_ENGINE'
  | 'DEACTIVATE_ENGINE'
  | 'REQUEST_CLINICAL_VALIDATION'
  | 'CREATE_DATA_GAP'
  | 'CREATE_UNCERTAINTY'
  | 'STOP_FOR_SAFETY'
  | 'COMPLETE_BRANCH';

export interface MIACIDirective {
  id: string;
  directive_type: MIACIDirectiveType;
  priority: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'ROUTINE';
  target_id: string; // module, question, engine or variable id
  target_name: string;
  reason: string;
  source_mode: 'INTERACTIVE' | 'DOCUMENT';
  document_source?: {
    document_id: string;
    document_title: string;
    page_or_section?: string;
    imported_by?: string;
    imported_at?: string;
  };
  metadata?: Record<string, any>;
}

// ============================================================================
// FASE 4: CLASIFICADOR SICBE (8 DOMINIOS, 65 BIOMARCADORES, SGEB, ESTADOS I-V, LONGITUDINAL)
// ============================================================================

export type BiomarkerLifecycleStatus =
  | 'OPERATIONAL'
  | 'CANDIDATE'
  | 'COMPLEMENTARY'
  | 'RESEARCH'
  | 'PENDING_FORMAL_INCLUSION';

export type BiomarkerAnalysisLevel = 'ESSENTIAL' | 'RECOMMENDED' | 'ADVANCED';
export type BiomarkerAuthorizedUse = 'ASSISTENTIAL' | 'RESEARCH_ONLY';
export type BiomarkerDirection = 'HIGHER_WORSE' | 'LOWER_WORSE' | 'BIDIRECTIONAL' | 'QUALITATIVE';

export interface BiomarkerDefinition {
  biomarker_id: string;
  variable_id: string; // DMV canonical link
  code: string;
  name: string;
  domain_id: DomainId;
  analysis_level: BiomarkerAnalysisLevel;
  unit: string;
  allowed_units: string[];
  method: string;
  reference: {
    min?: number;
    max?: number;
    optimal?: string;
    text: string;
  };
  direction: BiomarkerDirection;
  weight: number; // weight within domain (e.g., 1.0 to 3.0)
  evidence: 'A' | 'B' | 'C' | 'D';
  lifecycle_status: BiomarkerLifecycleStatus;
  authorized_use: BiomarkerAuthorizedUse;
  validity_period_days: number;
  version: string;
  description?: string;
}

export interface EvaluatedBiomarker {
  biomarker_id: string;
  variable_id: string;
  code: string;
  name: string;
  domain_id: DomainId;
  analysis_level: BiomarkerAnalysisLevel;
  value: number | string | boolean;
  normalized_value: number; // 0 (óptimo) a 100 (máxima carga/deterioro)
  unit: string;
  clinical_time: string;
  source: string;
  method: string;
  reference_text: string;
  status: 'NORMAL' | 'ELEVATED' | 'BORDERLINE' | 'CRITICAL' | 'EXPIRED' | 'MISSING' | 'IMPUTED';
  is_expired: boolean;
  validity_period_days: number;
  is_imputed: boolean;
  weight: number;
  contribution: number;
  eci_version: string;
  authorized_use: BiomarkerAuthorizedUse;
  lifecycle_status: BiomarkerLifecycleStatus;
  previous_value?: {
    value: number | string | boolean;
    date: string;
    delta?: number;
    trend?: 'UP' | 'DOWN' | 'STABLE';
  };
}

export interface DomainWeightSet {
  weight_set_id: string;
  version: string;
  effective_date: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED';
  approved_by: string;
  weights: Record<DomainId, number>; // Must sum to 100
}

export interface DomainAssessment {
  domain_id: DomainId;
  domain_name: string;
  raw_score: number; // 0 a 100
  normalized_score: number; // 0 a 100
  weight: number; // e.g. 18 for D-VI
  weighted_score: number; // (normalized_score * weight) / 100
  completeness: number; // 0 a 100%
  confidence: 'ALTA' | 'MEDIA' | 'BAJA';
  status: DomainStatus;
  available_biomarkers: EvaluatedBiomarker[];
  missing_biomarkers: string[];
  critical_biomarkers: string[];
  uncertainty: string[];
  dominant_findings: string[];
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'INSUFFICIENT_HISTORY';
}

export interface RuleExecutionRecord {
  rule_id: 'PD-001' | 'PD-002' | 'PD-003' | 'PD-004' | 'PD-005' | 'PD-006';
  rule_version: string;
  inputs: Record<string, any>;
  triggered: boolean;
  result: SICBEState | 'NO_CLASIFICABLE' | 'PASS';
  reason: string;
  timestamp: string;
}

export interface SICBESufficiencyEvaluation {
  status: 'READY' | 'READY_WITH_RESERVATIONS' | 'NOT_READY' | 'BLOCKED';
  eci_published: boolean;
  icc_compatible: boolean; // ICC-A, B, C (ICC-D or E blocks)
  e00_resolved: boolean;
  mandatory_data_available: boolean;
  critical_conflicts_resolved: boolean;
  required_domains_count: number;
  data_temporally_valid: boolean;
  reasons: string[];
  blocking_factors: string[];
}

export interface PhysicianSICBEInterpretation {
  interpretation: string;
  clinical_agreement: 'CONCUR' | 'RESERVATIONS' | 'DISAGREE';
  relevant_domains: DomainId[];
  priority_findings: string[];
  limitations: string[];
  follow_up_recommendation: string;
  physician_id: string;
  physician_name: string;
  license_number: string;
  timestamp: string;
}

export interface SICBEExplanation {
  sgeb_summary: string;
  most_affected_domains: DomainId[];
  preserved_domains: DomainId[];
  key_biomarkers: string[];
  rules_summary: string[];
  limitations: string[];
}

export interface SICBEAssessment {
  assessment_id: string;
  patient_id: string;
  visit_milestone?: 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
  eci_id: string;
  eci_version: string;
  eci_hash: string;
  sicbe_version: string;
  algorithm_version: string;
  domain_weight_version: string;
  biomarker_definition_version: string;
  threshold_version: string;
  rule_set_version: string;
  dmv_version: string;
  assessment_type: 'SGEB-C' | 'SGEB-E' | 'ABSTENTION';
  status: 'DRAFT' | 'CALCULATED' | 'VALIDATED' | 'BLOCKED';
  created_at: string;
  calculated_at: string;
  validated_at?: string;
  validated_by?: string;
  domains: Record<DomainId, DomainAssessment>;
  biomarkers: Record<string, EvaluatedBiomarker>;
  sgeb: number;
  sgeb_type: 'SGEB-C' | 'SGEB-E';
  state: SICBEState;
  state_by_sgeb: SICBEState;
  state_by_profile: SICBEState;
  is_discordant: boolean;
  is_blocked_or_abstained: boolean;
  abstention_reason?: string;
  classification_rules_applied: RuleExecutionRecord[];
  confidence: 'ALTA' | 'MEDIA' | 'BAJA';
  completeness_pct: number;
  imputed_biomarkers_count: number;
  explanation: SICBEExplanation;
  limitations: string[];
  physician_interpretation?: PhysicianSICBEInterpretation;
  is_simulation?: boolean;
}

export interface AssessmentComparability {
  status: 'FULLY_COMPARABLE' | 'PARTIALLY_COMPARABLE' | 'NOT_COMPARABLE';
  is_data_coverage_change: boolean;
  is_algorithm_version_change: boolean;
  is_weight_version_change: boolean;
  coverage_delta: number;
  comparability_notes: string[];
}

export interface SICBEExecutionParams {
  eci: ECI;
  patient?: Patient;
  alerts?: SafetyAlert[];
  observations?: ClinicalObservation[];
  labResults?: LaboratoryResult[];
  dataGaps?: DataGap[];
  conflicts?: Conflict[];
  uncertainties?: Uncertainty[];
  icc?: ICCGrading;
  weightSet?: DomainWeightSet;
  customWeightSet?: DomainWeightSet;
  previousAssessment?: SICBEAssessment;
  currentUser?: UserProfile;
  forceEssentialOnly?: boolean;
  isSimulation?: boolean;
}



