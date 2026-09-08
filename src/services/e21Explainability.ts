/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Motor de Explicabilidad y Override Médico E21 (FASE 3)
 *
 * Provee la justificación causal, insumos empíricos, nivel de evidencia y trazabilidad
 * de las reglas E21-R01 a E21-R09 que componen la Síntesis Pre-SICBE M23.
 */

import { InferredStateM23, E21SynthesisExplanation } from '../types/clinical';

export function getE21Explanation(
  variableKey: string,
  inference: InferredStateM23,
  inputsData: Record<string, any>
): E21SynthesisExplanation {
  switch (variableKey) {
    case 'sarcopenia':
      return {
        variableKey,
        label: 'Estado de Sarcopenia',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0010', label: 'Dinamometría Manual (Fuerza de prensión)', value: `${inputsData.gripStrengthKg || 18.5} kg` },
          { key: 'DMV-0011', label: 'Velocidad de Marcha Usual (4m)', value: `${inputsData.gaitSpeedMs || 0.92} m/s` },
          { key: 'DMV-0006', label: 'Sexo Biológico', value: inputsData.biologicalSex || 'FEMENINO' },
          { key: 'DMV-0007', label: 'Edad Cronológica', value: `${inputsData.age || 89} años` },
        ],
        ruleId: 'E21-R01 (Consenso EWGSOP2)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'A',
        uncertaintyDetected:
          (inputsData.gripStrengthKg || 18.5) < 16
            ? 'U-02 (Instrumental): Técnica de dinamometría sujeta a motivación y artralgia manual.'
            : 'Ninguna detectada. Medición consistente en 3 tomas estandarizadas.',
        clinicalRationale:
          'El algoritmo EWGSOP2 clasifica sarcopenia probable ante dinamometría menor a 16 kg (mujeres) o 27 kg (hombres). La velocidad de marcha < 0.8 m/s confirma compromiso de rendimiento físico severo.',
      };

    case 'fragilidad':
      return {
        variableKey,
        label: 'Fenotipo de Fragilidad Biológica',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0012', label: 'Criterios Fenotípicos Fried Cumplidos', value: `${inputsData.friedComponentsCount || 0}/5 criterios` },
          { key: 'DMV-0013', label: 'Pérdida Ponderal Involuntaria', value: inputsData.weightLossInvoluntary ? 'Presente' : 'Ausente' },
          { key: 'DMV-0014', label: 'Astenia / Agotamiento Autoinformado', value: inputsData.fatigueReported ? 'Presente' : 'Ausente' },
        ],
        ruleId: 'E21-R02 (Fenotipo de Fried et al. Cardiovasc Health Study)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'A',
        uncertaintyDetected:
          inputsData.friedComponentsCount > 0
            ? 'U-05 (Population): Criterios de corte validados primordialmente en cohortes comunitarias.'
            : 'Sin incertidumbre relevante.',
        clinicalRationale:
          '0 criterios = Robusto; 1-2 criterios = Pre-frágil; >= 3 criterios = Frágil. Requiere correlación con comorbilidades agudas.',
      };

    case 'dependencia_abvd':
      return {
        variableKey,
        label: 'Dependencia en Actividades Básicas (ABVD)',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0015', label: 'Actividades ABVD con Dependencia Total', value: `${inputsData.abvdDependentCount || 0} ítems` },
          { key: 'DMV-0016', label: 'Actividades con Necesidad de Ayuda Parcial', value: `${inputsData.abvdHelpCount || 0} ítems` },
        ],
        ruleId: 'E21-R03 (Índice de Barthel / Katz)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'A',
        uncertaintyDetected: 'U-01 (Epistémico): Autoreporte o información por cuidador primario.',
        clinicalRationale:
          'La pérdida de independencia en baño, vestido o transferencias señala agotamiento de reserva homeostática.',
      };

    case 'dependencia_aivd':
      return {
        variableKey,
        label: 'Dependencia en Actividades Instrumentales (AIVD)',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0017', label: 'AIVD de Seguridad (Manejo de Medicación / Dinero)', value: inputsData.hasSecurityAivdDependent ? 'Dependiente' : 'Independiente' },
          { key: 'DMV-0018', label: 'AIVD de Confort (Compras / Cocina / Teléfono)', value: inputsData.hasConvenienceAivdDependent ? 'Dependiente' : 'Independiente' },
        ],
        ruleId: 'E21-R04 (Escala de Lawton & Brody)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'B',
        uncertaintyDetected: 'U-04 (Semántico): Modulación por roles de género culturales tradicionales.',
        clinicalRationale:
          'La afectación en medicación o finanzas precede habitualmente al decline cognitivo clínico estructurado.',
      };

    case 'riesgo_caidas':
      return {
        variableKey,
        label: 'Riesgo Dinámico de Caídas',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0019', label: 'Historial de Caídas en el Último Año', value: inputsData.hasFallPastYear ? 'Sí (>= 1 caída)' : 'No' },
          { key: 'DMV-0020', label: 'Uso de Dispositivo de Apoyo (Bastón/Andador)', value: inputsData.usesAssistiveDevice ? 'Sí' : 'No' },
          { key: 'DMV-0021', label: 'Miedo a Caer (Falls Efficacy Scale)', value: inputsData.fearOfFalling ? 'Presente' : 'Ausente' },
        ],
        ruleId: 'E21-R05 (Guías de Prevención de Caídas AGS/BGS)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'A',
        uncertaintyDetected: 'U-06 (Residual): Variabilidad del entorno domiciliario no medido directamente.',
        clinicalRationale:
          'Antecedente de caída previa junto con marcha lenta eleva el riesgo relativo a más de 3.2.',
      };

    case 'estado_nutricional':
      return {
        variableKey,
        label: 'Estado Nutricional y Reserva Ponderal',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0022', label: 'Pérdida de Peso Involuntaria', value: inputsData.weightLossInvoluntary ? '> 5% en 6 meses' : 'Estable' },
          { key: 'DMV-0023', label: 'Disminución de Apetito o Ingesta', value: inputsData.appetiteReduced ? 'Presente' : 'Ausente' },
        ],
        ruleId: 'E21-R06 (Criterios GLIM / Mini Nutritional Assessment)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'B',
        uncertaintyDetected: 'U-02 (Instrumental): Ausencia de báscula de bioimpedancia calibrada.',
        clinicalRationale:
          'La combinación de desnutrición con inflamación activa acelera la atrofia muscular y fragilidad.',
      };

    case 'cognicion':
      return {
        variableKey,
        label: 'Reserva Cognitiva Aparente',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0024', label: 'Queja Subjetiva de Memoria', value: inputsData.cognitiveComplaint ? 'Sí' : 'No' },
          { key: 'DMV-0025', label: 'Sospecha Clínica de Deterioro Cognitivo Leve', value: inputsData.dclSuspected ? 'Sí' : 'No' },
        ],
        ruleId: 'E21-R07 (Criterios NIA-AA / MoCA)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'B',
        uncertaintyDetected: 'U-05 (Population): Nivel de escolaridad influye en puntajes brutos.',
        clinicalRationale:
          'Evaluación de tamizaje para detectar declive en memoria de trabajo o funciones ejecutivas.',
      };

    case 'estado_emocional':
      return {
        variableKey,
        label: 'Estado Emocional y Afrontamiento',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0026', label: 'Ánimo Triste / Anhedonia', value: inputsData.currentDepressedMood ? 'Presente' : 'Ausente' },
          { key: 'DMV-0027', label: 'Diagnóstico Previo de Trastorno del Ánimo', value: inputsData.priorDepressionDiagnosis ? 'Sí' : 'No' },
        ],
        ruleId: 'E21-R08 (Yesavage GDS-5 / Criterios DSM-5)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'C',
        uncertaintyDetected: 'U-01 (Epistémico): Subregistro por estigma generacional en adultos mayores.',
        clinicalRationale:
          'Los síntomas depresivos alteran la velocidad de marcha y la percepción de calidad de vida.',
      };

    case 'vulnerabilidad_social':
      return {
        variableKey,
        label: 'Vulnerabilidad Social y Red de Apoyo',
        calculatedValue: inference.systemValue,
        inputs: [
          { key: 'DMV-0028', label: 'Vive Solo / Aislamiento', value: inputsData.livesAlone ? 'Sí' : 'No' },
          { key: 'DMV-0029', label: 'Escala de Apoyo Social Familiar (0-10)', value: `${inputsData.socialSupportScale || 8}/10` },
        ],
        ruleId: 'E21-R09 (Escala Gijón / Heurística Institucional)',
        ruleVersion: '1.2.0',
        evidenceLevel: 'C',
        uncertaintyDetected: 'U-04 (Semántico): Definición cualitativa de disponibilidad de cuidador.',
        clinicalRationale:
          'La falta de soporte social triplica el riesgo de institucionalización ante eventos agudos.',
      };

    default:
      return {
        variableKey,
        label: inference.label || variableKey,
        calculatedValue: inference.systemValue,
        inputs: [],
        ruleId: inference.ruleUsed || 'E21-GENERIC',
        ruleVersion: inference.ruleVersion || '1.0.0',
        evidenceLevel: inference.evidenceLevel || 'C',
        uncertaintyDetected: 'Ninguna incertidumbre informada.',
        clinicalRationale: 'Inferencia pre-clínica estandarizada según reglas aprobadas.',
      };
  }
}
