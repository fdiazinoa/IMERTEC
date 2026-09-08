/**
 * IMERTEC — Capa de Servicios y Endpoints API para el Clasificador SICBE
 * Implementa la interfaz para consumo, consulta, validación médica y auditoría.
 *
 * Endpoints implementados:
 * - POST /api/sicbe/assessments
 * - GET  /api/sicbe/assessments/{id}
 * - GET  /api/patients/{id}/sicbe
 * - GET  /api/patients/{id}/sicbe/history
 * - GET  /api/sicbe/assessments/{id}/domains
 * - GET  /api/sicbe/assessments/{id}/explanation
 * - POST /api/sicbe/assessments/{id}/validate
 */

import {
  SICBEAssessment,
  PhysicianSICBEInterpretation,
  DomainAssessment,
  DomainId,
  SICBEExplanation,
} from '../types/clinical';

export interface PostAssessmentRequest {
  patient_id: string;
  eci_id: string;
  eci_version: string;
  assessment_type?: 'SGEB-C' | 'SGEB-E';
  custom_weight_version?: string;
  is_simulation?: boolean;
}

export interface ValidateAssessmentRequest {
  assessment_id: string;
  physician_id: string;
  physician_name: string;
  license_number: string;
  interpretation: string;
  clinical_agreement: 'CONCUR' | 'RESERVATIONS' | 'DISAGREE';
  relevant_domains: DomainId[];
  priority_findings: string[];
  limitations: string[];
  follow_up_recommendation: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// In-Memory Repository for API persistence
class SICBEApiStore {
  private assessments: Map<string, SICBEAssessment> = new Map();
  private patientHistory: Map<string, string[]> = new Map(); // patient_id -> assessment_ids

  public saveAssessment(assessment: SICBEAssessment): void {
    this.assessments.set(assessment.assessment_id, assessment);
    const existing = this.patientHistory.get(assessment.patient_id) || [];
    if (!existing.includes(assessment.assessment_id)) {
      this.patientHistory.set(assessment.patient_id, [...existing, assessment.assessment_id]);
    }
  }

  public getAssessment(id: string): SICBEAssessment | undefined {
    return this.assessments.get(id);
  }

  public getLatestPatientAssessment(patientId: string): SICBEAssessment | undefined {
    const ids = this.patientHistory.get(patientId) || [];
    if (ids.length === 0) return undefined;
    const latestId = ids[ids.length - 1];
    return this.assessments.get(latestId);
  }

  public getPatientHistory(patientId: string): SICBEAssessment[] {
    const ids = this.patientHistory.get(patientId) || [];
    return ids.map((id) => this.assessments.get(id)).filter(Boolean) as SICBEAssessment[];
  }
}

export const sicbeApiStore = new SICBEApiStore();

/**
 * POST /api/sicbe/assessments
 * Registra o almacena un nuevo cálculo versionado de SICBE.
 */
export async function postAssessment(
  assessment: SICBEAssessment
): Promise<ApiResponse<SICBEAssessment>> {
  try {
    sicbeApiStore.saveAssessment(assessment);
    return {
      success: true,
      data: assessment,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error al persistir la evaluación SICBE',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * GET /api/sicbe/assessments/{id}
 * Recupera una evaluación específica por su identificador inmutable.
 */
export async function getAssessmentById(
  assessmentId: string
): Promise<ApiResponse<SICBEAssessment>> {
  const item = sicbeApiStore.getAssessment(assessmentId);
  if (!item) {
    return {
      success: false,
      error: `Evaluación ${assessmentId} no encontrada`,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: true,
    data: item,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/patients/{id}/sicbe
 * Recupera la evaluación activa más reciente para el paciente.
 */
export async function getPatientActiveSICBE(
  patientId: string
): Promise<ApiResponse<SICBEAssessment>> {
  const item = sicbeApiStore.getLatestPatientAssessment(patientId);
  if (!item) {
    return {
      success: false,
      error: `No existe evaluación SICBE calculada para el paciente ${patientId}`,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: true,
    data: item,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/patients/{id}/sicbe/history
 * Recupera la trayectoria longitudinal de evaluaciones para el paciente.
 */
export async function getPatientSICBEHistory(
  patientId: string
): Promise<ApiResponse<SICBEAssessment[]>> {
  const history = sicbeApiStore.getPatientHistory(patientId);
  return {
    success: true,
    data: history,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/sicbe/assessments/{id}/domains
 * Recupera los 8 dominios biológicos con sus biomarcadores y scores.
 */
export async function getAssessmentDomains(
  assessmentId: string
): Promise<ApiResponse<Record<DomainId, DomainAssessment>>> {
  const item = sicbeApiStore.getAssessment(assessmentId);
  if (!item) {
    return {
      success: false,
      error: `Evaluación ${assessmentId} no encontrada`,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: true,
    data: item.domains,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/sicbe/assessments/{id}/explanation
 * Recupera la explicación causal y el desglose de reglas de la asignación de estado.
 */
export async function getAssessmentExplanation(
  assessmentId: string
): Promise<ApiResponse<SICBEExplanation>> {
  const item = sicbeApiStore.getAssessment(assessmentId);
  if (!item) {
    return {
      success: false,
      error: `Evaluación ${assessmentId} no encontrada`,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: true,
    data: item.explanation,
    timestamp: new Date().toISOString(),
  };
}

/**
 * POST /api/sicbe/assessments/{id}/validate
 * Registra la validación médica e interpretación clínica sin alterar los cálculos matemáticos.
 */
export async function postAssessmentValidation(
  req: ValidateAssessmentRequest
): Promise<ApiResponse<SICBEAssessment>> {
  const item = sicbeApiStore.getAssessment(req.assessment_id);
  if (!item) {
    return {
      success: false,
      error: `Evaluación ${req.assessment_id} no encontrada para validación`,
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const interpretation: PhysicianSICBEInterpretation = {
    interpretation: req.interpretation,
    clinical_agreement: req.clinical_agreement,
    relevant_domains: req.relevant_domains,
    priority_findings: req.priority_findings,
    limitations: req.limitations,
    follow_up_recommendation: req.follow_up_recommendation,
    physician_id: req.physician_id,
    physician_name: req.physician_name,
    license_number: req.license_number,
    timestamp: now,
  };

  const updated: SICBEAssessment = {
    ...item,
    status: 'VALIDATED',
    validated_at: now,
    validated_by: `${req.physician_name} (${req.license_number})`,
    physician_interpretation: interpretation,
  };

  sicbeApiStore.saveAssessment(updated);

  return {
    success: true,
    data: updated,
    timestamp: now,
  };
}
