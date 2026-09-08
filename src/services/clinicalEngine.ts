/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Motores Clínicos y Reglas de Inferencia (E00, E21, SICBE)
 * Conforme a IMERTEC-ECO-001 Edición 2.2 / Documento 6 Borrador 1
 */

import {
  DomainId,
  DomainScoreSummary,
  SICBEState,
  InferredStateM23,
  SafetyAlert,
} from '../types/clinical';

export interface VitalsInput {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  ca125?: number; // Marcador tumoral U/mL
  glucose?: number;
  isChestPainAcute?: boolean;
  isAcuteNeuroDeficit?: boolean;
  isSyncopeRecent?: boolean;
  isSuicideRisk?: boolean;
  isActiveBleeding?: boolean;
  isAcuteDelirium?: boolean;
}

export interface FunctionalInput {
  gripStrengthKg?: number;
  gaitSpeedMs?: number;
  biologicalSex: 'Femenino' | 'Masculino' | 'Intersexual';
  age: number;
  bmi?: number;
  abvdDependentCount: number; // 0 a 6
  abvdHelpCount: number; // 0 a 6
  hasSecurityAivdDependent: boolean; // medicamentos, finanzas o transporte
  hasConvenienceAivdDependent: boolean; // compras, teléfono, hogar
  friedComponentsCount: number; // 0 a 5
  muscleMassReduced?: boolean;
  weightLossInvoluntary?: boolean;
  appetiteReduced?: boolean;
  cognitiveComplaint?: boolean;
  dclSuspected?: boolean;
  currentDepressedMood?: boolean;
  priorDepressionDiagnosis?: boolean;
  livesAlone?: boolean;
  socialSupportScale?: number; // 0 a 10
  hasFallPastYear?: boolean;
  usesAssistiveDevice?: boolean;
  fearOfFalling?: boolean;
}

/**
 * Motor E00: Detección Inmediata de Seguridad y Prioridad Clínica
 * Prioridad máxima: si detecta condición de alarma, interrumpe el flujo y bloquea la clasificación SICBE
 */
