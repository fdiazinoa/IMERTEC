/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Máquina de Estados del ECI, Inmutabilidad y Versionado SemVer (FASE 3)
 *
 * Estados E0 a E11 con validación estricta de precondiciones y principio de no modificación
 * destructiva una vez publicado (E8_PUBLICADO).
 */

import {
  ECI,
  ECILifecycleState,
  ECIStateTransitionEvent,
  ECIVersionHistoryRecord,
  PublicationGateResult,
  ClinicalObservation,
} from '../types/clinical';

export const ALLOWED_TRANSITIONS: Record<ECILifecycleState, ECILifecycleState[]> = {
  E0_NO_INICIADO: ['E1_INICIALIZADO'],
  E1_INICIALIZADO: ['E2_EN_ADQUISICION', 'E0_NO_INICIADO'],
  E2_EN_ADQUISICION: ['E3_EN_VALIDACION', 'E1_INICIALIZADO'],
  E3_EN_VALIDACION: ['E4_EN_RECONCILIACION', 'E5_PARCIALMENTE_CONSOLIDADO', 'E6_EVALUANDO_SUFICIENCIA'],
  E4_EN_RECONCILIACION: ['E5_PARCIALMENTE_CONSOLIDADO', 'E3_EN_VALIDACION'],
  E5_PARCIALMENTE_CONSOLIDADO: ['E6_EVALUANDO_SUFICIENCIA', 'E2_EN_ADQUISICION'],
  E6_EVALUANDO_SUFICIENCIA: ['E7_PUBLICABLE', 'E5_PARCIALMENTE_CONSOLIDADO', 'E2_EN_ADQUISICION'],
  E7_PUBLICABLE: ['E8_PUBLICADO', 'E6_EVALUANDO_SUFICIENCIA'],
  E8_PUBLICADO: ['E9_EN_ACTUALIZACION', 'E10_CERRADO_HISTORICO'],
  E9_EN_ACTUALIZACION: ['E2_EN_ADQUISICION', 'E1_INICIALIZADO'],
  E10_CERRADO_HISTORICO: ['E11_ARCHIVADO'],
  E11_ARCHIVADO: [],
};

/**
 * Simulación de hash criptográfico determinístico SHA-256 para el snapshot inmutable del ECI.
 */
export function generateECISHA256(eci: Partial<ECI>): string {
  const payload = JSON.stringify({
    id: eci.eci_id,
    patient: eci.patient_id,
    version: eci.version,
    status: eci.status,
    obsCount: eci.components?.X_t?.length || 0,
    m23Count: Object.keys(eci.components?.Z_t || {}).length,
    timestamp: eci.published_at || eci.created_at,
  });

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexPart1 = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const hexPart2 = Math.abs(hash * 31).toString(16).padStart(8, '0').toUpperCase();
  const hexPart3 = Math.abs(hash * 127).toString(16).padStart(8, '0').toUpperCase();
  const hexPart4 = Math.abs(hash * 8191).toString(16).padStart(8, '0').toUpperCase();

  return `SHA256-${hexPart1}${hexPart2}${hexPart3}${hexPart4}`;
}

export interface TransitionCheckResult {
  allowed: boolean;
  reason: string;
}

export function canTransitionECI(
  current: ECILifecycleState,
  target: ECILifecycleState,
  context: {
    publicationGate?: PublicationGateResult;
    hasSignedByPhysician?: boolean;
    conflictsOpenCount?: number;
  }
): TransitionCheckResult {
  const allowedTargets = ALLOWED_TRANSITIONS[current] || [];
  if (!allowedTargets.includes(target)) {
    return {
      allowed: false,
      reason: `Transición inválida desde ${current} hacia ${target}. Transiciones permitidas: ${allowedTargets.join(', ')}.`,
    };
  }

  // Regla especial para E8_PUBLICADO: Requiere Gate de publicación permitido y firma
  if (target === 'E8_PUBLICADO') {
    if (context.publicationGate && !context.publicationGate.allowed) {
      return {
        allowed: false,
        reason: `Bloqueo de compuerta: ${context.publicationGate.blocked_reasons.join('; ')}`,
      };
    }
    if (!context.hasSignedByPhysician) {
      return {
        allowed: false,
        reason: 'Se requiere firma médica digital autorizada antes de publicar.',
      };
    }
  }

  // Regla especial para E7_PUBLICABLE: No puede haber conflictos críticos abiertos sin reconciliar
  if (target === 'E7_PUBLICABLE') {
    if (context.conflictsOpenCount && context.conflictsOpenCount > 0) {
      return {
        allowed: false,
        reason: `No se puede avanzar a E7_PUBLICABLE mientras existan ${context.conflictsOpenCount} conflicto(s) sin reconciliación.`,
      };
    }
  }

  return { allowed: true, reason: 'Precondiciones clínicas cumplidas.' };
}

/**
 * Cuando un ECI en estado E8_PUBLICADO recibe nuevos datos, NUNCA se sobreescribe.
 * Se transiciona a E9_EN_ACTUALIZACION y se genera una nueva versión semver derivada.
 */
