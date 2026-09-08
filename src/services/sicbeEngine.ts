/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Motor Independiente del Clasificador Biológico SICBE (SICBE Engine v1.0)
 * 8 Dominios Biológicos + 65 Biomarcadores + SGEB (SGEB-C / SGEB-E) + Estados I–V + Reglas PD-001 a PD-006
 * Conforme a IMERTEC-ECO-001 Edición 2.2 / Documento 6 Borrador 1
 */

import {
  DomainId,
  DomainStatus,
  SICBEState,
  ECI,
  ClinicalObservation,
  SafetyAlert,
  Conflict,
  Uncertainty,
  ICCGrading,
  BiomarkerDefinition,
  EvaluatedBiomarker,
  DomainAssessment,
  DomainWeightSet,
  RuleExecutionRecord,
  SICBESufficiencyEvaluation,
  SICBEAssessment,
  SICBEExplanation,
  AssessmentComparability,
  SICBEExecutionParams,
} from '../types/clinical';

import {
  SICBE_DOMAINS_METADATA,
  DEFAULT_DOMAIN_WEIGHT_SET,
  SICBE_65_BIOMARKERS,
  SICBE_CANDIDATE_BIOMARKERS,
  ALL_BIOMARKER_DEFINITIONS,
  getBiomarkersByDomain,
} from '../data/sicbeBiomarkersData';

/**
 * 1. EVALUADOR DE SUFICIENCIA SICBE (Sufficiency Gate)
 * Determina si el ECI publicado cuenta con las condiciones epistemológicas y de seguridad
 * necesarias para ejecutar la clasificación biológica.
 */