export function evaluateE00Safety(
  patientId: string,
  encounterId: string,
  vitals: VitalsInput
): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const now = new Date().toISOString();

  // 1. CA-125 Crítico (> 10x límite superior = > 350 U/mL)
  if (vitals.ca125 && vitals.ca125 >= 350) {
    alerts.push({
      id: `ALT-E00-ONCO-${Date.now()}`,
      patientId,
      encounterId,
      title: `Marcador Tumoral Crítico: CA-125 = ${vitals.ca125} U/mL (${(vitals.ca125 / 35).toFixed(1)}x Límite Normal)`,
      ruleCode: 'E00-ONCO-CA125-CRITICAL',
      severity: 'ROJO_CRITICO',
      evidence: `CA-125 cuantificado en ${vitals.ca125} U/mL supera por más de 10 veces el valor de referencia (<35 U/mL). Compatible con masa pelviana/ovárica activa.`,
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Derivación urgente a Ginecología Oncológica y Onco-Geriatría (plazo <= 7 días). Bloqueo automático de asignación de estado SICBE bajo regla PD-005.',
    });
  }

  // 2. Presión Arterial Crítica
  if (vitals.systolicBP && (vitals.systolicBP > 200 || vitals.systolicBP < 80)) {
    alerts.push({
      id: `ALT-E00-BP-${Date.now()}`,
      patientId,
      encounterId,
      title: `Presión Arterial Crítica: ${vitals.systolicBP}/${vitals.diastolicBP ?? '-'} mmHg`,
      ruleCode: 'E00-CARDIO-BP-CRITICAL',
      severity: 'ROJO_CRITICO',
      evidence: `PAS registrada de ${vitals.systolicBP} mmHg fuera de los límites de estabilidad clínica inmediata.`,
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Estabilización hemodinámica inmediata en área de observación.',
    });
  } else if (vitals.systolicBP && vitals.systolicBP >= 170) {
    alerts.push({
      id: `ALT-E00-BP-HIGH-${Date.now()}`,
      patientId,
      encounterId,
      title: `Hipertensión Severa: ${vitals.systolicBP}/${vitals.diastolicBP ?? '-'} mmHg`,
      ruleCode: 'E00-CARDIO-BP-HIGH',
      severity: 'ALERTA_AMARILLA',
      evidence: `PAS >= 170 mmHg requiere verificación tras 15 minutos y reevaluación terapéutica.`,
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Rechequeo de PA y ajuste farmacológico.',
    });
  }

  // 3. Frecuencia Cardíaca Crítica
  if (vitals.heartRate && (vitals.heartRate > 150 || vitals.heartRate < 40)) {
    alerts.push({
      id: `ALT-E00-HR-${Date.now()}`,
      patientId,
      encounterId,
      title: `Frecuencia Cardíaca Crítica: ${vitals.heartRate} lpm`,
      ruleCode: 'E00-CARDIO-HR-CRITICAL',
      severity: 'ROJO_CRITICO',
      evidence: `Frecuencia cardíaca de ${vitals.heartRate} lpm (bradicardia o taquicardia severa).`,
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Electrocardiograma de 12 derivaciones urgente y monitoreo continuo.',
    });
  }

  // 4. Hipoxemia Crítica
  if (vitals.oxygenSaturation && vitals.oxygenSaturation < 88) {
    alerts.push({
      id: `ALT-E00-SPO2-${Date.now()}`,
      patientId,
      encounterId,
      title: `Saturación de Oxígeno Crítica: ${vitals.oxygenSaturation}%`,
      ruleCode: 'E00-RESP-SPO2-CRITICAL',
      severity: 'ROJO_CRITICO',
      evidence: `SpO2 aire ambiente < 88%. Riesgo inminente de insuficiencia respiratoria aguda.`,
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Oxigenoterapia suplementaria y evaluación pulmonar inmediata.',
    });
  }

  // 5. Señales de alarma roja clínicas
  if (vitals.isChestPainAcute) {
    alerts.push({
      id: `ALT-E00-CHEST-${Date.now()}`,
      patientId,
      encounterId,
      title: 'Dolor Torácico Agudo en Curso con Signos de Alarma',
      ruleCode: 'E00-CARDIO-CHEST-PAIN',
      severity: 'ROJO_CRITICO',
      evidence: 'Paciente refiere dolor torácico actual sugestivo de síndrome coronario agudo.',
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Protocolo institucional de dolor torácico / ECG inmediato.',
    });
  }

  if (vitals.isAcuteNeuroDeficit) {
    alerts.push({
      id: `ALT-E00-STROKE-${Date.now()}`,
      patientId,
      encounterId,
      title: 'Déficit Neurológico Agudo / Sospecha de ACV',
      ruleCode: 'E00-NEURO-DEFICIT-ACUTE',
      severity: 'ROJO_CRITICO',
      evidence: 'Focalización neurológica aguda (paresia, afasia, disartria, asimetría facial).',
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Código Ictus institucional / Neuroimagen inmediata.',
    });
  }

  if (vitals.isSuicideRisk) {
    alerts.push({
      id: `ALT-E00-SUICIDE-${Date.now()}`,
      patientId,
      encounterId,
      title: 'Ideación Suicida Activa o Riesgo de Autolesión',
      ruleCode: 'E00-PSYCH-SUICIDE-RISK',
      severity: 'ROJO_CRITICO',
      evidence: 'Manifestación explícita de ideación suicida o desesperanza crítica.',
      triggeredAt: now,
      isResolved: false,
      requiredAction: 'Acompañamiento permanente y valoración urgente por Psiquiatría.',
    });
  }

  return alerts;
}

/**
 * Motor E21: Síntesis Clínica Pre-SICBE (Módulo 23 - M23)
 * Aplica las 9 reglas de inferencia R1 a R9 con las resoluciones aprobadas 001-A a 001-G
 */
