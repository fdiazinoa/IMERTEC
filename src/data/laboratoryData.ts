/**
 * IMERTEC — Datos de Laboratorio Clínico y Biomarcadores
 * FASE 2: MVP Clínico Funcional
 */

import { LaboratoryResult } from '../types/clinical';

export const INITIAL_LAB_RESULTS: LaboratoryResult[] = [
  // Casilda De La Cruz (PAT-002)
  {
    id: 'LAB-001',
    patientId: 'PAT-002',
    encounterId: 'ENC-2026-07-002',
    variableId: 'DMV-0030', // CA-125
    testName: 'Antígeno Carbohidrato 125 (CA-125)',
    value: 475.6,
    unit: 'U/mL',
    referenceRange: '0.0 - 35.0 U/mL',
    isOutOfRange: true,
    date: '2026-06-23',
    originLab: 'Laboratorio San Miguel, Santiago',
    documentId: 'DOC-01',
    status: 'FINAL',
    notes: 'Valor crítico confirmado con dilución 1:10. Disparador de Alerta E00 y regla PD-005.',
  },
  {
    id: 'LAB-002',
    patientId: 'PAT-002',
    encounterId: 'ENC-2026-07-002',
    variableId: 'DMV-0035', // Creatinina
    testName: 'Creatinina Sérica',
    value: 1.03,
    unit: 'mg/dL',
    referenceRange: '0.50 - 1.00 mg/dL',
    isOutOfRange: true,
    date: '2026-06-02',
    originLab: 'Laboratorio San Miguel, Santiago',
    documentId: 'DOC-06',
    status: 'FINAL',
    notes: 'Tasa filtrado glomerular estimada eGFR (CKD-EPI 2021): 49.8 mL/min/1.73m² (ERC Grado 3a).',
  },
  {
    id: 'LAB-003',
    patientId: 'PAT-002',
    encounterId: 'ENC-2026-07-002',
    variableId: 'DMV-0031', // hs-CRP
    testName: 'Proteína C Reactiva Ultrasensible (hs-CRP)',
    value: 8.1,
    unit: 'mg/L',
    referenceRange: '< 3.0 mg/L',
    isOutOfRange: true,
    date: '2026-06-23',
    originLab: 'Laboratorio San Miguel, Santiago',
    status: 'FINAL',
    notes: 'Inflamación sistémica severa por artritis reumatoide vs proceso expansivo.',
  },

  // Manuel Tavárez (PAT-003)
  {
    id: 'LAB-010',
    patientId: 'PAT-003',
    encounterId: 'ENC-2026-05-003',
    variableId: 'DMV-0033', // HbA1c
    testName: 'Hemoglobina Glicosilada (HbA1c)',
    value: 8.4,
    unit: '%',
    referenceRange: '< 5.7% (Meta geriátrica < 7.5%)',
    isOutOfRange: true,
    date: '2026-05-10',
    originLab: 'Laboratorio Metropolitano Santiago',
    documentId: 'DOC-21',
    status: 'FINAL',
    notes: 'Control metabólico deficiente. Requiere titulación farmacológica.',
  },
  {
    id: 'LAB-011',
    patientId: 'PAT-003',
    encounterId: 'ENC-2026-05-003',
    variableId: 'DMV-0034', // Glucosa en ayunas
    testName: 'Glucosa Basal en Ayunas',
    value: 168,
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    isOutOfRange: true,
    date: '2026-05-10',
    originLab: 'Laboratorio Metropolitano Santiago',
    documentId: 'DOC-21',
    status: 'FINAL',
  },
  {
    id: 'LAB-012',
    patientId: 'PAT-003',
    encounterId: 'ENC-2026-05-003',
    variableId: 'DMV-0031', // hs-CRP
    testName: 'Proteína C Reactiva Ultrasensible',
    value: 3.8,
    unit: 'mg/L',
    referenceRange: '< 1.0 mg/L',
    isOutOfRange: true,
    date: '2026-05-10',
    originLab: 'Laboratorio Metropolitano Santiago',
    documentId: 'DOC-22',
    status: 'FINAL',
    notes: 'Inflammaging de bajo grado.',
  },

  // Carmen Fernández (PAT-004)
  {
    id: 'LAB-020',
    patientId: 'PAT-004',
    encounterId: 'ENC-2026-03-004',
    variableId: 'DMV-0033',
    testName: 'Hemoglobina Glicosilada (HbA1c)',
    value: 5.2,
    unit: '%',
    referenceRange: '< 5.7%',
    isOutOfRange: false,
    date: '2026-03-12',
    originLab: 'Laboratorio Clínico Referencia',
    status: 'FINAL',
  },
  {
    id: 'LAB-021',
    patientId: 'PAT-004',
    encounterId: 'ENC-2026-03-004',
    variableId: 'DMV-0031',
    testName: 'Proteína C Reactiva Ultrasensible',
    value: 0.4,
    unit: 'mg/L',
    referenceRange: '< 1.0 mg/L',
    isOutOfRange: false,
    date: '2026-03-12',
    originLab: 'Laboratorio Clínico Referencia',
    status: 'FINAL',
  },

  // Teresa Méndez (PAT-006)
  {
    id: 'LAB-030',
    patientId: 'PAT-006',
    encounterId: 'ENC-2026-04-006',
    variableId: 'DMV-0035',
    testName: 'Creatinina Sérica',
    value: 1.45,
    unit: 'mg/dL',
    referenceRange: '0.50 - 1.00 mg/dL',
    isOutOfRange: true,
    date: '2026-04-18',
    originLab: 'Laboratorio Especializado',
    status: 'FINAL',
    notes: 'Ajuste de dosis de digoxina urgente por deterioro de eGFR a 36 mL/min.',
  },
];