export function evaluateSICBESufficiency(params: {
  eci: ECI;
  alerts?: SafetyAlert[];
  conflicts?: Conflict[];
  icc?: ICCGrading;
}): SICBESufficiencyEvaluation {
  const reasons: string[] = [];
  const blocking_factors: string[] = [];
  const alerts = params.alerts || [];
  const conflicts = params.conflicts || [];
  const observations = params.eci?.components?.X_t || [];

  // A. Publicación del ECI
  const eciPublished =
    !!params.eci?.is_immutable ||
    ['E8_PUBLICADO', 'E9_ARCHIVADO', 'E10_AUDITADO'].includes(params.eci?.status || '');
  if (!eciPublished) {
    blocking_factors.push('ECI_NOT_PUBLISHED');
    reasons.push('El ECI no se encuentra en estado publicado/sellado criptográficamente. SICBE consume exclusivamente ECI inmutable.');
  }

  // B. Seguridad Vital E00
  const activeCriticalAlerts = alerts.filter(
    (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
  );
  const e00Resolved = activeCriticalAlerts.length === 0;
  if (!e00Resolved) {
    blocking_factors.push('E00_ACTIVE_EMERGENCY');
    reasons.push(
      `Alarma vital E00 activa (${activeCriticalAlerts.map((a) => a.ruleCode || a.title).join(', ')}). Clasificación suspendida por seguridad clínica.`
    );
  }

  // C. Confiabilidad del Caso (ICC)
  const iccResult = params.icc?.result || 'ICC-B';
  const iccCompatible = iccResult !== 'ICC-E' && iccResult !== 'ICC-D';
  if (iccResult === 'ICC-E') {
    blocking_factors.push('ICC_E_CRITICAL_GAP');
    reasons.push('Índice de Confiabilidad del Caso es ICC-E: expediente no verificable, abstención analítica obligatoria.');
  } else if (iccResult === 'ICC-D') {
    blocking_factors.push('ICC_D_FRAGMENTARY');
    reasons.push('Índice de Confiabilidad es ICC-D: severas brechas informativas, no apto para clasificación biológica formal.');
  }

  // D. Conflictos Críticos no reconciliados
  const openCriticalConflicts = conflicts.filter(
    (c) => (c.status === 'OPEN' || c.status === 'UNDER_REVIEW') && c.severity === 'CRITICAL'
  );
  const criticalConflictsResolved = openCriticalConflicts.length === 0;
  if (!criticalConflictsResolved) {
    blocking_factors.push('CRITICAL_CONFLICT_UNRESOLVED');
    reasons.push(`Conflicto clínico crítico no reconciliado (${openCriticalConflicts.length} activos).`);
  }

  // E. Dominios con datos disponibles
  const recognizedVars = new Set(
    observations.map((o) => o.canonicalVariableId || o.variableName || o.variableId)
  );
  const activeDomainsCount = (['D-I', 'D-II', 'D-III', 'D-IV', 'D-V', 'D-VI', 'D-VII', 'D-VIII'] as DomainId[]).filter(
    (dId) => {
      const domBios = getBiomarkersByDomain(dId);
      return domBios.some((b) => recognizedVars.has(b.variable_id) || recognizedVars.has(b.code));
    }
  ).length;

  const mandatoryDataAvailable = activeDomainsCount >= 5;
  if (!mandatoryDataAvailable) {
    blocking_factors.push('INSUFFICIENT_DOMAINS');
    reasons.push(`Se detectaron datos en únicamente ${activeDomainsCount} de los 8 dominios biológicos (mínimo requerido: 5 dominios).`);
  }

  // F. Validez temporal de datos (no todos vencidos)
  const now = new Date();
  const validObservations = observations.filter((o) => {
    const obsDate = new Date(o.clinicalTime || o.recordedTime || now.toISOString());
    const daysOld = (now.getTime() - obsDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysOld <= 365;
  });
  const dataTemporallyValid = validObservations.length > 0;
  if (!dataTemporallyValid && observations.length > 0) {
    blocking_factors.push('ALL_DATA_EXPIRED');
    reasons.push('La totalidad de observaciones supera el período de validez temporal clínica (>365 días). Se requiere actualización.');
  }

  // Determinar status final
  let status: SICBESufficiencyEvaluation['status'] = 'READY';
  if (blocking_factors.length > 0) {
    if (blocking_factors.includes('E00_ACTIVE_EMERGENCY') || blocking_factors.includes('ICC_E_CRITICAL_GAP')) {
      status = 'BLOCKED';
    } else if (blocking_factors.includes('INSUFFICIENT_DOMAINS') || blocking_factors.includes('ECI_NOT_PUBLISHED')) {
      status = 'NOT_READY';
    } else {
      status = 'READY_WITH_RESERVATIONS';
    }
  } else if (activeDomainsCount < 8 || iccResult === 'ICC-C') {
    status = 'READY_WITH_RESERVATIONS';
    reasons.push(`Panel con cobertura parcial (${activeDomainsCount}/8 dominios) o ICC-C. Admite cálculo SGEB-E.`);
  }

  return {
    status,
    eci_published: eciPublished,
    icc_compatible: iccCompatible,
    e00_resolved: e00Resolved,
    mandatory_data_available: mandatoryDataAvailable,
    critical_conflicts_resolved: criticalConflictsResolved,
    required_domains_count: activeDomainsCount,
    data_temporally_valid: dataTemporallyValid,
    reasons,
    blocking_factors,
  };
}

/**
 * 2. NORMALIZACIÓN CONTINUA DE BIOMARCADORES (Escala 0 a 100)
 * 0 = Óptimo biológico (juventud / reserva máxima)
 * 100 = Máxima carga de senescencia / daño biológico / colapso funcional
 */
export function normalizeBiomarkerValue(
  def: BiomarkerDefinition,
  rawVal: any
): { normalized: number; status: EvaluatedBiomarker['status']; referenceText: string } {
  const num = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
  if (isNaN(num)) {
    return { normalized: 50, status: 'NORMAL', referenceText: def.reference.text };
  }

  let normalized = 50;
  let status: EvaluatedBiomarker['status'] = 'NORMAL';

  if (def.direction === 'HIGHER_WORSE') {
    // Ejemplo: IL-6, hs-CRP, 8-OHdG, cfPWV, DunedinPACE
    const maxRef = def.reference.max ?? 10;
    if (num <= maxRef * 0.7) {
      normalized = Math.max(5, (num / maxRef) * 25);
      status = 'NORMAL';
    } else if (num <= maxRef) {
      normalized = 25 + ((num - maxRef * 0.7) / (maxRef * 0.3)) * 20;
      status = 'NORMAL';
    } else if (num <= maxRef * 1.5) {
      normalized = 45 + ((num - maxRef) / (maxRef * 0.5)) * 20;
      status = 'BORDERLINE';
    } else if (num <= maxRef * 2.5) {
      normalized = 65 + ((num - maxRef * 1.5) / maxRef) * 20;
      status = 'ELEVATED';
    } else {
      normalized = Math.min(100, 85 + ((num - maxRef * 2.5) / (maxRef * 2)) * 15);
      status = 'CRITICAL';
    }
  } else if (def.direction === 'LOWER_WORSE') {
    // Ejemplo: Dinamometría, velocidad de marcha, eGFR, NAD+, Albúmina
    const minRef = def.reference.min ?? 10;
    if (num >= minRef * 1.3) {
      normalized = Math.max(5, 25 - ((num - minRef * 1.3) / minRef) * 20);
      status = 'NORMAL';
    } else if (num >= minRef) {
      normalized = 25 + ((minRef * 1.3 - num) / (minRef * 0.3)) * 20;
      status = 'NORMAL';
    } else if (num >= minRef * 0.75) {
      normalized = 45 + ((minRef - num) / (minRef * 0.25)) * 20;
      status = 'BORDERLINE';
    } else if (num >= minRef * 0.5) {
      normalized = 65 + ((minRef * 0.75 - num) / (minRef * 0.25)) * 20;
      status = 'ELEVATED';
    } else {
      normalized = Math.min(100, 85 + ((minRef * 0.5 - num) / (minRef * 0.5)) * 15);
      status = 'CRITICAL';
    }
  } else if (def.direction === 'BIDIRECTIONAL') {
    // Ejemplo: CD4/CD8 ratio (inversión <1 o elevación >3.5)
    const minRef = def.reference.min ?? 1.0;
    const maxRef = def.reference.max ?? 3.0;
    if (num >= minRef && num <= maxRef) {
      normalized = 20;
      status = 'NORMAL';
    } else if (num < minRef) {
      normalized = Math.min(95, 45 + ((minRef - num) / minRef) * 50);
      status = num < minRef * 0.5 ? 'CRITICAL' : 'ELEVATED';
    } else {
      normalized = Math.min(85, 45 + ((num - maxRef) / maxRef) * 40);
      status = 'ELEVATED';
    }
  }

  normalized = Number(Math.max(0, Math.min(100, normalized)).toFixed(1));
  return { normalized, status, referenceText: def.reference.text };
}

/**
 * 3. MAPEO Y VALIDACIÓN DE BIOMARCADORES DESDE EL ECI
 */
export function mapECIObservationsToBiomarkers(
  eci: ECI,
  previousAssessment?: SICBEAssessment
): {
  biomarkers: Record<string, EvaluatedBiomarker>;
  availableCount: number;
  expiredCount: number;
  imputedCount: number;
} {
  const observations = eci?.components?.X_t || [];
  const result: Record<string, EvaluatedBiomarker> = {};
  const now = new Date();

  // Indexar observaciones por canonicalVariableId, variableName y variableId
  const obsLookup = new Map<string, ClinicalObservation>();
  observations.forEach((obs) => {
    if (obs.canonicalVariableId) obsLookup.set(obs.canonicalVariableId, obs);
    if (obs.variableName) obsLookup.set(obs.variableName, obs);
    if (obs.id) obsLookup.set(obs.id, obs);
    // Aliases comunes
    if (obs.canonicalVariableId === 'DMV-0010') obsLookup.set('GRIP_STRENGTH', obs);
    if (obs.canonicalVariableId === 'DMV-0011') obsLookup.set('GAIT_SPEED', obs);
    if (obs.canonicalVariableId === 'DMV-0032') obsLookup.set('IL6_HS', obs);
    if (obs.canonicalVariableId === 'DMV-0031') obsLookup.set('HS_CRP', obs);
    if (obs.canonicalVariableId === 'DMV-0030') obsLookup.set('8_OHDG', obs);
    if (obs.canonicalVariableId === 'DMV-0001') obsLookup.set('SBP_INTEGRATED', obs);
  });

  let availableCount = 0;
  let expiredCount = 0;

  // Evaluar todos los 65 biomarcadores + candidatos
  ALL_BIOMARKER_DEFINITIONS.forEach((def) => {
    const matchedObs =
      obsLookup.get(def.variable_id) ||
      obsLookup.get(def.code) ||
      obsLookup.get(def.biomarker_id);

    // Buscar valor histórico previo para deltas y trayectorias
    const prevBio = previousAssessment?.biomarkers[def.biomarker_id];
    let prevValRecord: EvaluatedBiomarker['previous_value'] | undefined;
    if (prevBio && prevBio.status !== 'MISSING') {
      const prevNum = typeof prevBio.value === 'number' ? prevBio.value : parseFloat(String(prevBio.value));
      const currNum = matchedObs ? (typeof matchedObs.value === 'number' ? matchedObs.value : parseFloat(String(matchedObs.value))) : undefined;
      let delta: number | undefined;
      let trend: 'UP' | 'DOWN' | 'STABLE' | undefined;

      if (!isNaN(prevNum) && currNum !== undefined && !isNaN(currNum)) {
        delta = Number((currNum - prevNum).toFixed(2));
        if (Math.abs(delta) < 0.05) trend = 'STABLE';
        else trend = delta > 0 ? 'UP' : 'DOWN';
      }

      prevValRecord = {
        value: prevBio.value,
        date: prevBio.clinical_time,
        delta,
        trend,
      };
    }

    if (matchedObs) {
      const obsDate = new Date(matchedObs.clinicalTime || matchedObs.recordedTime || now.toISOString());
      const ageDays = (now.getTime() - obsDate.getTime()) / (1000 * 60 * 60 * 24);
      const isExpired = ageDays > def.validity_period_days;

      if (isExpired) {
        expiredCount++;
      } else {
        availableCount++;
      }

      const { normalized, status, referenceText } = normalizeBiomarkerValue(def, matchedObs.value);

      result[def.biomarker_id] = {
        biomarker_id: def.biomarker_id,
        variable_id: def.variable_id,
        code: def.code,
        name: def.name,
        domain_id: def.domain_id,
        analysis_level: def.analysis_level,
        value: matchedObs.value,
        normalized_value: normalized,
        unit: matchedObs.unit || def.unit,
        clinical_time: matchedObs.clinicalTime || matchedObs.recordedTime || now.toISOString(),
        source: matchedObs.source || 'Observación Clínica ECI',
        method: def.method,
        reference_text: referenceText,
        status: isExpired ? 'EXPIRED' : status,
        is_expired: isExpired,
        validity_period_days: def.validity_period_days,
        is_imputed: false,
        weight: def.weight,
        contribution: 0, // calculado posteriormente en el dominio
        eci_version: eci.version,
        authorized_use: def.authorized_use,
        lifecycle_status: def.lifecycle_status,
        previous_value: prevValRecord,
      };
    } else {
      // Biomarcador no medido
      result[def.biomarker_id] = {
        biomarker_id: def.biomarker_id,
        variable_id: def.variable_id,
        code: def.code,
        name: def.name,
        domain_id: def.domain_id,
        analysis_level: def.analysis_level,
        value: 'NO_MEDIDO',
        normalized_value: 50,
        unit: def.unit,
        clinical_time: '',
        source: 'Sin registro en ECI',
        method: def.method,
        reference_text: def.reference.text,
        status: 'MISSING',
        is_expired: false,
        validity_period_days: def.validity_period_days,
        is_imputed: false,
        weight: def.weight,
        contribution: 0,
        eci_version: eci.version,
        authorized_use: def.authorized_use,
        lifecycle_status: def.lifecycle_status,
        previous_value: prevValRecord,
      };
    }
  });

  return {
    biomarkers: result,
    availableCount,
    expiredCount,
    imputedCount: 0,
  };
}

/**
 * 4. CÁLCULO DE SCORE POR DOMINIO (Domain Scoring Engine)
 * Motor genérico aplicable a los 8 dominios a través de configuración y pesos.
 */
export function calculateDomainScore(
  domainId: DomainId,
  biomarkers: Record<string, EvaluatedBiomarker>,
  weightSet: DomainWeightSet,
  previousDomain?: DomainAssessment
): DomainAssessment {
  const meta = SICBE_DOMAINS_METADATA[domainId];
  const domDefBios = getBiomarkersByDomain(domainId);
  const domainWeight = weightSet.weights[domainId] ?? meta.defaultWeight;

  const available: EvaluatedBiomarker[] = [];
  const missing: string[] = [];
  const critical: string[] = [];
  const dominantFindings: string[] = [];

  let weightedSum = 0;
  let totalWeight = 0;

  domDefBios.forEach((def) => {
    const evaluated = biomarkers[def.biomarker_id];
    if (!evaluated || evaluated.status === 'MISSING') {
      missing.push(`${def.code} (${def.name})`);
      return;
    }

    if (evaluated.is_expired) {
      missing.push(`${def.code} [EXPIRADO hace >${def.validity_period_days}d]`);
      return;
    }

    // Solo biomarcadores asistenciales operativos computan para el score clínico
    if (def.authorized_use === 'RESEARCH_ONLY' || def.lifecycle_status !== 'OPERATIONAL') {
      return;
    }

    available.push(evaluated);
    weightedSum += evaluated.normalized_value * def.weight;
    totalWeight += def.weight;

    if (evaluated.status === 'CRITICAL') {
      critical.push(`${def.name}: ${evaluated.value} ${evaluated.unit}`);
      dominantFindings.push(`Alteración crítica en ${def.name} (${evaluated.normalized_value}/100)`);
    } else if (evaluated.status === 'ELEVATED') {
      dominantFindings.push(`Elevación patológica en ${def.name}`);
    }
  });

  const completeness = Number(((available.length / domDefBios.length) * 100).toFixed(1));

  let rawScore = 0;
  let normalizedScore = 0;
  let status: DomainStatus = 'SIN_DATOS';

  if (available.length > 0 && totalWeight > 0) {
    rawScore = Number((weightedSum / totalWeight).toFixed(1));
    normalizedScore = rawScore;

    // Asignar estado del dominio según umbrales canónicos SICBE
    if (normalizedScore <= 15) {
      status = 'PRESERVADO_EXCEPCIONAL';
    } else if (normalizedScore <= 25) {
      status = 'OPTIMO';
    } else if (normalizedScore <= 45) {
      status = 'PRESERVADO';
    } else if (normalizedScore <= 60) {
      status = 'VIGILANCIA';
    } else if (normalizedScore <= 75) {
      status = 'COMPROMETIDO';
    } else {
      status = 'ALARMA_ACTIVA';
    }
  } else {
    status = 'SIN_DATOS';
  }

  // Actualizar contribuciones individuales
  available.forEach((b) => {
    b.contribution = Number(((b.normalized_value * b.weight) / (totalWeight || 1)).toFixed(1));
  });

  // Nivel de confianza
  let confidence: DomainAssessment['confidence'] = 'ALTA';
  if (completeness < 35 || available.length === 0) {
    confidence = 'BAJA';
  } else if (completeness < 65) {
    confidence = 'MEDIA';
  }

  // Tendencia longitudinal comparativa
  let trend: DomainAssessment['trend'] = 'INSUFFICIENT_HISTORY';
  if (previousDomain && previousDomain.status !== 'SIN_DATOS' && status !== 'SIN_DATOS') {
    const diff = normalizedScore - previousDomain.normalized_score;
    if (Math.abs(diff) <= 3) trend = 'STABLE';
    else if (diff > 3) trend = 'WORSENING'; // mayor score = peor estado
    else trend = 'IMPROVING';
  }

  const weighted_score = Number(((normalizedScore * domainWeight) / 100).toFixed(2));

  return {
    domain_id: domainId,
    domain_name: meta.name,
    raw_score: rawScore,
    normalized_score: normalizedScore,
    weight: domainWeight,
    weighted_score,
    completeness,
    confidence,
    status,
    available_biomarkers: available,
    missing_biomarkers: missing,
    critical_biomarkers: critical,
    uncertainty: missing.length > 3 ? [`${missing.length} biomarcadores ausentes aumentan la incertidumbre en este dominio`] : [],
    dominant_findings: dominantFindings,
    trend,
  };
}

/**
 * 5. EJECUTOR DE REGLAS DE CLASIFICACIÓN CLÍNICA PD-001 A PD-006
 */
export function executePDRules(
  domains: Record<DomainId, DomainAssessment>,
  sgeb: number,
  stateBySgeb: SICBEState,
  options: {
    hasActiveOncologyE00?: boolean;
    hasCriticalE00?: boolean;
    ca125Value?: number;
  }
): {
  stateByProfile: SICBEState;
  finalAssignedState: SICBEState;
  isDiscordant: boolean;
  isAbstained: boolean;
  abstentionReason?: string;
  ruleRecords: RuleExecutionRecord[];
} {
  const ruleRecords: RuleExecutionRecord[] = [];
  const now = new Date().toISOString();

  const d7 = domains['D-VII'];
  const d6 = domains['D-VI'];
  const d8 = domains['D-VIII'];

  const allDomainsList = Object.values(domains);
  const compromisedOrAlarmCount = allDomainsList.filter(
    (d) => d.status === 'COMPROMETIDO' || d.status === 'ALARMA_ACTIVA'
  ).length;

  let stateByProfile: SICBEState = stateBySgeb;
  let isAbstained = false;
  let abstentionReason: string | undefined;

  // -------------------------------------------------------------
  // REGLA PD-005: Proceso Oncológico Activo o Emergencia Clínica Vital E00
  // -------------------------------------------------------------
  const pd005Triggered =
    !!options.hasActiveOncologyE00 ||
    !!options.hasCriticalE00 ||
    (options.ca125Value !== undefined && options.ca125Value >= 350);

  ruleRecords.push({
    rule_id: 'PD-005',
    rule_version: '1.0.0',
    inputs: {
      hasActiveOncologyE00: !!options.hasActiveOncologyE00,
      hasCriticalE00: !!options.hasCriticalE00,
      ca125Value: options.ca125Value,
    },
    triggered: pd005Triggered,
    result: pd005Triggered ? 'NO_CLASIFICABLE' : 'PASS',
    reason: pd005Triggered
      ? 'PD-005 (Bloqueo Absoluto): Proceso oncológico activo sospechado o emergencia vital E00 desborda la escala del instrumento de envejecimiento. Clasificación biológica suspendida de forma segura.'
      : 'PD-005: Sin evidencia de proceso oncológico activo o alarma E00 que impida la clasificación.',
    timestamp: now,
  });

  if (pd005Triggered) {
    return {
      stateByProfile: 'NO_CLASIFICABLE',
      finalAssignedState: 'NO_CLASIFICABLE',
      isDiscordant: true,
      isAbstained: true,
      abstentionReason:
        'Regla PD-005: Proceso oncológico sospechado o alarma E00 activa. La clasificación SICBE se abstiene de forma segura hasta resolución y estabilización onco-clínica.',
      ruleRecords,
    };
  }

  // -------------------------------------------------------------
  // REGLA PD-001: Pérdida Severa de Reserva Funcional
  // -------------------------------------------------------------
  const pd001Triggered = d7 && d7.status === 'ALARMA_ACTIVA';
  ruleRecords.push({
    rule_id: 'PD-001',
    rule_version: '1.0.0',
    inputs: { d7_status: d7?.status, d7_score: d7?.normalized_score },
    triggered: !!pd001Triggered,
    result: pd001Triggered ? 'ESTADO_IV' : 'PASS',
    reason: pd001Triggered
      ? 'PD-001: Dominio VII (Reserva Funcional) en ALARMA ACTIVA (score >= 76). Determina fragilidad biológica manifiesta (mínimo Estado IV).'
      : 'PD-001: Reserva funcional no se encuentra en colapso crítico.',
    timestamp: now,
  });

  // -------------------------------------------------------------
  // REGLA PD-002: Inflammaging Severo con Fallo Sistémico
  // -------------------------------------------------------------
  const pd002Triggered = d6 && d6.status === 'ALARMA_ACTIVA' && d8 && d8.status === 'ALARMA_ACTIVA';
  ruleRecords.push({
    rule_id: 'PD-002',
    rule_version: '1.0.0',
    inputs: { d6_status: d6?.status, d8_status: d8?.status },
    triggered: !!pd002Triggered,
    result: pd002Triggered ? 'ESTADO_IV' : 'PASS',
    reason: pd002Triggered
      ? 'PD-002: Inflamación sistémica severa (D-VI en Alarma) combinada con afección sistémica/vascular (D-VIII en Alarma). Asigna mínimo Estado IV.'
      : 'PD-002: No se cumple criterio simultáneo de alarma D-VI + D-VIII.',
    timestamp: now,
  });

  // -------------------------------------------------------------
  // REGLA PD-003: Afección Multiorgánica Senescente (>=6 dominios comprometidos)
  // -------------------------------------------------------------
  const pd003Triggered = compromisedOrAlarmCount >= 6;
  ruleRecords.push({
    rule_id: 'PD-003',
    rule_version: '1.0.0',
    inputs: { compromisedOrAlarmCount },
    triggered: pd003Triggered,
    result: pd003Triggered ? 'ESTADO_V' : 'PASS',
    reason: pd003Triggered
      ? `PD-003: Colapso biológico generalizado con ${compromisedOrAlarmCount} dominios comprometidos o en alarma. Clasifica como Estado V (Fragilidad biológica severa).`
      : 'PD-003: Menos de 6 dominios comprometidos simultáneamente.',
    timestamp: now,
  });

  // -------------------------------------------------------------
  // REGLA PD-004: Preservación Funcional Excepcional
  // -------------------------------------------------------------
  const pd004Triggered =
    d7 &&
    (d7.status === 'PRESERVADO' || d7.status === 'PRESERVADO_EXCEPCIONAL' || d7.status === 'OPTIMO') &&
    compromisedOrAlarmCount <= 1;
  ruleRecords.push({
    rule_id: 'PD-004',
    rule_version: '1.0.0',
    inputs: { d7_status: d7?.status, compromisedOrAlarmCount },
    triggered: !!pd004Triggered,
    result: pd004Triggered ? 'ESTADO_II' : 'PASS',
    reason: pd004Triggered
      ? 'PD-004: Alta reserva funcional motora (D-VII preservado) y afección aislada (<=1 dominio comprometido). Limita el estado a Estado II.'
      : 'PD-004: No cumple criterio de reserva funcional altamente preservada con perfil conservado.',
    timestamp: now,
  });

  // Determinar estado por perfil
  if (pd003Triggered) {
    stateByProfile = 'ESTADO_V';
  } else if (pd001Triggered || pd002Triggered) {
    stateByProfile = 'ESTADO_IV';
  } else if (compromisedOrAlarmCount >= 4) {
    stateByProfile = 'ESTADO_IV';
  } else if (compromisedOrAlarmCount >= 2) {
    stateByProfile = 'ESTADO_III';
  } else if (pd004Triggered) {
    stateByProfile = 'ESTADO_II';
  }

  // -------------------------------------------------------------
  // REGLA PD-006: Resolución de Discordancia (Principio de Prudencia Clínica)
  // -------------------------------------------------------------
  const stateSeverityRank: Record<SICBEState, number> = {
    'ESTADO_I': 1,
    'ESTADO_II': 2,
    'ESTADO_III': 3,
    'ESTADO_IV': 4,
    'ESTADO_V': 5,
    'NO_CLASIFICABLE': 0,
  };

  const rankSgeb = stateSeverityRank[stateBySgeb] || 1;
  const rankProfile = stateSeverityRank[stateByProfile] || 1;
  const isDiscordant = rankSgeb !== rankProfile;

  // Criterio conservador: prevalece el estado de mayor severidad clínica
  const finalAssignedState: SICBEState = rankProfile > rankSgeb ? stateByProfile : stateBySgeb;

  ruleRecords.push({
    rule_id: 'PD-006',
    rule_version: '1.0.0',
    inputs: { stateBySgeb, stateByProfile, sgeb },
    triggered: isDiscordant,
    result: finalAssignedState,
    reason: isDiscordant
      ? `PD-006 (Resolución de Discordancia): El estado por SGEB (${stateBySgeb}) difiere del estado por Perfil de Dominios (${stateByProfile}). Por prudencia clínica se asigna el estado más desfavorable (${finalAssignedState}), requiriendo ponderación médica.`
      : 'PD-006: Coherencia plena entre el cálculo SGEB y el perfil fenotípico de dominios.',
    timestamp: now,
  });

  return {
    stateByProfile,
    finalAssignedState,
    isDiscordant,
    isAbstained: false,
    ruleRecords,
  };
}

/**
 * 6. GENERADOR DE EXPLICABILIDAD CLÍNICA
 */
export function generateSICBEExplanation(
  state: SICBEState,
  sgeb: number,
  domains: Record<DomainId, DomainAssessment>,
  rules: RuleExecutionRecord[],
  sgebType: 'SGEB-C' | 'SGEB-E',
  completenessPct: number
): SICBEExplanation {
  const allDoms = Object.values(domains);

  // Ordenar dominios por normalized_score descendente
  const sortedByDamage = [...allDoms].sort((a, b) => b.normalized_score - a.normalized_score);
  const most_affected_domains = sortedByDamage
    .filter((d) => d.status === 'COMPROMETIDO' || d.status === 'ALARMA_ACTIVA' || d.normalized_score >= 50)
    .slice(0, 3)
    .map((d) => d.domain_id);

  const preserved_domains = sortedByDamage
    .filter((d) => d.status === 'PRESERVADO_EXCEPCIONAL' || d.status === 'OPTIMO' || d.status === 'PRESERVADO')
    .map((d) => d.domain_id);

  const key_biomarkers: string[] = [];
  allDoms.forEach((d) => {
    d.critical_biomarkers.forEach((cb) => key_biomarkers.push(cb));
  });

  const rules_summary = rules.filter((r) => r.triggered).map((r) => `${r.rule_id}: ${r.reason}`);

  const limitations: string[] = [];
  if (sgebType === 'SGEB-E') {
    limitations.push('Evaluación SGEB-E (Esencial): No constituye evaluación biológica completa; cobertura parcial de dominios.');
  }
  if (completenessPct < 70) {
    limitations.push(`Cobertura de biomarcadores del ${completenessPct}%: se recomienda ampliar panel analítico para mayor precisión.`);
  }

  const sgeb_summary =
    state === 'NO_CLASIFICABLE'
      ? 'Clasificación biológica no asignable por criterio de abstención segura.'
      : `SGEB de ${sgeb.toFixed(1)} puntos (${sgebType}), situando al paciente en ${state} con mayor impacto en ${most_affected_domains.join(', ') || 'ningún dominio crítico'}.`;

  return {
    sgeb_summary,
    most_affected_domains,
    preserved_domains,
    key_biomarkers: key_biomarkers.slice(0, 6),
    rules_summary,
    limitations,
  };
}

/**
 * 7. EVALUADOR DE COMPARABILIDAD ENTRE VERSIONES HISTÓRICAS
 * Garantiza no confundir cambios de cobertura analítica con mejoría o deterioro biológico.
 */
export function evaluateAssessmentComparability(
  assessmentA: SICBEAssessment,
  assessmentB: SICBEAssessment
): AssessmentComparability {
  const notes: string[] = [];
  const coverageDelta = Number((assessmentB.completeness_pct - assessmentA.completeness_pct).toFixed(1));

  const isDataCoverageChange = Math.abs(coverageDelta) >= 15;
  const isAlgorithmVersionChange = assessmentA.algorithm_version !== assessmentB.algorithm_version;
  const isWeightVersionChange = assessmentA.domain_weight_version !== assessmentB.domain_weight_version;

  if (isAlgorithmVersionChange) {
    notes.push(`Cambio de versión de algoritmo (${assessmentA.algorithm_version} vs ${assessmentB.algorithm_version}).`);
  }
  if (isWeightVersionChange) {
    notes.push(`Cambio en matriz de pesos (${assessmentA.domain_weight_version} vs ${assessmentB.domain_weight_version}).`);
  }
  if (isDataCoverageChange) {
    notes.push(
      `Variación sustancial en cobertura de datos (${assessmentA.completeness_pct}% vs ${assessmentB.completeness_pct}%). Las diferencias pueden reflejar mayor información disponible más que evolución biológica real.`
    );
  }

  let status: AssessmentComparability['status'] = 'FULLY_COMPARABLE';
  if (isAlgorithmVersionChange || isWeightVersionChange) {
    status = 'NOT_COMPARABLE';
  } else if (isDataCoverageChange || assessmentA.assessment_type !== assessmentB.assessment_type) {
    status = 'PARTIALLY_COMPARABLE';
  }

  return {
    status,
    is_data_coverage_change: isDataCoverageChange,
    is_algorithm_version_change: isAlgorithmVersionChange,
    is_weight_version_change: isWeightVersionChange,
    coverage_delta: coverageDelta,
    comparability_notes: notes,
  };
}

/**
 * 8. FUNCIÓN PRINCIPAL DEL MOTOR SICBE: runSICBEAssessment
 * Orquestador completo determinista, reproducible y versionado.
 */
export function runSICBEAssessment(params: SICBEExecutionParams): SICBEAssessment {
  const now = new Date().toISOString();
  const weightSet = params.customWeightSet || DEFAULT_DOMAIN_WEIGHT_SET;

  // A. Evaluar Suficiencia y Seguridad
  const sufficiency = evaluateSICBESufficiency({
    eci: params.eci,
    alerts: params.alerts,
    conflicts: params.conflicts,
    icc: params.icc,
  });

  // B. Mapear y normalizar biomarcadores desde el ECI
  const { biomarkers, availableCount, expiredCount, imputedCount } = mapECIObservationsToBiomarkers(
    params.eci,
    params.previousAssessment
  );

  // C. Calcular scores para los 8 dominios
  const domainIds: DomainId[] = ['D-I', 'D-II', 'D-III', 'D-IV', 'D-V', 'D-VI', 'D-VII', 'D-VIII'];
  const domainsRecord = {} as Record<DomainId, DomainAssessment>;

  domainIds.forEach((dId) => {
    domainsRecord[dId] = calculateDomainScore(
      dId,
      biomarkers,
      weightSet,
      params.previousAssessment?.domains[dId]
    );
  });

  // Cobertura general
  const totalOperationalBios = SICBE_65_BIOMARKERS.length;
  const completenessPct = Number(((availableCount / totalOperationalBios) * 100).toFixed(1));

  // Verificar si hay proceso oncológico sospechado en alertas
  const hasActiveOnco = (params.alerts || []).some(
    (a) => !a.isResolved && (a.ruleCode.includes('ONCO') || a.ruleCode.includes('CA125'))
  );
  const hasCriticalE00 = (params.alerts || []).some(
    (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
  );

  // Abstención obligatoria por Gate de Suficiencia o Alarma Vital
  if (sufficiency.status === 'BLOCKED' || (sufficiency.blocking_factors.length > 0 && !params.isSimulation)) {
    const isE00 = sufficiency.blocking_factors.includes('E00_ACTIVE_EMERGENCY') || hasActiveOnco || hasCriticalE00;

    const rules = executePDRules(domainsRecord, 0, 'NO_CLASIFICABLE', {
      hasActiveOncologyE00: hasActiveOnco,
      hasCriticalE00,
    });

    const explanation = generateSICBEExplanation(
      'NO_CLASIFICABLE',
      0,
      domainsRecord,
      rules.ruleRecords,
      'SGEB-E',
      completenessPct
    );

    return {
      assessment_id: `SICBE-ASSESS-${params.eci.patient_id}-${Date.now()}`,
      patient_id: params.eci.patient_id,
      eci_id: params.eci.eci_id,
      eci_version: params.eci.version,
      eci_hash: params.eci.sha256_hash || 'SHA256-PENDING',
      sicbe_version: '1.0',
      algorithm_version: '1.0.0',
      domain_weight_version: weightSet.version,
      biomarker_definition_version: '2026.1',
      threshold_version: '1.0',
      rule_set_version: 'PD-v1.0',
      dmv_version: 'D4-2.0.0',
      assessment_type: 'ABSTENTION',
      status: 'BLOCKED',
      created_at: now,
      calculated_at: now,
      domains: domainsRecord,
      biomarkers,
      sgeb: 0,
      sgeb_type: 'SGEB-E',
      state: 'NO_CLASIFICABLE',
      state_by_sgeb: 'NO_CLASIFICABLE',
      state_by_profile: 'NO_CLASIFICABLE',
      is_discordant: true,
      is_blocked_or_abstained: true,
      abstention_reason: sufficiency.reasons.join(' | '),
      classification_rules_applied: rules.ruleRecords,
      confidence: 'BAJA',
      completeness_pct: completenessPct,
      imputed_biomarkers_count: 0,
      explanation,
      limitations: sufficiency.reasons,
      is_simulation: !!params.isSimulation,
    };
  }

  // D. Cálculo del SGEB
  let sumWeighted = 0;
  let activeWeightsSum = 0;
  let activeDomainsCount = 0;

  domainIds.forEach((dId) => {
    const d = domainsRecord[dId];
    if (d.status !== 'SIN_DATOS') {
      sumWeighted += d.normalized_score * d.weight;
      activeWeightsSum += d.weight;
      activeDomainsCount++;
    }
  });

  const sgeb = Number((sumWeighted / (activeWeightsSum || 1)).toFixed(1));

  // Determinar si es SGEB-C o SGEB-E
  const isCompletePanel = activeDomainsCount === 8 && completenessPct >= 65 && !params.forceEssentialOnly;
  const sgebType: 'SGEB-C' | 'SGEB-E' = isCompletePanel ? 'SGEB-C' : 'SGEB-E';

  // E. Asignar Estado por Rango SGEB
  let stateBySgeb: SICBEState = 'ESTADO_I';
  if (sgeb <= 25) stateBySgeb = 'ESTADO_I';
  else if (sgeb <= 45) stateBySgeb = 'ESTADO_II';
  else if (sgeb <= 60) stateBySgeb = 'ESTADO_III';
  else if (sgeb <= 75) stateBySgeb = 'ESTADO_IV';
  else stateBySgeb = 'ESTADO_V';

  // F. Ejecutar Reglas PD
  const rulesResult = executePDRules(domainsRecord, sgeb, stateBySgeb, {
    hasActiveOncologyE00: hasActiveOnco,
    hasCriticalE00,
  });

  const finalState = rulesResult.finalAssignedState;

  // Nivel de confianza global
  let overallConfidence: SICBEAssessment['confidence'] = 'ALTA';
  if (completenessPct < 40 || activeDomainsCount < 6) {
    overallConfidence = 'BAJA';
  } else if (completenessPct < 70 || sgebType === 'SGEB-E') {
    overallConfidence = 'MEDIA';
  }

  // Explicabilidad
  const explanation = generateSICBEExplanation(
    finalState,
    sgeb,
    domainsRecord,
    rulesResult.ruleRecords,
    sgebType,
    completenessPct
  );

  return {
    assessment_id: `SICBE-ASSESS-${params.eci.patient_id}-${Date.now()}`,
    patient_id: params.eci.patient_id,
    eci_id: params.eci.eci_id,
    eci_version: params.eci.version,
    eci_hash: params.eci.sha256_hash || 'SHA256-PENDING',
    sicbe_version: '1.0',
    algorithm_version: '1.0.0',
    domain_weight_version: weightSet.version,
    biomarker_definition_version: '2026.1',
    threshold_version: '1.0',
    rule_set_version: 'PD-v1.0',
    dmv_version: 'D4-2.0.0',
    assessment_type: sgebType,
    status: 'CALCULATED',
    created_at: now,
    calculated_at: now,
    domains: domainsRecord,
    biomarkers,
    sgeb,
    sgeb_type: sgebType,
    state: finalState,
    state_by_sgeb: stateBySgeb,
    state_by_profile: rulesResult.stateByProfile,
    is_discordant: rulesResult.isDiscordant,
    is_blocked_or_abstained: rulesResult.isAbstained,
    abstention_reason: rulesResult.abstentionReason,
    classification_rules_applied: rulesResult.ruleRecords,
    confidence: overallConfidence,
    completeness_pct: completenessPct,
    imputed_biomarkers_count: imputedCount,
    explanation,
    limitations: explanation.limitations,
    is_simulation: !!params.isSimulation,
  };
}
