/**
 * IMERTEC — Motor de Historia Clínica Adaptativa (Configuración Ontológica Declarativa)
 * Arquitectura: Question -> Answer -> Rule -> Action
 * Módulos M01 a M28 estructurados sin hardcodeo en UI
 */

import { AdaptiveModule } from '../types/clinical';

export const ADAPTIVE_CLINICAL_MODULES: AdaptiveModule[] = [
  // 1. IDENTIFICACIÓN Y REVISIÓN ADMINISTRATIVA
  {
    id: 'MOD-IDENTIFICATION',
    title: '1. Identificación y Verificación de Datos',
    order: 1,
    category: 'Administrativo',
    isOpen: true,
    isCompleted: true,
    questions: [
      {
        id: 'Q-ID-01',
        moduleId: 'MOD-IDENTIFICATION',
        moduleName: 'Identificación',
        category: 'Administrativo',
        text: '¿Se han verificado los datos de identidad, documento nacional y consentimiento informado con el paciente o acompañante?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 2. MOTIVO DE CONSULTA
  {
    id: 'MOD-CHIEF-COMPLAINT',
    title: '2. Motivo de Consulta y Expectativas',
    order: 2,
    category: 'Clínica',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-CC-01',
        moduleId: 'MOD-CHIEF-COMPLAINT',
        moduleName: 'Motivo de Consulta',
        category: 'Clínica',
        text: '¿Cuál es el motivo principal de la consulta médica hoy?',
        responseType: 'text',
        helpText: 'Describa con palabras del paciente o motivo de derivación a medicina de longevidad.',
        rules: [],
      },
      {
        id: 'Q-CC-02',
        moduleId: 'MOD-CHIEF-COMPLAINT',
        moduleName: 'Motivo de Consulta',
        category: 'Clínica',
        text: '¿Presenta dolor o molestia física activa en este momento?',
        responseType: 'boolean',
        rules: [
          {
            id: 'R-CC-PAIN',
            condition: { operator: 'is_true', value: true },
            action: 'OPEN_MODULE',
            target: 'MOD-PAIN',
          },
        ],
      },
    ],
  },

  // 3. ANTECEDENTES MÉDICOS
  {
    id: 'MOD-MEDICAL-HISTORY',
    title: '3. Antecedentes Médicos y Patológicos',
    order: 3,
    category: 'Antecedentes',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-MH-01',
        moduleId: 'MOD-MEDICAL-HISTORY',
        moduleName: 'Antecedentes Médicos',
        category: 'Antecedentes',
        text: '¿Tiene diagnóstico confirmado de Hipertensión Arterial, Diabetes Mellitus o Dislipidemia?',
        responseType: 'boolean',
        rules: [
          {
            id: 'R-MH-CARDIO',
            condition: { operator: 'is_true', value: true },
            action: 'REQUEST_OBSERVATION',
            target: 'DMV-0001', // Presión Arterial Sistólica
          },
        ],
      },
      {
        id: 'Q-MH-02',
        moduleId: 'MOD-MEDICAL-HISTORY',
        moduleName: 'Antecedentes Médicos',
        category: 'Antecedentes',
        text: '¿Tiene o ha tenido diagnóstico oncológico, masa en estudio o neoplasia activa?',
        responseType: 'boolean',
        rules: [
          {
            id: 'R-MH-ONCO',
            condition: { operator: 'is_true', value: true },
            action: 'TRIGGER_ALERT',
            target: 'E00-ONCO-NEOPLASIA',
            payload: { message: 'Antecedente o sospecha de neoplasia: activa regla de abstención PD-005 y panel de seguridad.' },
          },
        ],
      },
    ],
  },

  // 4. ANTECEDENTES QUIRÚRGICOS
  {
    id: 'MOD-SURGICAL-HISTORY',
    title: '4. Antecedentes Quirúrgicos y Hospitalizaciones',
    order: 4,
    category: 'Antecedentes',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-SH-01',
        moduleId: 'MOD-SURGICAL-HISTORY',
        moduleName: 'Antecedentes Quirúrgicos',
        category: 'Antecedentes',
        text: '¿Ha tenido cirugías u hospitalizaciones no programadas en los últimos 12 meses?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 5. ALERGIAS
  {
    id: 'MOD-ALLERGIES',
    title: '5. Alergias y Reacciones Adversas',
    order: 5,
    category: 'Seguridad',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-ALL-01',
        moduleId: 'MOD-ALLERGIES',
        moduleName: 'Alergias',
        category: 'Seguridad',
        text: '¿Tiene alergias documentadas a fármacos (ej. Penicilina, AINEs) o alimentos?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 6. MEDICAMENTOS Y POLIFARMACIA
  {
    id: 'MOD-MEDICATIONS',
    title: '6. Medicación Actual y Polifarmacia',
    order: 6,
    category: 'Tratamiento',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-MED-01',
        moduleId: 'MOD-MEDICATIONS',
        moduleName: 'Medicación',
        category: 'Tratamiento',
        text: '¿Consume habitualmente 5 o más fármacos recetados al día (criterio de polifarmacia)?',
        responseType: 'boolean',
        rules: [
          {
            id: 'R-MED-BEERS',
            condition: { operator: 'is_true', value: true },
            action: 'TRIGGER_ALERT',
            target: 'E00-PHARMA-BEERS',
            payload: { message: 'Polifarmacia activa detectada. Requiere revisión de criterios de Beers y STOPP/START.' },
          },
        ],
      },
      {
        id: 'Q-MED-02',
        moduleId: 'MOD-MEDICATIONS',
        moduleName: 'Medicación',
        category: 'Tratamiento',
        text: '¿Consume suplementos nutricionales, hormonas bioidénticas o fitoterápicos?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 7. SIGNOS VITALES
  {
    id: 'MOD-VITALS',
    title: '7. Signos Vitales y Parámetros Basales',
    order: 7,
    category: 'Exploración',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-VIT-PAS',
        moduleId: 'MOD-VITALS',
        moduleName: 'Signos Vitales',
        category: 'Exploración',
        text: 'Presión Arterial Sistólica (PAS) en mmHg:',
        responseType: 'number',
        variableId: 'DMV-0001',
        rules: [
          {
            id: 'R-VIT-PAS-CRIT',
            condition: { operator: 'greater_than', value: 180 },
            action: 'TRIGGER_ALERT',
            target: 'E00-CARDIO-HTA-CRISIS',
            payload: { message: 'Crisis hipertensiva (PAS > 180 mmHg). Prioridad de atención inmediata.' },
          },
        ],
      },
      {
        id: 'Q-VIT-PAD',
        moduleId: 'MOD-VITALS',
        moduleName: 'Signos Vitales',
        category: 'Exploración',
        text: 'Presión Arterial Diastólica (PAD) en mmHg:',
        responseType: 'number',
        variableId: 'DMV-0002',
        rules: [
          {
            id: 'R-VIT-PAD-CRIT',
            condition: { operator: 'greater_than', value: 110 },
            action: 'TRIGGER_ALERT',
            target: 'E00-CARDIO-HTA-CRISIS',
            payload: { message: 'Crisis hipertensiva (PAD > 110 mmHg).' },
          },
        ],
      },
      {
        id: 'Q-VIT-HR',
        moduleId: 'MOD-VITALS',
        moduleName: 'Signos Vitales',
        category: 'Exploración',
        text: 'Frecuencia Cardíaca (lpm):',
        responseType: 'number',
        variableId: 'DMV-0003',
        rules: [],
      },
      {
        id: 'Q-VIT-SPO2',
        moduleId: 'MOD-VITALS',
        moduleName: 'Signos Vitales',
        category: 'Exploración',
        text: 'Saturación de Oxígeno SpO2 (%):',
        responseType: 'number',
        variableId: 'DMV-0005',
        rules: [
          {
            id: 'R-VIT-HYPOXIA',
            condition: { operator: 'less_than', value: 92 },
            action: 'TRIGGER_ALERT',
            target: 'E00-RESP-HYPOXIA',
            payload: { message: 'Hipoxemia moderada/severa (SpO2 < 92% aire ambiente).' },
          },
        ],
      },
    ],
  },

  // 8. FUNCIONALIDAD Y AUTONOMÍA
  {
    id: 'MOD-FUNCTIONALITY',
    title: '8. Funcionalidad y Autonomía (ABVD / AIVD)',
    order: 8,
    category: 'Geriatría',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-FUNC-01',
        moduleId: 'MOD-FUNCTIONALITY',
        moduleName: 'Funcionalidad',
        category: 'Geriatría',
        text: '¿El paciente es capaz de bañarse, vestirse, alimentarse y usar el inodoro de forma completamente independiente?',
        responseType: 'boolean',
        rules: [
          {
            id: 'R-FUNC-DEP',
            condition: { operator: 'is_false', value: false },
            action: 'OPEN_MODULE',
            target: 'MOD-FRAILTY',
          },
        ],
      },
    ],
  },

  // 9. MOVILIDAD Y CAÍDAS
  {
    id: 'MOD-FALLS',
    title: '9. Movilidad, Marcha y Riesgo de Caídas',
    order: 9,
    category: 'Geriatría',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-FALLS-01',
        moduleId: 'MOD-FALLS',
        moduleName: 'Movilidad y Caídas',
        category: 'Geriatría',
        text: '¿Ha sufrido alguna caída en los últimos 12 meses?',
        responseType: 'boolean',
        variableId: 'DMV-0024',
        rules: [
          {
            id: 'R-FALLS-OPEN-SARCOPENIA',
            condition: { operator: 'is_true', value: true },
            action: 'OPEN_MODULE',
            target: 'MOD-SARCOPENIA',
          },
          {
            id: 'R-FALLS-ALERT',
            condition: { operator: 'is_true', value: true },
            action: 'TRIGGER_ALERT',
            target: 'E00-GER-FALL-RISK',
            payload: { message: 'Antecedente de caídas: alto riesgo de fractura y pérdida funcional.' },
          },
        ],
      },
      {
        id: 'Q-GAIT-SPEED',
        moduleId: 'MOD-FALLS',
        moduleName: 'Movilidad y Caídas',
        category: 'Geriatría',
        text: 'Velocidad de Marcha Habitual en 4 metros (m/s):',
        responseType: 'number',
        variableId: 'DMV-0021',
        rules: [
          {
            id: 'R-GAIT-SLOW',
            condition: { operator: 'less_than', value: 0.8 },
            action: 'OPEN_MODULE',
            target: 'MOD-SARCOPENIA',
          },
        ],
      },
    ],
  },

  // 10. SARCOPENIA Y DINAMOMETRÍA
  {
    id: 'MOD-SARCOPENIA',
    title: '10. Sarcopenia y Fuerza Muscular (D-VII)',
    order: 10,
    category: 'Gerociencia',
    isOpen: false, // Se abre adaptativamente o si hay caídas / marcha lenta
    isCompleted: false,
    questions: [
      {
        id: 'Q-SAR-GRIP',
        moduleId: 'MOD-SARCOPENIA',
        moduleName: 'Sarcopenia',
        category: 'Gerociencia',
        text: 'Fuerza de prensión manual con dinamómetro (kg):',
        responseType: 'number',
        variableId: 'DMV-0020',
        helpText: 'Puntos de corte EWGSOP2: < 16 kg en mujeres, < 27 kg en hombres.',
        rules: [],
      },
      {
        id: 'Q-SAR-DIFF',
        moduleId: 'MOD-SARCOPENIA',
        moduleName: 'Sarcopenia',
        category: 'Gerociencia',
        text: '¿Tiene dificultad para levantarse de una silla sin apoyarse con los brazos?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 11. FRAGILIDAD BIOLÓGICA
  {
    id: 'MOD-FRAILTY',
    title: '11. Evaluación Fenotípica de Fragilidad',
    order: 11,
    category: 'Gerociencia',
    isOpen: false,
    isCompleted: false,
    questions: [
      {
        id: 'Q-FRAIL-WEIGHT',
        moduleId: 'MOD-FRAILTY',
        moduleName: 'Fragilidad',
        category: 'Gerociencia',
        text: '¿Ha perdido más de 4.5 kg de peso corporal de forma involuntaria en el último año?',
        responseType: 'boolean',
        rules: [],
      },
      {
        id: 'Q-FRAIL-EXHAUSTION',
        moduleId: 'MOD-FRAILTY',
        moduleName: 'Fragilidad',
        category: 'Gerociencia',
        text: '¿Siente que cualquier actividad requiere un esfuerzo agotador o siente falta de energía?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 12. EVALUACIÓN COGNITIVA
  {
    id: 'MOD-COGNITION',
    title: '12. Rendimiento Cognitivo y Memoria',
    order: 12,
    category: 'Neurología',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-COG-MEM',
        moduleId: 'MOD-COGNITION',
        moduleName: 'Cognición',
        category: 'Neurología',
        text: '¿El paciente o sus familiares refieren fallos de memoria reciente que afecten la vida diaria?',
        responseType: 'boolean',
        rules: [],
      },
    ],
  },

  // 13. DOLOR Y BIENESTAR
  {
    id: 'MOD-PAIN',
    title: '13. Evaluación Detallada del Dolor (EVA)',
    order: 13,
    category: 'Clínica',
    isOpen: false, // Se abre si responde sí a dolor
    isCompleted: false,
    questions: [
      {
        id: 'Q-PAIN-SCORE',
        moduleId: 'MOD-PAIN',
        moduleName: 'Dolor',
        category: 'Clínica',
        text: 'Puntaje en Escala Visual Analógica (EVA 0-10):',
        responseType: 'number',
        variableId: 'DMV-0041',
        rules: [],
      },
      {
        id: 'Q-PAIN-LOCATION',
        moduleId: 'MOD-PAIN',
        moduleName: 'Dolor',
        category: 'Clínica',
        text: 'Localización anatómica y características del dolor:',
        responseType: 'text',
        rules: [],
      },
    ],
  },

  // 14. BIOMARCADORES MOLECULARES / LABORATORIO
  {
    id: 'MOD-LABORATORY',
    title: '14. Biomarcadores y Pruebas Moleculares',
    order: 14,
    category: 'Bioquímica',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-LAB-CA125',
        moduleId: 'MOD-LABORATORY',
        moduleName: 'Laboratorio',
        category: 'Bioquímica',
        text: 'Nivel de CA-125 sérico en U/mL (si está disponible):',
        responseType: 'number',
        variableId: 'DMV-0030',
        rules: [
          {
            id: 'R-LAB-CA125-HIGH',
            condition: { operator: 'greater_than', value: 100 },
            action: 'TRIGGER_ALERT',
            target: 'E00-ONCO-CA125',
            payload: { message: 'Biomarcador CA-125 elevado significativamente (≥ 100 U/mL). Abstención PD-005 activa.' },
          },
        ],
      },
      {
        id: 'Q-LAB-HSCRP',
        moduleId: 'MOD-LABORATORY',
        moduleName: 'Laboratorio',
        category: 'Bioquímica',
        text: 'Proteína C Reactiva Ultrasensible (hs-CRP en mg/L):',
        responseType: 'number',
        variableId: 'DMV-0031',
        rules: [],
      },
    ],
  },

  // 15. PLAN CLÍNICO Y SEGUIMIENTO
  {
    id: 'MOD-CLINICAL-PLAN',
    title: '15. Plan Integral, Metas y Síntesis',
    order: 15,
    category: 'Cierre',
    isOpen: true,
    isCompleted: false,
    questions: [
      {
        id: 'Q-PLAN-SUMMARY',
        moduleId: 'MOD-CLINICAL-PLAN',
        moduleName: 'Plan Clínico',
        category: 'Cierre',
        text: 'Síntesis clínica del encuentro y recomendaciones diagnósticas/terapéuticas:',
        responseType: 'text',
        rules: [],
      },
    ],
  },
];