export function branchNewECIVersion(
  parentECI: ECI,
  changeType: 'PATCH' | 'MINOR' | 'MAJOR',
  reason: string,
  createdBy: string,
  newEncounterId?: string
): { updatedParent: ECI; newECI: ECI } {
  const [major, minor, patch] = parentECI.version.split('.').map(Number);
  let newVersionStr = `${major}.${minor}.${patch + 1}`;

  if (changeType === 'MAJOR') {
    newVersionStr = `${major + 1}.0.0`;
  } else if (changeType === 'MINOR') {
    newVersionStr = `${major}.${minor + 1}.0`;
  }

  const now = new Date().toISOString();

  // 1. Marcar versión previa como CERRADO_HISTORICO
  const updatedParent: ECI = {
    ...parentECI,
    status: 'E10_CERRADO_HISTORICO',
    is_immutable: true,
  };

  // 2. Crear nueva instancia mutable
  const newECIId = `ECI-${parentECI.patient_id}-${newVersionStr.replace(/\./g, '-')}`;
  const historyRecord: ECIVersionHistoryRecord = {
    version: newVersionStr,
    previous_version: parentECI.version,
    change_type: changeType,
    reason,
    created_by: createdBy,
    created_at: now,
    sha256_hash: 'PENDING_PUBLICATION',
  };

  const newECI: ECI = {
    ...parentECI,
    eci_id: newECIId,
    version: newVersionStr,
    encounter_id: newEncounterId || parentECI.encounter_id,
    parent_version: parentECI.version,
    status: 'E1_INICIALIZADO',
    created_at: now,
    published_at: undefined,
    created_by: createdBy,
    is_immutable: false,
    sha256_hash: undefined,
    history: [historyRecord, ...(parentECI.history || [])],
    state_transitions: [
      {
        id: `TR-${Date.now()}`,
        from_state: 'E0_NO_INICIADO',
        to_state: 'E1_INICIALIZADO',
        timestamp: now,
        user_or_system: createdBy,
        reason: `Nueva versión clonada a partir de ${parentECI.version}: ${reason}`,
        preconditions_met: true,
      },
    ],
  };

  return { updatedParent, newECI };
}

export interface ECIDiffResult {
  vA: string;
  vB: string;
  targetVersion: string;
  currentVersion: string;
  newObservations: ClinicalObservation[];
  changedValues: Array<{ variable: string; valueA: any; valueB: any }>;
  newInferences: Array<{ key: string; label: string; valueA?: string; valueB?: string }>;
  resolvedConflicts: Array<{ id: string; description: string; resolution?: string }>;
  newUncertainties: Array<{ id: string; type: string; description: string }>;
  supersededAssertions: string[];
}

/**
 * Compara dos versiones de ECI (Diff View) mostrando variaciones exactas.
 */
export function compareECIVersions(eciA: ECI, eciB: ECI): ECIDiffResult {
  const xA = eciA?.components?.X_t || [];
  const xB = eciB?.components?.X_t || [];
  const obsMapA = new Map(xA.map((o) => [o.canonicalVariableId || o.id, o]));
  const obsMapB = new Map(xB.map((o) => [o.canonicalVariableId || o.id, o]));

  const newObservations: ClinicalObservation[] = [];
  const changedValues: Array<{ variable: string; valueA: any; valueB: any }> = [];

  obsMapB.forEach((obsB, key) => {
    const obsA = obsMapA.get(key);
    if (!obsA) {
      newObservations.push(obsB);
    } else if (obsA.value !== obsB.value) {
      changedValues.push({
        variable: obsB.variableName,
        valueA: obsA.value,
        valueB: obsB.value,
      });
    }
  });

  // Inferencias M23
  const zA = eciA?.components?.Z_t || {};
  const zB = eciB?.components?.Z_t || {};
  const newInferences: Array<{ key: string; label: string; valueA?: string; valueB?: string }> = [];

  const allZKeys = Array.from(new Set([...Object.keys(zA), ...Object.keys(zB)]));
  allZKeys.forEach((k) => {
    const itemA = zA[k];
    const itemB = zB[k];
    if (itemA?.systemValue !== itemB?.systemValue) {
      newInferences.push({
        key: k,
        label: itemB?.label || itemA?.label || k,
        valueA: itemA?.systemValue,
        valueB: itemB?.systemValue,
      });
    }
  });

  // Conflictos resueltos
  const confA = eciA?.conflicts || [];
  const confB = eciB?.conflicts || [];
  const resolvedConflicts = confB
    .filter((c) => c.status === 'RECONCILED' && !confA.some((ca) => ca.conflict_id === c.conflict_id && ca.status === 'RECONCILED'))
    .map((c) => ({
      id: c.conflict_id,
      description: c.description,
      resolution: c.reconciliation?.reason,
    }));

  // Nuevas incertidumbres
  const uA = eciA?.components?.U_t || [];
  const uB = eciB?.components?.U_t || [];
  const uncAIds = new Set(uA.map((u) => u.uncertainty_id));
  const newUncertainties = uB
    .filter((u) => !uncAIds.has(u.uncertainty_id))
    .map((u) => ({
      id: u.uncertainty_id,
      type: u.type,
      description: u.description,
    }));

  return {
    vA: eciA.version,
    vB: eciB.version,
    targetVersion: eciA.version,
    currentVersion: eciB.version,
    newObservations,
    changedValues,
    newInferences,
    resolvedConflicts,
    newUncertainties,
    supersededAssertions: changedValues.map(
      (c) => `La afirmación previa de ${c.variable} = ${c.valueA} fue superada por el registro más reciente = ${c.valueB}`
    ),
  };
}