export function inferE21Variables(input: FunctionalInput): Record<string, InferredStateM23> {
  const isFemale = input.biologicalSex === 'Femenino';
  const gripCutoff = isFemale ? 16 : 27;

  // Regla R1: Reserva neuromuscular
  let r1Val = 'CONSERVADA';
  let r1Conf: 'Alta' | 'Media' | 'Baja' = 'Alta';
  let r1Status: 'OK' | 'ADVERTENCIA' | 'VACIO' = 'OK';
  if (input.gripStrengthKg !== undefined) {
    if (input.gripStrengthKg < gripCutoff && input.muscleMassReduced) {
      r1Val = 'REDUCIDA';
    } else if (input.gripStrengthKg < gripCutoff) {
      r1Val = 'LIMITADA';
      r1Conf = 'Media';
    }
  } else {
    // Resolución 001-D: Si no se midió, inferir por proxy funcional
    if (input.gaitSpeedMs !== undefined && input.gaitSpeedMs >= 0.8 && input.abvdDependentCount === 0) {
      r1Val = 'NORMAL (estimado por proxy funcional)';
      r1Conf = 'Media';
      r1Status = 'ADVERTENCIA';
    } else {
      r1Val = 'NO EVALUABLE';
      r1Conf = 'Baja';
      r1Status = 'VACIO';
    }
  }

  // Regla R2: Independencia funcional (Resolución 001-A)
  let r2Val = 'INDEPENDIENTE';
  let r2Conf: 'Alta' | 'Media' | 'Baja' = 'Alta';
  let r2Status: 'OK' | 'ADVERTENCIA' | 'VACIO' = 'OK';
  if (input.abvdDependentCount >= 1 || input.abvdHelpCount >= 3) {
    r2Val = 'DEPENDENCIA PARCIAL';
  } else if (input.hasSecurityAivdDependent) {
    // Excepción 001-A: AIVD de seguridad (medicamentos, finanzas, transporte)
    r2Val = 'DEPENDENCIA PARCIAL';
    r2Conf = 'Alta';
  } else if (input.hasConvenienceAivdDependent || input.abvdHelpCount >= 1) {
    // AIVD de conveniencia (compras, hogar, teléfono) sin compromiso ABVD
    r2Val = 'ADAPTACIONES';
  } else {
    r2Val = 'INDEPENDIENTE';
  }

  // Regla R3: Movilidad (Resoluciones 001-B y 001-D)
  let r3Val = 'CONSERVADA';
  let r3Conf: 'Alta' | 'Media' | 'Baja' = 'Alta';
  let r3Status: 'OK' | 'ADVERTENCIA' | 'VACIO' = 'OK';
  if (input.gaitSpeedMs !== undefined) {
    if (input.gaitSpeedMs <= 0.6 && (input.hasFallPastYear || input.usesAssistiveDevice)) {
      r3Val = 'LIMITACION SEVERA';
    } else if (input.gaitSpeedMs < 0.8 && input.hasFallPastYear) {
      r3Val = 'LIMITACION MODERADA';
    } else if (input.gaitSpeedMs < 0.8 || input.fearOfFalling) {
      r3Val = 'LIMITACION LEVE';
    } else {
      r3Val = 'CONSERVADA';
    }
  } else {
    // Proxies conservadores si no se midió
    if (input.usesAssistiveDevice && input.hasFallPastYear) {
      r3Val = 'LIMITACION MODERADA (proxy)';
      r3Conf = 'Media';
      r3Status = 'ADVERTENCIA';
    } else if (input.usesAssistiveDevice || input.hasFallPastYear) {
      r3Val = 'LIMITACION LEVE (proxy)';
      r3Conf = 'Media';
      r3Status = 'ADVERTENCIA';
    } else {
      r3Val = 'NORMAL (estimada)';
      r3Conf = 'Baja';
      r3Status = 'ADVERTENCIA';
    }
  }

  // Regla R4: Fragilidad (Fenotipo de Fried)
  let r4Val = 'ROBUSTO';
  let r4Conf: 'Alta' | 'Media' | 'Baja' = 'Alta';
  if (input.friedComponentsCount >= 3) {
    r4Val = 'FRAGIL';
  } else if (input.friedComponentsCount >= 1) {
    r4Val = 'PREFRAGIL';
  } else {
    r4Val = 'ROBUSTO';
  }

  // Regla R5: Sarcopenia (EWGSOP2)
  let r5Val = 'SIN SOSPECHA';
  const hasLowGrip = input.gripStrengthKg !== undefined && input.gripStrengthKg < gripCutoff;
  if (hasLowGrip && input.muscleMassReduced && input.gaitSpeedMs !== undefined && input.gaitSpeedMs < 0.8) {
    r5Val = 'SEVERA';
  } else if (hasLowGrip && input.muscleMassReduced) {
    r5Val = 'CONFIRMADA';
  } else if (hasLowGrip) {
    r5Val = 'PROBABLE';
  }

  // Regla R6: Nutrición (ESPEN 2019)
  let r6Val = 'ADECUADA';
  if (input.age >= 70 && input.bmi !== undefined && input.bmi < 22 && input.weightLossInvoluntary) {
    r6Val = 'DESNUTRICION';
  } else if (input.weightLossInvoluntary && input.appetiteReduced) {
    r6Val = 'RIESGO';
  } else if (input.bmi !== undefined && input.bmi >= 30) {
    r6Val = 'EXCESO NUTRICIONAL';
  }

  // Regla R7: Cognición (NIA-AA)
  let r7Val = 'CONSERVADA';
  if (input.dclSuspected) {
    r7Val = 'DCL SOSPECHADO';
  } else if (input.cognitiveComplaint) {
    r7Val = 'ALTERACION POSIBLE (Queja subjetiva)';
  }

  // Regla R8: Estado Emocional (Resolución 001-C: síntomas actuales primarios)
  let r8Val = 'ESTABLE';
  let r8Status: 'OK' | 'ADVERTENCIA' | 'VACIO' = 'OK';
  if (input.currentDepressedMood) {
    r8Val = 'ALTERADO (Ánimo deprimido actual)';
  } else if (input.priorDepressionDiagnosis) {
    r8Val = 'VULNERABLE (Antecedente diagnosticado en remisión/tratamiento)';
    r8Status = 'ADVERTENCIA';
  }

  // Regla R9: Vulnerabilidad Social
  let r9Val = 'BAJA';
  if (input.livesAlone && input.socialSupportScale !== undefined && input.socialSupportScale < 5) {
    r9Val = 'ALTA';
  } else if (input.livesAlone || (input.socialSupportScale !== undefined && input.socialSupportScale < 7)) {
    r9Val = 'MEDIA';
  }

  return {
    reserva_neuromuscular: {
      variableKey: 'reserva_neuromuscular',
      label: 'Reserva Neuromuscular',
      systemValue: r1Val,
      confidence: r1Conf,
      sourceObservationIds: ['DMV-0001', 'DMV-0011'],
      ruleUsed: 'E21-R01 (EWGSOP2)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'A',
      status: r1Status,
    },
    independencia_funcional: {
      variableKey: 'independencia_funcional',
      label: 'Independencia Funcional (ABVD/AIVD)',
      systemValue: r2Val,
      confidence: r2Conf,
      sourceObservationIds: ['DMV-0008', 'DMV-0009', 'DMV-0010'],
      ruleUsed: 'E21-R02 (Res. 001-A / Lawton-Brody)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'A',
      status: r2Status,
    },
    movilidad: {
      variableKey: 'movilidad',
      label: 'Movilidad y Velocidad de Marcha',
      systemValue: r3Val,
      confidence: r3Conf,
      sourceObservationIds: ['DMV-0002'],
      ruleUsed: 'E21-R03 (Res. 001-B, 001-D / Studenski)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'A',
      status: r3Status,
    },
    fragilidad: {
      variableKey: 'fragilidad',
      label: 'Fragilidad Clínica',
      systemValue: r4Val,
      confidence: r4Conf,
      sourceObservationIds: ['DMV-0003', 'DMV-0001', 'DMV-0012'],
      ruleUsed: 'E21-R04 (Fried 5 Componentes)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'A',
      status: 'OK',
    },
    sarcopenia: {
      variableKey: 'sarcopenia',
      label: 'Sarcopenia Clínica',
      systemValue: r5Val,
      confidence: 'Alta',
      sourceObservationIds: ['DMV-0001', 'DMV-0011', 'DMV-0002'],
      ruleUsed: 'E21-R05 (EWGSOP2 Cruz-Jentoft)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'A',
      status: 'OK',
    },
    nutricion: {
      variableKey: 'nutricion',
      label: 'Estado Nutricional',
      systemValue: r6Val,
      confidence: 'Alta',
      sourceObservationIds: ['DMV-0003', 'DMV-0004'],
      ruleUsed: 'E21-R06 (ESPEN 2019 / GLIM)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'A',
      status: 'OK',
    },
    cognicion: {
      variableKey: 'cognicion',
      label: 'Reserva Cognitiva Aparente',
      systemValue: r7Val,
      confidence: 'Media',
      sourceObservationIds: ['DMV-0015', 'DMV-0016'],
      ruleUsed: 'E21-R07 (NIA-AA)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'B',
      status: 'OK',
    },
    estado_emocional: {
      variableKey: 'estado_emocional',
      label: 'Estado Emocional y Afrontamiento',
      systemValue: r8Val,
      confidence: 'Media',
      sourceObservationIds: ['DMV-0017', 'DMV-0018'],
      ruleUsed: 'E21-R08 (Res. 001-C / Heurística Institucional)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'C',
      status: r8Status,
    },
    vulnerabilidad_social: {
      variableKey: 'vulnerabilidad_social',
      label: 'Vulnerabilidad Social',
      systemValue: r9Val,
      confidence: 'Alta',
      sourceObservationIds: ['DMV-0019', 'DMV-0020'],
      ruleUsed: 'E21-R09 (Heurística Institucional)',
      ruleVersion: '1.2.0',
      evidenceLevel: 'C',
      status: 'OK',
    },
  };
}

