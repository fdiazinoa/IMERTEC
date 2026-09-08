/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Motor de Suficiencia Clínica (FASE 3)
 *
 * Determina objetivamente si un caso reúne la información necesaria y suficiente
 * para los consumidores aguas abajo (especialmente el clasificador SICBE).
 * Nunca asume que un dato faltante es normal.
 */

import {
  DomainScoreSummary,
  SafetyAlert,
  ICCGrading,
  SufficiencyEvaluation,
  DataGap,
  Conflict,
} from '../types/clinical';

export interface SufficiencyEvaluationInputs {
  patientId: string;
  domains: DomainScoreSummary[];
  alerts: SafetyAlert[];
  icc: ICCGrading;
  dataGaps: DataGap[];
  conflicts: Conflict[];
}

/**
 * Evalúa la suficiencia clínica para el consumidor canónico SICBE.
 */
export function evaluateSufficiencyForSICBE(inputs: SufficiencyEvaluationInputs): SufficiencyEvaluation {
  const reasons: string[] = [];
  const missingDomains: string[] = [];
  const activeBlockingFactors: string[] = [];

  const alerts = inputs.alerts || [];
  const conflicts = inputs.conflicts || [];
  const domains = inputs.domains || [];
  const dataGaps = inputs.dataGaps || [];

  // 1. Alertas Críticas E00 (Bloqueo absoluto)
  const activeCriticalAlerts = alerts.filter(
    (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
  );

  if (activeCriticalAlerts.length > 0) {
    const alertNames = activeCriticalAlerts.map((a) => `${a.ruleCode}: ${a.title}`).join(', ');
    activeBlockingFactors.push(`Alerta de seguridad E00 activa (${alertNames})`);
    reasons.push(
      `Regla PD-005: Proceso oncológico activo o alarma crítica E00 activa supera la escala del instrumento. La clasificación biológica se suspende de forma segura.`
    );
  }

  // 2. Confiabilidad del Caso (ICC)
  if (inputs.icc?.result === 'ICC-E') {
    activeBlockingFactors.push('ICC-E (Expediente insuficiente o no verificable)');
    reasons.push('El Índice de Confiabilidad del Caso es ICC-E: abstención analítica obligatoria por falta de sustento epistemológico.');
  } else if (inputs.icc?.result === 'ICC-D') {
    activeBlockingFactors.push('ICC-D (Información fragmentaria o severas brechas)');
    reasons.push('El Índice de Confiabilidad es ICC-D: no apto para inferencia diagnóstica o clasificación biológica definitiva.');
  }

  // 3. Conflictos críticos no reconciliados
  const openCriticalConflicts = conflicts.filter(
    (c) => (c.status === 'OPEN' || c.status === 'UNDER_REVIEW') && c.severity === 'CRITICAL'
  );
  if (openCriticalConflicts.length > 0) {
    activeBlockingFactors.push('Conflictos clínicos críticos pendientes de reconciliación médica');
    reasons.push(
      `Existen ${openCriticalConflicts.length} conflicto(s) crítico(s) de datos entre fuentes analíticas sin resolución médica formal.`
    );
  }

  // 4. Dominios biológicos obligatorios (mínimo 5 de 8)
  const activeDomains = domains.filter((d) => d.status !== 'SIN_DATOS');
  domains.forEach((d) => {
    if (d.status === 'SIN_DATOS') {
      missingDomains.push(`${d.domainId} (${d.domainName})`);
    }
  });

  if (activeDomains.length < 5) {
    activeBlockingFactors.push(`Dominios biológicos insuficientes (${activeDomains.length}/8 activos)`);
    reasons.push(
      `Criterio de suficiencia insuficiente: se requieren al menos 5 de los 8 dominios biológicos con mediciones activas (actualmente: ${activeDomains.length}).`
    );
  }

  // 5. Brechas críticas de datos
  const criticalGaps = dataGaps.filter((g) => g.blocking && !g.resolved_at);
  if (criticalGaps.length > 0) {
    activeBlockingFactors.push(`Brechas críticas de datos obligatorios (${criticalGaps.length})`);
    reasons.push(`Variables canónicas críticas ausentes: ${criticalGaps.map((g) => g.variable_name || g.variable_id).join(', ')}.`);
  }

  // Determinación de estado final
  let status: SufficiencyEvaluation['status'] = 'READY';
  let ready = true;

  if (activeBlockingFactors.length > 0) {
    status = activeCriticalAlerts.length > 0 ? 'BLOCKED' : 'NOT_READY';
    ready = false;
  } else if (inputs.icc.result === 'ICC-C' || missingDomains.length > 0) {
    status = 'READY_WITH_RESERVATIONS';
    ready = true;
    reasons.push('Información suficiente para cálculo SICBE con panel esencial, admitiendo reservas documentadas.');
  } else {
    status = 'READY';
    ready = true;
    reasons.push('Expediente completo y coherente. Cumple todos los criterios de suficiencia para clasificación biológica formal.');
  }

  return {
    consumer: 'SICBE_CLASSIFIER_V1',
    ready,
    ready_for_sicbe: ready && status !== 'BLOCKED',
    status,
    reasons,
    missingDomains,
    activeBlockingFactors,
    timestamp: new Date().toISOString(),
  };
}
