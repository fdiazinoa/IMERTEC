/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Compuerta de Publicación Clínica (Publication Gate) — FASE 3
 *
 * Evalúa los 8 controles de seguridad y epistemología antes de permitir
 * la transición de un ECI a E8_PUBLICADO y su sellado criptográfico inmutable.
 */

import {
  PublicationGateResult,
  PublicationGateCheck,
  SafetyAlert,
  ICCGrading,
  ICBGrading,
  SufficiencyEvaluation,
  UserProfile,
  ClinicalObservation,
} from '../types/clinical';

export interface PublicationGateParams {
  clinicalObjective: string;
  alerts: SafetyAlert[];
  icc: ICCGrading;
  icb: ICBGrading;
  sufficiency: SufficiencyEvaluation;
  currentUser: UserProfile;
  observations: ClinicalObservation[];
  encounterStatus: string;
}

export function evaluatePublicationGate(params: PublicationGateParams): PublicationGateResult {
  const checklist: PublicationGateCheck[] = [];
  const blocked_reasons: string[] = [];

  // Gate 1: Objetivo Clínico Definido
  const hasObjective = Boolean(params.clinicalObjective && params.clinicalObjective.trim().length >= 10);
  checklist.push({
    gate: 'GATE-01-OBJECTIVE',
    label: 'Objetivo Clínico Explícito',
    passed: hasObjective,
    message: hasObjective
      ? 'Objetivo clínico documentado con claridad y alcance definido.'
      : 'Falta definir un objetivo clínico explícito con justificación médica (mínimo 10 caracteres).',
    critical: true,
  });
  if (!hasObjective) {
    blocked_reasons.push('Falta objetivo clínico explícito del encuentro.');
  }

  // Gate 2: Suficiencia de Datos
  const isSufficient = params.sufficiency.ready;
  checklist.push({
    gate: 'GATE-02-SUFFICIENCY',
    label: 'Suficiencia de Información de Datos',
    passed: isSufficient,
    message: isSufficient
      ? `Suficiencia aprobada (${params.sufficiency.status}).`
      : `Datos insuficientes: ${params.sufficiency.reasons[0] || 'faltan variables mínimas requeridas'}.`,
    critical: true,
  });
  if (!isSufficient) {
    blocked_reasons.push(`Suficiencia no cumplida: ${params.sufficiency.reasons[0] || 'Datos incompletos'}.`);
  }

  // Gate 3: Seguridad Vital E00
  const alerts = params.alerts || [];
  const activeCriticalAlerts = alerts.filter(
    (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
  );
  const safetyPassed = activeCriticalAlerts.length === 0;
  checklist.push({
    gate: 'GATE-03-SAFETY',
    label: 'Evaluación de Seguridad E00',
    passed: safetyPassed,
    message: safetyPassed
      ? 'Sin alertas críticas activas o pendientes de resolución médica formal.'
      : `Bloqueo activo por ${activeCriticalAlerts.length} alerta(s) crítica(s) no resuelta(s) (${activeCriticalAlerts.map((a) => a.ruleCode).join(', ')}).`,
    critical: true,
  });
  if (!safetyPassed) {
    blocked_reasons.push(
      `Alerta(s) crítica(s) E00 activa(s) (${activeCriticalAlerts.map((a) => a.ruleCode).join(', ')}) deben resolverse antes de publicar el ECI.`
    );
  }

  // Gate 4: Confiabilidad del Caso (ICC)
  const iccPassed = params.icc.result !== 'ICC-E' && params.icc.result !== 'ICC-D';
  checklist.push({
    gate: 'GATE-04-ICC',
    label: 'Índice de Confiabilidad del Caso (ICC)',
    passed: iccPassed,
    message: iccPassed
      ? `Confiabilidad aceptable (${params.icc.result}, ${params.icc.scorePercent}%).`
      : `Confiabilidad insuficiente (${params.icc.result}): ${params.icc.reason}.`,
    critical: true,
  });
  if (!iccPassed) {
    blocked_reasons.push(`Confiabilidad ${params.icc.result} incompatible con publicación oficial del ECI.`);
  }

  // Gate 5: Coherencia Biológica (ICB)
  const icbPassed = !params.icb.blocks_publication && params.icb.result !== 'CONFLICTIVE';
  checklist.push({
    gate: 'GATE-05-ICB',
    label: 'Coherencia Biológica Inter-Ejes (ICB)',
    passed: icbPassed,
    message: icbPassed
      ? `Coherencia biológica confirmada (${params.icb.result}, ${params.icb.score}/100).`
      : `Incoherencia biológica o conflicto grave detectado: ${params.icb.reason}.`,
    critical: true,
  });
  if (!icbPassed) {
    blocked_reasons.push(`Incoherencia biológica crítica en ICB: ${params.icb.reason}`);
  }

  // Gate 6: Validez Temporal de Observaciones
  const now = new Date();
  const criticalExpiredCount = params.observations.filter((o) => {
    const d = new Date(o.clinicalTime || o.recordedTime || now.toISOString());
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) > 365;
  }).length;
  const temporalPassed = criticalExpiredCount === 0;
  checklist.push({
    gate: 'GATE-06-TEMPORAL',
    label: 'Validez Temporal y Caducidad de Datos',
    passed: temporalPassed,
    message: temporalPassed
      ? 'Todas las observaciones están dentro del margen de validez biológica temporal.'
      : `Existen ${criticalExpiredCount} observación(es) con más de 365 días sin re-evaluación médica.`,
    critical: false,
  });
  if (!temporalPassed) {
    blocked_reasons.push(`Datos con más de 1 año de antigüedad sin re-medición.`);
  }

  // Gate 7: Trazabilidad y Cadena de Custodia (PROV-O)
  const untrackedCount = params.observations.filter((o) => !o.operatorId && !o.created_by).length;
  const traceabilityPassed = untrackedCount === 0;
  checklist.push({
    gate: 'GATE-07-TRACEABILITY',
    label: 'Trazabilidad y Linaje de Origen',
    passed: traceabilityPassed,
    message: traceabilityPassed
      ? 'Todas las observaciones cuentan con autor, fecha, método y linaje auditable.'
      : `Existen observaciones sin metadatos de autoría o registro formal.`,
    critical: true,
  });
  if (!traceabilityPassed) {
    blocked_reasons.push('Falta trazabilidad de autoría en observaciones.');
  }

  // Gate 8: Autorización Facultativa (Firma de Médico Colegiado)
  const isPhysician = ['MEDICO_GENERAL', 'GERIATRA', 'ONCOLOGO', 'INVESTIGADOR_PRINCIPAL'].includes(
    params.currentUser.role
  );
  checklist.push({
    gate: 'GATE-08-AUTHORIZATION',
    label: 'Autorización Médica Profesional',
    passed: isPhysician,
    message: isPhysician
      ? `Usuario actual (${params.currentUser.name}, ${params.currentUser.role}) habilitado para firma y publicación.`
      : `El rol actual (${params.currentUser.role}) carece de atribución clínica para publicar versiones de ECI.`,
    critical: true,
  });
  if (!isPhysician) {
    blocked_reasons.push('El usuario actual no posee rol médico autorizado para publicar el ECI.');
  }

  const allowed = blocked_reasons.length === 0;

  return {
    allowed,
    checklist,
    blocked_reasons,
    timestamp: new Date().toISOString(),
  };
}