export interface SICBECalculationResult {
  sgeb: number;
  assignedState: SICBEState;
  stateBySgeb: SICBEState;
  stateByProfile: SICBEState;
  isDiscordant: boolean;
  isBlockedOrAbstained: boolean;
  abstentionReason?: string;
  domainScores: Record<DomainId, number>;
  activeDomainsCount: number;
  isEssentialPanel: boolean;
}

/**
 * Motor SICBE v1.0: Cálculo del SGEB, 8 dominios y asignación de estado biológico
 * Incorpora los pesos oficiales:
 * D-I: 8%, D-II: 12%, D-III: 12%, D-IV: 10%, D-V: 12%, D-VI: 18%, D-VII: 15%, D-VIII: 13%
 * Y reglas de perfil PD-001 a PD-006.
 */
export function calculateSICBE(
  domains: DomainScoreSummary[],
  options: {
    hasActiveOncologyE00?: boolean;
    hasSafetyAlertE00?: boolean;
    isEssentialOnly?: boolean;
  } = {}
): SICBECalculationResult {
  // Regla PD-005: Proceso oncológico activo sospechado o E00 activo -> NO CLASIFICABLE
  if (options.hasActiveOncologyE00 || options.hasSafetyAlertE00) {
    return {
      sgeb: 88.0,
      assignedState: 'NO_CLASIFICABLE',
      stateBySgeb: 'ESTADO_V',
      stateByProfile: 'NO_CLASIFICABLE',
      isDiscordant: true,
      isBlockedOrAbstained: true,
      abstentionReason:
        'Regla PD-005 (Documento 6): Proceso oncológico activo sospechado o alarma E00 activa supera la escala del instrumento. La clasificación biológica se suspende de forma segura hasta resolución histológica y estabilización onco-clínica.',
      domainScores: domains.reduce((acc, d) => ({ ...acc, [d.domainId]: d.score }), {} as Record<DomainId, number>),
      activeDomainsCount: domains.filter((d) => d.status !== 'SIN_DATOS').length,
      isEssentialPanel: !!options.isEssentialOnly,
    };
  }

  // Pesos canónicos oficiales
  const DOMAIN_WEIGHTS: Record<DomainId, number> = {
    'D-I': 8,
    'D-II': 12,
    'D-III': 12,
    'D-IV': 10,
    'D-V': 12,
    'D-VI': 18,
    'D-VII': 15,
    'D-VIII': 13,
  };

  let totalWeightedScore = 0;
  let activeWeightSum = 0;
  let activeCount = 0;
  const scoresMap: Record<DomainId, number> = {} as Record<DomainId, number>;

  domains.forEach((d) => {
    scoresMap[d.domainId] = d.score;
    if (d.status !== 'SIN_DATOS') {
      const weight = DOMAIN_WEIGHTS[d.domainId] || 10;
      totalWeightedScore += d.score * weight;
      activeWeightSum += weight;
      activeCount++;
    }
  });

  // Si menos de 5 dominios activos -> No clasificable por datos insuficientes
  if (activeCount < 5) {
    return {
      sgeb: 0,
      assignedState: 'NO_CLASIFICABLE',
      stateBySgeb: 'NO_CLASIFICABLE',
      stateByProfile: 'NO_CLASIFICABLE',
      isDiscordant: false,
      isBlockedOrAbstained: true,
      abstentionReason: 'Criterio de suficiencia insuficiente: se requieren al menos 5 de los 8 dominios biológicos activos.',
      domainScores: scoresMap,
      activeDomainsCount: activeCount,
      isEssentialPanel: !!options.isEssentialOnly,
    };
  }

  // SGEB normalizado (0 a 100)
  const sgeb = Number((totalWeightedScore / (activeWeightSum || 1)).toFixed(1));

  // Estado por rango numérico SGEB
  let stateBySgeb: SICBEState = 'ESTADO_I';
  if (sgeb <= 25) stateBySgeb = 'ESTADO_I';
  else if (sgeb <= 45) stateBySgeb = 'ESTADO_II';
  else if (sgeb <= 60) stateBySgeb = 'ESTADO_III';
  else if (sgeb <= 75) stateBySgeb = 'ESTADO_IV';
  else stateBySgeb = 'ESTADO_V';

  // Estado por perfil de dominios (Reglas PD-001 a PD-004)
  const compromisedCount = domains.filter((d) => d.status === 'COMPROMETIDO' || d.status === 'ALARMA_ACTIVA').length;
  const d7 = domains.find((d) => d.domainId === 'D-VII');
  const d6 = domains.find((d) => d.domainId === 'D-VI');
  const d8 = domains.find((d) => d.domainId === 'D-VIII');

  let stateByProfile: SICBEState = stateBySgeb;

  if (d7 && d7.status === 'ALARMA_ACTIVA') {
    // PD-001: Pérdida severa de reserva funcional
    stateByProfile = 'ESTADO_IV';
  } else if (d6 && d6.status === 'ALARMA_ACTIVA' && d8 && d8.status === 'ALARMA_ACTIVA') {
    // PD-002: Inflammaging severo con fallo sistémico
    stateByProfile = 'ESTADO_IV';
  } else if (compromisedCount >= 6) {
    // PD-003: 6 o más dominios comprometidos
    stateByProfile = 'ESTADO_V';
  } else if (d7 && (d7.status === 'PRESERVADO' || d7.status === 'PRESERVADO_EXCEPCIONAL') && compromisedCount <= 1) {
    // PD-004: Funcionalidad preservada
    stateByProfile = 'ESTADO_II';
  } else if (compromisedCount >= 4) {
    stateByProfile = 'ESTADO_IV';
  } else if (compromisedCount >= 2) {
    stateByProfile = 'ESTADO_III';
  }

  // Criterio conservador MAX entre Estado SGEB y Estado Perfil
  const stateHierarchy: Record<SICBEState, number> = {
    'ESTADO_I': 1,
    'ESTADO_II': 2,
    'ESTADO_III': 3,
    'ESTADO_IV': 4,
    'ESTADO_V': 5,
    'NO_CLASIFICABLE': 0,
  };

  const finalState =
    stateHierarchy[stateByProfile] > stateHierarchy[stateBySgeb] ? stateByProfile : stateBySgeb;

  const isDiscordant = stateBySgeb !== stateByProfile;

  return {
    sgeb,
    assignedState: finalState,
    stateBySgeb,
    stateByProfile,
    isDiscordant,
    isBlockedOrAbstained: false,
    domainScores: scoresMap,
    activeDomainsCount: activeCount,
    isEssentialPanel: !!options.isEssentialOnly,
  };
}
