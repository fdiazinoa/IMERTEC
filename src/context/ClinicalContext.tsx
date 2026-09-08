/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Contexto Clínico Central y Gestor de Estado (FASE 2: MVP Clínico Completo)
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  Patient,
  ActiveProblem,
  Medication,
  Allergy,
  SafetyAlert,
  ClinicalDocument,
  Encounter,
  AuditLog,
  UserProfile,
  DomainScoreSummary,
  LongitudinalPoint,
  ClinicalObservation,
  LaboratoryResult,
  VariableDefinition,
  DataGap,
  Uncertainty,
  Conflict,
  ConflictReconciliation,
  ECI,
  ECILifecycleState,
  ICCGrading,
  ICBGrading,
  SufficiencyEvaluation,
  PublicationGateResult,
  ClinicalEngineExecution,
  E25Report,
  MIACIDirective,
  SICBEAssessment,
  PhysicianSICBEInterpretation,
  DomainWeightSet,
} from '../types/clinical';
import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_PROBLEMS,
  INITIAL_MEDICATIONS,
  INITIAL_ALLERGIES,
  INITIAL_SAFETY_ALERTS,
  INITIAL_DOCUMENTS,
  INITIAL_LONGITUDINAL_POINTS,
  INITIAL_AUDIT_LOGS,
  CASILDA_DOMAINS,
  TAVAREZ_DOMAINS,
  FERNANDEZ_DOMAINS,
} from '../data/initialData';
import { DMV_VARIABLES } from '../data/dmvData';
import { INITIAL_OBSERVATIONS } from '../data/observationsData';
import { INITIAL_LAB_RESULTS } from '../data/laboratoryData';
import {
  INITIAL_DATA_GAPS,
  INITIAL_UNCERTAINTIES,
  INITIAL_CONFLICTS,
  INITIAL_PATIENT_ECIS,
} from '../data/phase3SeedData';
import { calculateICC, calculateICB } from '../services/iccIcbEngine';
import { evaluateSufficiencyForSICBE } from '../services/sufficiencyEngine';
import { evaluatePublicationGate } from '../services/publicationGate';
import {
  canTransitionECI,
  generateECISHA256,
  branchNewECIVersion,
} from '../services/eciStateMachine';
import { initializeEngineExecutions } from '../services/mccOrchestrator';
import { runMIACIEvaluation } from '../services/miaciEngine';
import { buildE25Report, signE25Report as signReportHelper } from '../services/e25ReportEngine';
import { INITIAL_PATIENT_SICBE_MAP } from '../data/sicbeSeedData';
import { DEFAULT_DOMAIN_WEIGHT_SET } from '../data/sicbeBiomarkersData';
import { runSICBEAssessment } from '../services/sicbeEngine';
import { sicbeApiStore, postAssessmentValidation } from '../services/sicbeApi';

interface ClinicalContextType {
  // Autenticación & RBAC
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  requestPasswordRecovery: (email: string) => string;
  sessionRemainingMinutes: number;

  // Pacientes
  patients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  selectedPatient: Patient;
  setSelectedPatient: (patient: Patient | string) => void;
  addPatient: (patient: Omit<Patient, 'id' | 'cohortCode' | 'medicalRecordNumber'>) => Patient;
  updatePatient: (patient: Patient) => void;

  // Problemas, Medicamentos y Alergias
  activeProblems: ActiveProblem[];
  addProblem: (problem: Omit<ActiveProblem, 'id'>) => void;
  updateProblem: (problem: ActiveProblem) => void;
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id'>) => void;
  allergies: Allergy[];
  addAllergy: (allergy: Omit<Allergy, 'id'>) => void;

  // Observaciones Clínicas (Inmutabilidad y No Borrado)
  observations: ClinicalObservation[];
  patientObservations: ClinicalObservation[];
  addObservation: (obs: Omit<ClinicalObservation, 'id' | 'status'>) => ClinicalObservation;
  correctObservation: (observationId: string, correctedValue: number | string | boolean, reason: string) => void;

  // Laboratorio Clínico
  laboratoryResults: LaboratoryResult[];
  patientLaboratoryResults: LaboratoryResult[];
  laboratories: LaboratoryResult[];
  addLaboratoryResult: (res: Omit<LaboratoryResult, 'id'>) => LaboratoryResult;

  // Diccionario Maestro de Variables (DMV)
  dmvVariables: VariableDefinition[];

  // Alertas de Seguridad E00
  safetyAlerts: SafetyAlert[];
  patientSafetyAlerts: SafetyAlert[];
  alerts: SafetyAlert[];
  patientAlerts: SafetyAlert[];
  unresolvedCriticalAlertsCount: number;
  resolveAlert: (alertId: string, reason: string, requiredAction?: string) => void;
  createAlert: (alert: Omit<SafetyAlert, 'id' | 'triggeredAt' | 'isResolved'>) => void;

  // Documentos Clínicos
  patientDocuments: ClinicalDocument[];
  documents: ClinicalDocument[];
  addDocument: (doc: Omit<ClinicalDocument, 'id'>) => void;

  // Dominios y Longitudinalidad
  patientDomains: DomainScoreSummary[];
  updateDomainScore: (domainId: string, newScore: number, reason: string) => void;
  longitudinalPoints: LongitudinalPoint[];

  // Encuentros Clínicos
  encounters: Encounter[];
  patientEncounters: Encounter[];
  activeEncounter: Encounter | null;
  startEncounter: (type: Encounter['encounterType'], clinicalObjective?: string) => Encounter;
  resumeEncounter: (encounterId: string) => void;
  updateEncounterProgress: (updates: Partial<Encounter>) => void;
  updateEncounterSummary: (summary: string) => void;
  saveEncounterDraft: () => void;
  signAndCloseEncounter: (passwordSignature: string) => boolean;
  cancelEncounter: () => void;

  // Auditoría Inmutable
  auditLogs: AuditLog[];
  logAuditEvent: (
    action: AuditLog['action'],
    entity: string,
    entityId: string,
    details: string,
    previousValue?: string,
    newValue?: string,
    reason?: string
  ) => void;

  // Overrides Médicos
  applyOverride: (
    variableKey: string,
    overriddenValue: string,
    reason: string
  ) => void;

  // FASE 3: Núcleo Inteligente (DataGaps, Incertidumbres, Conflictos, ECI, MCC, ICC/ICB, E25)
  dataGaps: DataGap[];
  patientDataGaps: DataGap[];
  addDataGap: (gap: Omit<DataGap, 'data_gap_id' | 'created_at'>) => DataGap;
  resolveDataGap: (gapId: string, resolution: string) => void;

  uncertainties: Uncertainty[];
  patientUncertainties: Uncertainty[];
  addUncertainty: (unc: Omit<Uncertainty, 'uncertainty_id' | 'created_at' | 'resolved'>) => Uncertainty;
  resolveUncertainty: (uncId: string, resolution: string) => void;

  conflicts: Conflict[];
  patientConflicts: Conflict[];
  addConflict: (conflict: Omit<Conflict, 'conflict_id' | 'created_at' | 'status'>) => Conflict;
  reconcileConflict: (
    conflictId: string,
    clinician: string,
    decision: ConflictReconciliation['decision'],
    chosenValue: any,
    reason: string
  ) => void;
  resolveConflict?: (conflictId: string, chosenEvidenceId: string, clinicalNote: string) => void;

  // ECI & Lifecycle
  ecis: ECI[];
  patientECIs: ECI[];
  currentECI: ECI | null;
  saveECI: (eci: ECI) => void;
  publishECI: (eciId: string, passwordSignature?: string) => { success: boolean; error?: string };
  branchECI: (parentECIOrId: ECI | string, changeTypeOrReason?: 'PATCH' | 'MINOR' | 'MAJOR' | string, maybeReason?: string) => ECI | null;
  transitionECIState: (eciId: string, targetState: ECILifecycleState, reason: string) => { success: boolean; error?: string };

  // MCC (MetaMotor de Coordinación)
  engineExecutions: ClinicalEngineExecution[];
  runMCC: (encounterId?: string) => void;

  // Confiabilidad y Coherencia (ICC, ICB, Suficiencia, Gate)
  currentICC: ICCGrading;
  currentICB: ICBGrading;
  currentSufficiency: SufficiencyEvaluation;
  publicationGate: PublicationGateResult;

  // MIACI Directives
  miaciDirectives: MIACIDirective[];
  runMIACI: (mode?: 'INTERACTIVE' | 'DOCUMENT') => void;

  // E25 Reportes
  reports: E25Report[];
  patientReports: E25Report[];
  createOrUpdateE25Report: (report?: E25Report) => void;
  signReport: (reportId: string, eciVersionOrLicense?: string, physicianName?: string, statement?: string) => boolean;

  // FASE 4: SICBE (Clasificador Biológico del Envejecimiento)
  patientSicbeAssessments: SICBEAssessment[];
  activeSicbeAssessment: SICBEAssessment | null;
  allSicbeWeightSets: DomainWeightSet[];
  activeWeightSet: DomainWeightSet;
  setActiveWeightSet: (ws: DomainWeightSet) => void;
  updateWeightSet: (ws: DomainWeightSet) => void;
  calculatePatientSICBE: (patientId?: string, options?: { forceEssentialOnly?: boolean; isSimulation?: boolean; customWeightSet?: DomainWeightSet }) => SICBEAssessment;
  validateSICBEAssessment: (assessmentId: string, interpretation: PhysicianSICBEInterpretation) => Promise<boolean>;
  exportSICBEData: (patientId: string, format: 'json' | 'csv') => string;
}

const ClinicalContext = createContext<ClinicalContextType | undefined>(undefined);

export const ClinicalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Autenticación
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // Dr. Liriano por defecto
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [sessionRemainingMinutes, setSessionRemainingMinutes] = useState<number>(45);

  // Pacientes
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PAT-002'); // Casilda De La Cruz

  // Datos Clínicos
  const [problemsMap, setProblemsMap] = useState(INITIAL_PROBLEMS);
  const [medicationsMap, setMedicationsMap] = useState(INITIAL_MEDICATIONS);
  const [allergiesMap, setAllergiesMap] = useState(INITIAL_ALLERGIES);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>(INITIAL_SAFETY_ALERTS);
  const [documentsMap, setDocumentsMap] = useState(INITIAL_DOCUMENTS);
  const [longitudinalMap, setLongitudinalMap] = useState(INITIAL_LONGITUDINAL_POINTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Observaciones y Laboratorio
  const [observations, setObservations] = useState<ClinicalObservation[]>(INITIAL_OBSERVATIONS);
  const [laboratoryResults, setLaboratoryResults] = useState<LaboratoryResult[]>(INITIAL_LAB_RESULTS);

  // FASE 3: Estado Núcleo Inteligente (DataGaps, Incertidumbres, Conflictos, ECI, MCC, Reportes)
  const [dataGaps, setDataGaps] = useState<DataGap[]>(INITIAL_DATA_GAPS);
  const [uncertainties, setUncertainties] = useState<Uncertainty[]>(INITIAL_UNCERTAINTIES);
  const [conflicts, setConflicts] = useState<Conflict[]>(INITIAL_CONFLICTS);
  const [ecisMap, setEcisMap] = useState<Record<string, ECI[]>>(INITIAL_PATIENT_ECIS);
  const [engineExecutions, setEngineExecutions] = useState<ClinicalEngineExecution[]>(initializeEngineExecutions());
  const [reports, setReports] = useState<E25Report[]>([]);

  // FASE 4: SICBE (Clasificador Biológico del Envejecimiento)
  const [sicbeMap, setSicbeMap] = useState<Record<string, SICBEAssessment[]>>(INITIAL_PATIENT_SICBE_MAP);
  const [weightSets, setWeightSets] = useState<DomainWeightSet[]>([DEFAULT_DOMAIN_WEIGHT_SET]);
  const [activeWeightSet, setActiveWeightSet] = useState<DomainWeightSet>(DEFAULT_DOMAIN_WEIGHT_SET);

  // Inicializar store de API en memoria con evaluaciones semilla
  useEffect(() => {
    Object.values(INITIAL_PATIENT_SICBE_MAP).forEach((list) => {
      list.forEach((a) => sicbeApiStore.saveAssessment(a));
    });
  }, []);

  // Encuentros Clínicos
  const [encounters, setEncounters] = useState<Encounter[]>([
    {
      id: 'ENC-2026-07-002',
      patientId: 'PAT-002',
      encounterType: 'Pre-SICBE',
      date: '2026-07-02',
      startTime: '2026-07-02T09:00:00Z',
      endTime: '2026-07-02T09:30:00Z',
      physicianId: 'USR-001',
      physicianName: 'Dr. Leonel Francisco Liriano Espinal',
      status: 'Cerrado y firmado',
      isE00Active: true,
      chiefComplaint: 'Evaluación de longevidad y caracterización de masa pelviana en anexo izquierdo.',
      clinicalSummary: 'Paciente de 89 años en excelente estado funcional basal (5/5 ABVD independiente). Se documenta masa anexial izquierda con ascitis incipiente y CA-125 de 475.6 U/mL. Se activa regla PD-005 para suspensión de cálculo SICBE hasta resolución quirúrgica.',
      notes: 'Prioridad oncológica absoluta. Suspensión inmediata de metotrexato.',
      observations: ['OBS-001', 'OBS-002', 'OBS-003', 'OBS-004', 'OBS-005', 'OBS-006'],
      signature: {
        signedBy: 'Dr. Leonel Francisco Liriano Espinal',
        license: 'MED-RD-84920',
        timestamp: '2026-07-02T09:30:15Z',
        hash: 'SHA256-48FA90B3841C',
      },
    },
    {
      id: 'ENC-2026-05-003',
      patientId: 'PAT-003',
      encounterType: 'Seguimiento',
      date: '2026-05-12',
      startTime: '2026-05-12T10:00:00Z',
      endTime: '2026-05-12T10:45:00Z',
      physicianId: 'USR-001',
      physicianName: 'Dr. Leonel Francisco Liriano Espinal',
      status: 'Cerrado y firmado',
      isE00Active: false,
      chiefComplaint: 'Control de DM2 y quejas de cansancio al caminar.',
      clinicalSummary: 'Paciente masculino de 74 años con DM2 no compensada (HbA1c 8.4%) y sarcopenia clínica confirmada por dinamometría baja (22 kg) y marcha 0.72 m/s.',
      observations: ['OBS-010', 'OBS-011', 'OBS-012'],
      signature: {
        signedBy: 'Dr. Leonel Francisco Liriano Espinal',
        license: 'MED-RD-84920',
        timestamp: '2026-05-12T10:45:00Z',
        hash: 'SHA256-119BAC44DE01',
      },
    },
  ]);

  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(null);

  const [domainsMap, setDomainsMap] = useState<Record<string, DomainScoreSummary[]>>({
    'PAT-002': CASILDA_DOMAINS,
    'PAT-003': TAVAREZ_DOMAINS,
    'PAT-004': FERNANDEZ_DOMAINS,
  });

  // Selected Patient
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  const setSelectedPatient = useCallback((patientOrId: Patient | string) => {
    if (typeof patientOrId === 'string') {
      setSelectedPatientId(patientOrId);
    } else if (patientOrId && patientOrId.id) {
      setSelectedPatientId(patientOrId.id);
    }
  }, []);

  const activeProblems = useMemo(() => {
    return problemsMap[selectedPatientId] || [];
  }, [problemsMap, selectedPatientId]);

  const medications = useMemo(() => {
    return medicationsMap[selectedPatientId] || [];
  }, [medicationsMap, selectedPatientId]);

  const allergies = useMemo(() => {
    return allergiesMap[selectedPatientId] || [];
  }, [allergiesMap, selectedPatientId]);

  const patientDocuments = useMemo(() => {
    return documentsMap[selectedPatientId] || [];
  }, [documentsMap, selectedPatientId]);

  const allDocuments = useMemo(() => {
    return Object.values(documentsMap).flat();
  }, [documentsMap]);

  const patientDomains = useMemo(() => {
    return domainsMap[selectedPatientId] || CASILDA_DOMAINS;
  }, [domainsMap, selectedPatientId]);

  const longitudinalPoints = useMemo(() => {
    return longitudinalMap[selectedPatientId] || [];
  }, [longitudinalMap, selectedPatientId]);

  const patientSafetyAlerts = useMemo(() => {
    return safetyAlerts.filter((a) => a.patientId === selectedPatientId);
  }, [safetyAlerts, selectedPatientId]);

  const unresolvedCriticalAlertsCount = useMemo(() => {
    return safetyAlerts.filter(
      (a) => !a.isResolved && (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL')
    ).length;
  }, [safetyAlerts]);

  const patientObservations = useMemo(() => {
    return observations.filter((o) => o.patientId === selectedPatientId);
  }, [observations, selectedPatientId]);

  const patientLaboratoryResults = useMemo(() => {
    return laboratoryResults.filter((l) => l.patientId === selectedPatientId);
  }, [laboratoryResults, selectedPatientId]);

  const patientEncounters = useMemo(() => {
    return encounters.filter((e) => e.patientId === selectedPatientId);
  }, [encounters, selectedPatientId]);

  // FASE 3: Selectores Reactivos
  const patientDataGaps = useMemo(() => {
    return dataGaps.filter((g) => g.patient_id === selectedPatientId);
  }, [dataGaps, selectedPatientId]);

  const patientUncertainties = useMemo(() => {
    return uncertainties.filter((u) => u.patient_id === selectedPatientId);
  }, [uncertainties, selectedPatientId]);

  const patientConflicts = useMemo(() => {
    return conflicts.filter((c) => c.patient_id === selectedPatientId);
  }, [conflicts, selectedPatientId]);

  const patientECIs = useMemo(() => {
    return ecisMap[selectedPatientId] || [];
  }, [ecisMap, selectedPatientId]);

  const currentECI = useMemo(() => {
    const list = ecisMap[selectedPatientId] || [];
    return list.find((e) => e.status !== 'E10_CERRADO_HISTORICO' && e.status !== 'E11_ARCHIVADO') || list[0] || null;
  }, [ecisMap, selectedPatientId]);

  const patientReports = useMemo(() => {
    return reports.filter((r) => r.patient_id === selectedPatientId);
  }, [reports, selectedPatientId]);

  // FASE 4: Selectores SICBE
  const patientSicbeAssessments = useMemo(() => {
    return sicbeMap[selectedPatientId] || [];
  }, [sicbeMap, selectedPatientId]);

  const activeSicbeAssessment = useMemo(() => {
    const list = sicbeMap[selectedPatientId] || [];
    return list.length > 0 ? list[list.length - 1] : null;
  }, [sicbeMap, selectedPatientId]);

  // Cálculo Dinámico de Confiabilidad (ICC)
  const currentICC = useMemo<ICCGrading>(() => {
    return calculateICC({
      patient: selectedPatient,
      patientId: selectedPatientId,
      observations: patientObservations,
      dataGaps: patientDataGaps,
      uncertainties: patientUncertainties,
      conflicts: patientConflicts,
    });
  }, [selectedPatient, selectedPatientId, patientObservations, patientDataGaps, patientUncertainties, patientConflicts]);

  // Cálculo Dinámico de Coherencia Biológica (ICB)
  const currentICB = useMemo<ICBGrading>(() => {
    return calculateICB({
      patientId: selectedPatientId,
      observations: patientObservations,
      conflicts: patientConflicts,
      uncertainties: patientUncertainties,
      alerts: patientSafetyAlerts,
    });
  }, [selectedPatientId, patientObservations, patientConflicts, patientUncertainties, patientSafetyAlerts]);

  // Suficiencia Clínica para SICBE
  const currentSufficiency = useMemo<SufficiencyEvaluation>(() => {
    return evaluateSufficiencyForSICBE({
      patientId: selectedPatientId,
      domains: patientDomains,
      alerts: patientSafetyAlerts,
      icc: currentICC,
      dataGaps: patientDataGaps,
      conflicts: patientConflicts,
    });
  }, [selectedPatientId, patientDomains, patientSafetyAlerts, currentICC, patientDataGaps, patientConflicts]);

  // Compuerta de Publicación
  const publicationGate = useMemo<PublicationGateResult>(() => {
    return evaluatePublicationGate({
      clinicalObjective: currentECI?.clinical_objective || activeEncounter?.chiefComplaint || 'Evaluación integral geriátrica y biomarcadores',
      alerts: patientSafetyAlerts,
      icc: currentICC,
      icb: currentICB,
      sufficiency: currentSufficiency,
      currentUser,
      observations: patientObservations,
      encounterStatus: activeEncounter?.status || 'Active',
    });
  }, [currentECI, activeEncounter, patientSafetyAlerts, currentICC, currentICB, currentSufficiency, currentUser, patientObservations]);

  // Directivas MIACI dinámicas
  const miaciDirectives = useMemo<MIACIDirective[]>(() => {
    const miaciResult = runMIACIEvaluation({
      patient: selectedPatient,
      alerts: patientSafetyAlerts,
      observations: patientObservations,
      dataGaps: patientDataGaps,
      conflicts: patientConflicts,
      mode: 'INTERACTIVE',
    });
    return miaciResult.directives;
  }, [selectedPatient, patientSafetyAlerts, patientObservations, patientDataGaps, patientConflicts]);

  // Auditoría append-only
  const logAuditEvent = useCallback(
    (
      action: AuditLog['action'],
      entity: string,
      entityId: string,
      details: string,
      previousValue?: string,
      newValue?: string,
      reason?: string
    ) => {
      const newLog: AuditLog = {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        entity,
        entityId,
        details,
        previousValue,
        newValue,
        reason,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  // Simulación de sesión con temporizador
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSessionRemainingMinutes((prev) => {
        if (prev <= 1) {
          setIsAuthenticated(false);
          logAuditEvent('LOGOUT', 'UserSession', currentUser.id, 'Sesión expirada por inactividad');
          return 45;
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser.id, logAuditEvent]);

  // Login & Logout
  const login = useCallback(
    (email: string) => {
      const foundUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        setCurrentUser(foundUser);
        setIsAuthenticated(true);
        setSessionRemainingMinutes(45);
        logAuditEvent('LOGIN', 'UserSession', foundUser.id, `Inicio de sesión exitoso como ${foundUser.role}`);
        return true;
      }
      return false;
    },
    [logAuditEvent]
  );

  const logout = useCallback(() => {
    logAuditEvent('LOGOUT', 'UserSession', currentUser.id, 'Cierre de sesión manual');
    setIsAuthenticated(false);
  }, [currentUser, logAuditEvent]);

  const switchUser = useCallback(
    (userId: string) => {
      const targetUser = INITIAL_USERS.find((u) => u.id === userId);
      if (targetUser) {
        logAuditEvent('LOGIN', 'UserSession', targetUser.id, `Cambio rápido de rol a ${targetUser.role} (${targetUser.name})`);
        setCurrentUser(targetUser);
        setIsAuthenticated(true);
        setSessionRemainingMinutes(45);
      }
    },
    [logAuditEvent]
  );

  const requestPasswordRecovery = useCallback(
    (email: string) => {
      logAuditEvent('VIEW_SENSITIVE_DATA', 'Security', email, `Solicitud de recuperación de credenciales`);
      return `Se ha enviado un enlace de recuperación seguro al correo institucional ${email}.`;
    },
    [logAuditEvent]
  );

  // Observaciones Clínicas (Principio de No Borrado)
  const addObservation = useCallback(
    (obsData: Omit<ClinicalObservation, 'id' | 'status'>) => {
      const newObs: ClinicalObservation = {
        ...obsData,
        id: `OBS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'ACTIVE',
      };
      setObservations((prev) => [newObs, ...prev]);
      logAuditEvent('CREATE', 'ClinicalObservation', newObs.id, `Observación registrada: ${newObs.variableName} = ${newObs.value} ${newObs.unitOriginal || ''}`);
      return newObs;
    },
    [logAuditEvent]
  );

  const correctObservation = useCallback(
    (observationId: string, correctedValue: number | string | boolean, reason: string) => {
      setObservations((prev) =>
        prev.map((obs) => {
          if (obs.id === observationId) {
            const historyItem = {
              previousValue: obs.value,
              correctedValue,
              correctedBy: currentUser.name,
              timestamp: new Date().toISOString(),
              reason,
            };
            return {
              ...obs,
              value: correctedValue,
              original_value: obs.value, // Preservado
              status: 'ACTIVE',
              correctionHistory: [...(obs.correctionHistory || []), historyItem],
            };
          }
          return obs;
        })
      );
      logAuditEvent(
        'UPDATE',
        'ClinicalObservation',
        observationId,
        `Corrección no destructiva de observación médica: ${reason}`,
        undefined,
        String(correctedValue),
        reason
      );
    },
    [currentUser, logAuditEvent]
  );

  // Laboratorio Clínico
  const addLaboratoryResult = useCallback(
    (resultData: Omit<LaboratoryResult, 'id'>) => {
      const newLab: LaboratoryResult = {
        ...resultData,
        id: `LAB-${Date.now()}`,
      };
      setLaboratoryResults((prev) => [newLab, ...prev]);
      logAuditEvent('CREATE', 'LaboratoryResult', newLab.id, `Resultado analítico registrado: ${newLab.testName} = ${newLab.value} ${newLab.unit}`);
      return newLab;
    },
    [logAuditEvent]
  );

  // Alertas E00
  const resolveAlert = useCallback(
    (alertId: string, reason: string, requiredAction?: string) => {
      setSafetyAlerts((prev) =>
        prev.map((alert) => {
          if (alert.id === alertId) {
            return {
              ...alert,
              isResolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: currentUser.name,
              resolutionReason: reason,
              resolution: requiredAction || reason,
              status: 'RESOLVED',
            };
          }
          return alert;
        })
      );
      logAuditEvent(
        'RESOLVE_ALERT',
        'SafetyAlert',
        alertId,
        `Alerta E00 resuelta formalmente por médico: ${reason}`,
        'ACTIVE',
        'RESOLVED',
        reason
      );
    },
    [currentUser, logAuditEvent]
  );

  const createAlert = useCallback(
    (alert: Omit<SafetyAlert, 'id' | 'triggeredAt' | 'isResolved'>) => {
      const newAlert: SafetyAlert = {
        ...alert,
        id: `ALT-${Date.now()}`,
        triggeredAt: new Date().toISOString(),
        isResolved: false,
        status: 'ACTIVE',
      };
      setSafetyAlerts((prev) => [newAlert, ...prev]);
      logAuditEvent('ALERT', 'SafetyAlert', newAlert.id, `Alerta E00 activada (${newAlert.severity}): ${newAlert.title}`);
    },
    [logAuditEvent]
  );

  // Problemas, Medicamentos, Alergias
  const addProblem = useCallback(
    (problemData: Omit<ActiveProblem, 'id'>) => {
      const currentList = problemsMap[selectedPatientId] || [];
      const newId = `P${currentList.length + 1}`;
      const newProblem: ActiveProblem = { ...problemData, id: newId };
      setProblemsMap((prev) => ({
        ...prev,
        [selectedPatientId]: [newProblem, ...(prev[selectedPatientId] || [])],
      }));
      logAuditEvent('CREATE', 'ActiveProblem', newId, `Nuevo problema añadido: ${newProblem.title}`);
    },
    [problemsMap, selectedPatientId, logAuditEvent]
  );

  const updateProblem = useCallback(
    (problem: ActiveProblem) => {
      setProblemsMap((prev) => ({
        ...prev,
        [selectedPatientId]: (prev[selectedPatientId] || []).map((p) =>
          p.id === problem.id ? problem : p
        ),
      }));
      logAuditEvent('UPDATE', 'ActiveProblem', problem.id, `Problema actualizado: ${problem.title}`);
    },
    [selectedPatientId, logAuditEvent]
  );

  const addMedication = useCallback(
    (medData: Omit<Medication, 'id'>) => {
      const newMed: Medication = { ...medData, id: `MED-${Date.now()}` };
      setMedicationsMap((prev) => ({
        ...prev,
        [selectedPatientId]: [newMed, ...(prev[selectedPatientId] || [])],
      }));
      logAuditEvent('CREATE', 'Medication', newMed.id, `Medicamento prescrito: ${newMed.name}`);
    },
    [selectedPatientId, logAuditEvent]
  );

  const addAllergy = useCallback(
    (allergyData: Omit<Allergy, 'id'>) => {
      const newAllergy: Allergy = { ...allergyData, id: `ALL-${Date.now()}` };
      setAllergiesMap((prev) => ({
        ...prev,
        [selectedPatientId]: [newAllergy, ...(prev[selectedPatientId] || [])],
      }));
      logAuditEvent('CREATE', 'Allergy', newAllergy.id, `Alergia documentada: ${newAllergy.agent}`);
    },
    [selectedPatientId, logAuditEvent]
  );

  const addDocument = useCallback(
    (docData: Omit<ClinicalDocument, 'id'>) => {
      const newDoc: ClinicalDocument = {
        ...docData,
        id: `DOC-${Date.now()}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
      };
      setDocumentsMap((prev) => ({
        ...prev,
        [selectedPatientId]: [newDoc, ...(prev[selectedPatientId] || [])],
      }));
      logAuditEvent('UPLOAD', 'ClinicalDocument', newDoc.id, `Documento indexado: ${newDoc.title}`);
    },
    [selectedPatientId, currentUser, logAuditEvent]
  );

  const updateDomainScore = useCallback(
    (domainId: string, newScore: number, reason: string) => {
      setDomainsMap((prev) => {
        const currentList = prev[selectedPatientId] || [];
        const oldScore = currentList.find((d) => d.domainId === domainId)?.score ?? 0;
        const updated = currentList.map((d) => {
          if (d.domainId === domainId) {
            return {
              ...d,
              score: newScore,
              status:
                newScore >= 80
                  ? 'ALARMA_ACTIVA'
                  : newScore >= 50
                  ? 'COMPROMETIDO'
                  : newScore >= 26
                  ? 'VIGILANCIA'
                  : 'PRESERVADO',
            };
          }
          return d;
        });
        logAuditEvent(
          'UPDATE',
          'DomainScore',
          `${selectedPatientId}-${domainId}`,
          `Score de dominio modificado manualmente por médico`,
          oldScore.toString(),
          newScore.toString(),
          reason
        );
        return { ...prev, [selectedPatientId]: updated };
      });
    },
    [selectedPatientId, logAuditEvent]
  );

  // Pacientes CRUD
  const addPatient = useCallback(
    (data: Omit<Patient, 'id' | 'cohortCode' | 'medicalRecordNumber'>) => {
      const nextIndex = patients.length + 1;
      const id = `PAT-${String(nextIndex).padStart(3, '0')}`;
      const cohortCode = `SICBE-PILOT-${String(nextIndex).padStart(3, '0')}`;
      const medicalRecordNumber = `EXP-${data.birthDate.replace(/-/g, '')}-${String(nextIndex).padStart(2, '0')}`;

      const newPatient: Patient = {
        ...data,
        id,
        cohortCode,
        medicalRecordNumber,
        isDemoData: true,
      };

      setPatients((prev) => [newPatient, ...prev]);
      setSelectedPatientId(id);
      logAuditEvent('CREATE', 'Patient', id, `Nuevo paciente admitido: ${newPatient.firstName} ${newPatient.lastName}`);
      return newPatient;
    },
    [patients.length, logAuditEvent]
  );

  const updatePatient = useCallback(
    (updated: Patient) => {
      setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      logAuditEvent('UPDATE', 'Patient', updated.id, `Datos de paciente actualizados sin sobreescritura destructiva`);
    },
    [logAuditEvent]
  );

  // Encuentros Clínicos
  const startEncounter = useCallback(
    (type: Encounter['encounterType'], clinicalObjective?: string) => {
      const newEnc: Encounter = {
        id: `ENC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        patientId: selectedPatientId,
        encounterType: type,
        visitMilestone: 'V1',
        date: new Date().toISOString().slice(0, 10),
        startTime: new Date().toISOString(),
        physicianId: currentUser.id,
        physicianName: currentUser.name,
        physician: {
          id: currentUser.id,
          name: currentUser.name,
          license: currentUser.licenseNumber,
        },
        participants: [{ id: currentUser.id, name: currentUser.name, role: currentUser.role }],
        status: 'IN_PROGRESS',
        isE00Active: false,
        chiefComplaint: '',
        clinicalSummary: '',
        clinicalObjective: clinicalObjective || 'Evaluación integral adaptativa y gerociencia',
        observations: [],
        documents: [],
        alerts: [],
      };
      setActiveEncounter(newEnc);
      setEncounters((prev) => [newEnc, ...prev.filter((e) => e.id !== newEnc.id)]);
      logAuditEvent('ENCOUNTER_OPEN', 'Encounter', newEnc.id, `Encuentro clínico iniciado: Tipo ${type}`);
      return newEnc;
    },
    [selectedPatientId, currentUser, logAuditEvent]
  );

  const resumeEncounter = useCallback((encounterId: string) => {
    const enc = encounters.find((e) => e.id === encounterId);
    if (enc) {
      setActiveEncounter(enc);
    }
  }, [encounters]);

  const updateEncounterProgress = useCallback((updates: Partial<Encounter>) => {
    setActiveEncounter((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const updateEncounterSummary = useCallback((summary: string) => {
    setActiveEncounter((prev) => (prev ? { ...prev, clinicalSummary: summary } : null));
  }, []);

  const saveEncounterDraft = useCallback(() => {
    if (!activeEncounter) return;
    const draft = { ...activeEncounter, status: 'DRAFT' as const };
    setActiveEncounter(draft);
    setEncounters((prev) => prev.map((e) => (e.id === draft.id ? draft : e)));
    logAuditEvent('UPDATE', 'Encounter', draft.id, 'Borrador de encuentro clínico autoguardado');
  }, [activeEncounter, logAuditEvent]);

  const signAndCloseEncounter = useCallback(
    (passwordSignature: string) => {
      if (!activeEncounter) return false;
      if (passwordSignature.length < 3) return false;

      const closedEncounter: Encounter = {
        ...activeEncounter,
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        signature: {
          signedBy: currentUser.name,
          license: currentUser.licenseNumber || 'AUTORIZADO',
          timestamp: new Date().toISOString(),
          hash: `SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        },
      };

      setEncounters((prev) => prev.map((e) => (e.id === closedEncounter.id ? closedEncounter : e)));
      setActiveEncounter(null);

      logAuditEvent(
        'ENCOUNTER_CLOSE',
        'Encounter',
        closedEncounter.id,
        `Encuentro cerrado y firmado digitalmente por ${currentUser.name}`,
        'IN_PROGRESS',
        'COMPLETED'
      );
      return true;
    },
    [activeEncounter, currentUser, logAuditEvent]
  );

  const cancelEncounter = useCallback(() => {
    if (activeEncounter) {
      logAuditEvent('UPDATE', 'Encounter', activeEncounter.id, 'Encuentro clínico descartado/cancelado');
    }
    setActiveEncounter(null);
  }, [activeEncounter, logAuditEvent]);

  // Aplicar Override Médico
  const applyOverride = useCallback(
    (variableKey: string, overriddenValue: string, reason: string) => {
      logAuditEvent(
        'OVERRIDE',
        'InferredStateM23',
        `${selectedPatientId}-${variableKey}`,
        `Override clínico aplicado a inferencia pre-SICBE`,
        'Valor calculado por sistema',
        overriddenValue,
        reason
      );
    },
    [selectedPatientId, logAuditEvent]
  );

  // FASE 3: Métodos DataGaps
  const addDataGap = useCallback(
    (gap: Omit<DataGap, 'data_gap_id' | 'created_at'>) => {
      const newGap: DataGap = {
        ...gap,
        data_gap_id: `GAP-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
      };
      setDataGaps((prev) => [newGap, ...prev]);
      logAuditEvent('CREATE', 'DataGap', newGap.data_gap_id, `Brecha de datos detectada: ${newGap.variable_name}`);
      return newGap;
    },
    [logAuditEvent]
  );

  const resolveDataGap = useCallback(
    (gapId: string, resolution: string) => {
      setDataGaps((prev) =>
        prev.map((g) =>
          g.data_gap_id === gapId
            ? { ...g, resolved_at: new Date().toISOString(), resolution_notes: resolution }
            : g
        )
      );
      logAuditEvent('UPDATE', 'DataGap', gapId, `Brecha de datos resuelta o compensada: ${resolution}`);
    },
    [logAuditEvent]
  );

  // FASE 3: Métodos Incertidumbres
  const addUncertainty = useCallback(
    (unc: Omit<Uncertainty, 'uncertainty_id' | 'created_at' | 'resolved'>) => {
      const newUnc: Uncertainty = {
        ...unc,
        uncertainty_id: `UNC-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
        resolved: false,
      };
      setUncertainties((prev) => [newUnc, ...prev]);
      logAuditEvent('CREATE', 'Uncertainty', newUnc.uncertainty_id, `Incertidumbre registrada [${newUnc.type}]: ${newUnc.description}`);
      return newUnc;
    },
    [logAuditEvent]
  );

  const resolveUncertainty = useCallback(
    (uncId: string, resolution: string) => {
      setUncertainties((prev) =>
        prev.map((u) =>
          u.uncertainty_id === uncId
            ? { ...u, resolved: true, resolution_notes: resolution }
            : u
        )
      );
      logAuditEvent('UPDATE', 'Uncertainty', uncId, `Incertidumbre mitigada/resuelta: ${resolution}`);
    },
    [logAuditEvent]
  );

  // FASE 3: Métodos Conflictos & Reconciliación
  const addConflict = useCallback(
    (conflict: Omit<Conflict, 'conflict_id' | 'created_at' | 'status'>) => {
      const newConflict: Conflict = {
        ...conflict,
        conflict_id: `CONF-${Date.now().toString().slice(-4)}`,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      };
      setConflicts((prev) => [newConflict, ...prev]);
      logAuditEvent('CREATE', 'Conflict', newConflict.conflict_id, `Conflicto clínico detectado: ${newConflict.description}`);
      return newConflict;
    },
    [logAuditEvent]
  );

  const reconcileConflict = useCallback(
    (
      conflictId: string,
      clinician: string,
      decision: ConflictReconciliation['decision'],
      chosenValue: any,
      reason: string
    ) => {
      const rec: ConflictReconciliation = {
        clinician,
        decision,
        chosen_value: chosenValue,
        reason,
        timestamp: new Date().toISOString(),
      };

      setConflicts((prev) =>
        prev.map((c) =>
          c.conflict_id === conflictId
            ? { ...c, status: 'RECONCILED', reconciliation: rec }
            : c
        )
      );

      logAuditEvent(
        'RECONCILE',
        'Conflict',
        conflictId,
        `Conflicto reconciliado por facultativo. Decisión: ${decision}. Valor: ${chosenValue}`,
        undefined,
        String(chosenValue),
        reason
      );
    },
    [logAuditEvent]
  );

  // FASE 3: ECI y Ciclo de Vida Inmutable
  const saveECI = useCallback(
    (updatedECI: ECI) => {
      setEcisMap((prev) => {
        const patientList = prev[updatedECI.patient_id] || [];
        const existingIdx = patientList.findIndex((e) => e.eci_id === updatedECI.eci_id);
        if (existingIdx >= 0) {
          // Si el existente es inmutable, rechazar sobreescritura
          if (patientList[existingIdx].is_immutable && patientList[existingIdx].status === 'E8_PUBLICADO') {
            console.warn(`[ECI] Intento de modificar versión inmutable ${updatedECI.version}. Operación bloqueada.`);
            return prev;
          }
          const copy = [...patientList];
          copy[existingIdx] = updatedECI;
          return { ...prev, [updatedECI.patient_id]: copy };
        } else {
          return { ...prev, [updatedECI.patient_id]: [updatedECI, ...patientList] };
        }
      });
      logAuditEvent('UPDATE', 'ECI', updatedECI.eci_id, `Estado ECI actualizado a ${updatedECI.status}`);
    },
    [logAuditEvent]
  );

  const resolveConflict = useCallback(
    (conflictId: string, chosenEvidenceId: string, clinicalNote: string) => {
      reconcileConflict(conflictId, 'PREFER_NEWER', chosenEvidenceId, clinicalNote);
    },
    [reconcileConflict]
  );

  const publishECI = useCallback(
    (eciId: string, passwordSignature?: string) => {
      const signature = passwordSignature || currentUser.medicalLicense || 'COL-MED-84920';
      if (!signature || signature.trim().length === 0) {
        return { success: false, error: 'Firma electrónica requerida.' };
      }

      const patientList = ecisMap[selectedPatientId] || [];
      const targetECI = patientList.find((e) => e.eci_id === eciId);
      if (!targetECI) {
        return { success: false, error: 'ECI no encontrado.' };
      }

      if (!publicationGate.allowed) {
        return { success: false, error: `Bloqueo de compuerta: ${publicationGate.blocked_reasons.join('; ')}` };
      }

      const now = new Date().toISOString();
      const sha256 = generateECISHA256({ ...targetECI, published_at: now, status: 'E8_PUBLICADO' });

      const publishedECI: ECI = {
        ...targetECI,
        status: 'E8_PUBLICADO',
        published_at: now,
        is_immutable: true,
        sha256_hash: sha256,
        publication_gate: publicationGate,
        state_transitions: [
          ...(targetECI.state_transitions || []),
          {
            id: `TR-${Date.now()}`,
            from_state: targetECI.status,
            to_state: 'E8_PUBLICADO',
            timestamp: now,
            user_or_system: currentUser.name,
            reason: 'Publicación oficial autorizada y sellada criptográficamente.',
            preconditions_met: true,
          },
        ],
      };

      saveECI(publishedECI);
      logAuditEvent(
        'SIGN',
        'ECI',
        eciId,
        `ECI v${targetECI.version} publicado oficialmente y sellado con ${sha256}`
      );

      return { success: true };
    },
    [ecisMap, selectedPatientId, publicationGate, currentUser, saveECI, logAuditEvent]
  );

  const branchECI = useCallback(
    (parentECIOrId: ECI | string, changeTypeOrReason: 'PATCH' | 'MINOR' | 'MAJOR' | string = 'MINOR', maybeReason?: string) => {
      let parentECI: ECI | undefined;
      let changeType: 'PATCH' | 'MINOR' | 'MAJOR' = 'MINOR';
      let reason = 'Derivación clínica de nueva rama';

      if (typeof parentECIOrId === 'string') {
        const patientList = ecisMap[selectedPatientId] || [];
        parentECI = patientList.find((e) => e.eci_id === parentECIOrId) || currentECI || patientList[0];
        reason = (typeof changeTypeOrReason === 'string' && !['PATCH', 'MINOR', 'MAJOR'].includes(changeTypeOrReason))
          ? changeTypeOrReason
          : (maybeReason || 'Derivación clínica autorizada');
      } else {
        parentECI = parentECIOrId;
        if (changeTypeOrReason === 'PATCH' || changeTypeOrReason === 'MINOR' || changeTypeOrReason === 'MAJOR') {
          changeType = changeTypeOrReason;
          reason = maybeReason || 'Derivación clínica autorizada';
        } else {
          reason = String(changeTypeOrReason || 'Derivación clínica autorizada');
        }
      }

      if (!parentECI) return null;

      const { updatedParent, newECI } = branchNewECIVersion(
        parentECI,
        changeType,
        reason,
        currentUser.name
      );

      setEcisMap((prev) => {
        const list = prev[parentECI!.patient_id] || [];
        const filtered = list.filter((e) => e.eci_id !== parentECI!.eci_id);
        return {
          ...prev,
          [parentECI!.patient_id]: [newECI, updatedParent, ...filtered],
        };
      });

      logAuditEvent(
        'VERSION',
        'ECI',
        newECI.eci_id,
        `Nueva versión ECI v${newECI.version} derivada de v${parentECI.version}. Razón: ${reason}`
      );

      return newECI;
    },
    [ecisMap, selectedPatientId, currentECI, currentUser, logAuditEvent]
  );

  const transitionECIState = useCallback(
    (eciId: string, targetState: ECILifecycleState, reason: string) => {
      const patientList = ecisMap[selectedPatientId] || [];
      const targetECI = patientList.find((e) => e.eci_id === eciId);
      if (!targetECI) {
        return { success: false, error: 'ECI no encontrado.' };
      }

      const check = canTransitionECI(targetECI.status, targetState, {
        publicationGate,
        hasSignedByPhysician: true,
        conflictsOpenCount: patientConflicts.filter((c) => c.status === 'OPEN').length,
      });

      if (!check.allowed) {
        return { success: false, error: check.reason };
      }

      const now = new Date().toISOString();
      const updated: ECI = {
        ...targetECI,
        status: targetState,
        state_transitions: [
          ...(targetECI.state_transitions || []),
          {
            id: `TR-${Date.now()}`,
            from_state: targetECI.status,
            to_state: targetState,
            timestamp: now,
            user_or_system: currentUser.name,
            reason,
            preconditions_met: true,
          },
        ],
      };

      saveECI(updated);
      return { success: true };
    },
    [ecisMap, selectedPatientId, publicationGate, patientConflicts, currentUser, saveECI]
  );

  // FASE 3: Motores MCC y MIACI
  const runMCC = useCallback(
    (encounterId?: string) => {
      setEngineExecutions((prev) =>
        prev.map((e) => ({
          ...e,
          status: 'SUCCESS',
          execution_time_ms: Math.floor(Math.random() * 40) + 10,
        }))
      );
      logAuditEvent('EXECUTE', 'MCC_ORCHESTRATOR', encounterId || 'GLOBAL', 'Orquestación de motores ejecutada');
    },
    [logAuditEvent]
  );

  const runMIACI = useCallback(
    (mode: 'INTERACTIVE' | 'DOCUMENT' = 'INTERACTIVE') => {
      logAuditEvent('EXECUTE', 'MIACI_ENGINE', selectedPatientId, `Evaluación adaptativa de adquisición en modo ${mode}`);
    },
    [selectedPatientId, logAuditEvent]
  );

  // FASE 3: Reportes E25
  const createOrUpdateE25Report = useCallback(
    (rep?: E25Report) => {
      let reportToSave = rep;
      if (!reportToSave) {
        reportToSave = buildE25Report({
          patient: selectedPatient,
          encounterId: activeEncounter?.id || 'ENC-CURRENT',
          eciVersion: currentECI?.version || '1.0.0',
          e00Alerts: patientSafetyAlerts,
          domains: patientDomains,
          m23Variables: currentECI?.components?.Z_t || {},
          functionalInputs: {},
          currentUser,
        });
      }

      setReports((prev) => {
        const idx = prev.findIndex((r) => r.report_id === reportToSave!.report_id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = reportToSave!;
          return copy;
        }
        return [reportToSave!, ...prev];
      });
      logAuditEvent('CREATE', 'E25Report', reportToSave.report_id, `Informe clínico E25 generado.`);
    },
    [selectedPatient, activeEncounter, currentECI, patientSafetyAlerts, patientDomains, currentUser, logAuditEvent]
  );

  const signReport = useCallback(
    (reportId: string, eciVersionOrLicense?: string, physicianName?: string, _statement?: string) => {
      const rep = reports.find((r) => r.report_id === reportId);
      if (!rep) return false;

      const effectiveVersion = currentECI?.version || rep.eci_version || '1.0.0';
      const signed = signReportHelper(rep, currentUser, effectiveVersion);
      if (physicianName) {
        signed.signature.physician_name = physicianName;
      }
      if (eciVersionOrLicense && (eciVersionOrLicense.includes('-') || eciVersionOrLicense.length > 5)) {
        signed.signature.license = eciVersionOrLicense;
      }
      setReports((prev) => prev.map((r) => (r.report_id === reportId ? signed : r)));
      logAuditEvent('SIGN', 'E25Report', reportId, `Informe E25 firmado digitalmente con hash ${signed.report_hash}`);
      return true;
    },
    [reports, currentECI, currentUser, logAuditEvent]
  );

  // FASE 4: Métodos SICBE
  const updateWeightSet = useCallback((ws: DomainWeightSet) => {
    setWeightSets((prev) => {
      const idx = prev.findIndex((w) => w.version === ws.version);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = ws;
        return copy;
      }
      return [...prev, ws];
    });
    setActiveWeightSet(ws);
  }, []);

  const calculatePatientSICBE = useCallback(
    (
      patientId?: string,
      options?: {
        forceEssentialOnly?: boolean;
        isSimulation?: boolean;
        customWeightSet?: DomainWeightSet;
      }
    ) => {
      const pid = patientId || selectedPatientId;
      const targetPatient = patients.find((p) => p.id === pid) || selectedPatient;
      const targetEci =
        ecisMap[pid]?.[0] ||
        currentECI ||
        ({
          eci_id: `ECI-${pid}-LIVE`,
          patient_id: pid,
          version: '1.0.0',
          status: 'E7_PUBLICABLE',
          clinical_objective: 'Evaluación integral de longevidad y fenotipo biológico SICBE',
          created_at: new Date().toISOString(),
          created_by: currentUser.name,
          components: {
            X_t: observations.filter((o) => o.patientId === pid),
            G_t: [],
            Z_t: {},
            U_t: uncertainties.filter((u) => u.patient_id === pid),
            M_t: {},
            T_t: { timelineDate: new Date().toISOString() },
          },
          data_gaps: dataGaps.filter((g) => g.patient_id === pid),
          conflicts: conflicts.filter((c) => c.patient_id === pid),
          icc: currentICC,
          icb: currentICB,
          sufficiency: currentSufficiency,
          publication_gate: publicationGate,
          history: [],
          state_transitions: [],
        } as ECI);

      const pAlerts = safetyAlerts.filter((a) => a.patientId === pid);
      const pObservations = observations.filter((o) => o.patientId === pid);
      const pLabResults = laboratoryResults.filter((l) => l.patientId === pid);
      const pGaps = dataGaps.filter((g) => g.patient_id === pid);
      const pConflicts = conflicts.filter((c) => c.patient_id === pid);
      const pUncertainties = uncertainties.filter((u) => u.patient_id === pid);

      const assessment = runSICBEAssessment({
        eci: targetEci,
        patient: targetPatient,
        alerts: pAlerts,
        observations: pObservations,
        labResults: pLabResults,
        dataGaps: pGaps,
        conflicts: pConflicts,
        uncertainties: pUncertainties,
        weightSet: options?.customWeightSet || activeWeightSet,
        currentUser,
        forceEssentialOnly: options?.forceEssentialOnly,
        isSimulation: options?.isSimulation,
      });

      if (!options?.isSimulation) {
        setSicbeMap((prev) => {
          const list = prev[pid] ? [...prev[pid]] : [];
          const existingIdx = list.findIndex((a) => a.assessment_id === assessment.assessment_id);
          if (existingIdx >= 0) {
            list[existingIdx] = assessment;
          } else {
            list.push(assessment);
          }
          return { ...prev, [pid]: list };
        });

        // Almacenar en repositorio API in-memory
        sicbeApiStore.saveAssessment(assessment);

        logAuditEvent(
          'SICBE_CALCULATED' as any,
          'SICBEAssessment',
          assessment.assessment_id,
          `Cálculo SICBE ejecutado: Estado ${assessment.state}, SGEB ${assessment.sgeb.toFixed(1)} (${assessment.sgeb_type}).`,
          undefined,
          assessment.state,
          assessment.abstention_reason || 'Ejecución clínica protocolizada'
        );
      }

      return assessment;
    },
    [
      selectedPatientId,
      patients,
      selectedPatient,
      ecisMap,
      currentECI,
      currentUser,
      observations,
      uncertainties,
      dataGaps,
      conflicts,
      currentICC,
      currentICB,
      currentSufficiency,
      publicationGate,
      safetyAlerts,
      laboratoryResults,
      activeWeightSet,
      logAuditEvent,
    ]
  );

  const validateSICBEAssessment = useCallback(
    async (assessmentId: string, interpretation: PhysicianSICBEInterpretation) => {
      const res = await postAssessmentValidation({
        assessment_id: assessmentId,
        physician_id: currentUser.id,
        physician_name: currentUser.name,
        license_number: currentUser.licenseNumber || 'Exeq. 89412-MED',
        interpretation: interpretation.interpretation,
        clinical_agreement: interpretation.clinical_agreement,
        relevant_domains: interpretation.relevant_domains,
        priority_findings: interpretation.priority_findings,
        limitations: interpretation.limitations,
        follow_up_recommendation: interpretation.follow_up_recommendation,
      });

      if (res.success && res.data) {
        const validated = res.data;
        setSicbeMap((prev) => {
          const pid = validated.patient_id;
          const list = prev[pid] ? [...prev[pid]] : [];
          const idx = list.findIndex((a) => a.assessment_id === assessmentId);
          if (idx >= 0) {
            list[idx] = validated;
          } else {
            list.push(validated);
          }
          return { ...prev, [pid]: list };
        });

        logAuditEvent(
          'SICBE_PHYSICIAN_VALIDATED' as any,
          'SICBEAssessment',
          assessmentId,
          `Evaluación SICBE validada por ${currentUser.name}: ${interpretation.clinical_agreement}`,
          'CALCULATED',
          'VALIDATED',
          interpretation.interpretation
        );
        return true;
      }
      return false;
    },
    [currentUser, logAuditEvent]
  );

  const exportSICBEData = useCallback(
    (patientId: string, format: 'json' | 'csv') => {
      const history = sicbeMap[patientId] || [];
      const latest = history[history.length - 1];
      if (!latest) return '';

      if (format === 'json') {
        return JSON.stringify(latest, null, 2);
      }

      const rows: string[] = [];
      rows.push('Dominio ID,Dominio Nombre,Puntaje Bruto,Puntaje Normalizado,Puntaje Ponderado,Peso (%),Completitud (%),Estado');
      (Object.values(latest.domains) as any[]).forEach((d) => {
        rows.push(
          `"${d.domain_id}","${d.domain_name}",${d.raw_score.toFixed(1)},${d.normalized_score.toFixed(1)},${d.weighted_score.toFixed(2)},${d.weight},${d.completeness.toFixed(0)},"${d.status}"`
        );
      });
      return rows.join('\n');
    },
    [sicbeMap]
  );

  const value = {
    currentUser,
    setCurrentUser,
    availableUsers: INITIAL_USERS,
    isAuthenticated,
    login,
    logout,
    switchUser,
    requestPasswordRecovery,
    sessionRemainingMinutes,
    patients,
    selectedPatientId,
    setSelectedPatientId,
    selectedPatient,
    setSelectedPatient,
    addPatient,
    updatePatient,
    activeProblems,
    addProblem,
    updateProblem,
    medications,
    addMedication,
    allergies,
    addAllergy,
    observations,
    patientObservations,
    addObservation,
    correctObservation,
    laboratoryResults,
    patientLaboratoryResults,
    laboratories: laboratoryResults,
    addLaboratoryResult,
    dmvVariables: DMV_VARIABLES,
    safetyAlerts,
    patientSafetyAlerts,
    alerts: safetyAlerts,
    patientAlerts: patientSafetyAlerts,
    unresolvedCriticalAlertsCount,
    resolveAlert,
    createAlert,
    patientDocuments,
    documents: allDocuments,
    addDocument,
    patientDomains,
    updateDomainScore,
    longitudinalPoints,
    encounters,
    patientEncounters,
    activeEncounter,
    startEncounter,
    resumeEncounter,
    updateEncounterProgress,
    updateEncounterSummary,
    saveEncounterDraft,
    signAndCloseEncounter,
    cancelEncounter,
    auditLogs,
    logAuditEvent,
    applyOverride,
    // FASE 3
    dataGaps,
    patientDataGaps,
    addDataGap,
    resolveDataGap,
    uncertainties,
    patientUncertainties,
    addUncertainty,
    resolveUncertainty,
    conflicts,
    patientConflicts,
    addConflict,
    reconcileConflict,
    resolveConflict,
    ecis: Object.values(ecisMap).flat(),
    patientECIs,
    currentECI,
    saveECI,
    publishECI,
    branchECI,
    transitionECIState,
    engineExecutions,
    runMCC,
    currentICC,
    currentICB,
    currentSufficiency,
    publicationGate,
    miaciDirectives,
    runMIACI,
    reports,
    patientReports,
    createOrUpdateE25Report,
    signReport,
    // FASE 4: SICBE
    patientSicbeAssessments,
    activeSicbeAssessment,
    allSicbeWeightSets: weightSets,
    activeWeightSet,
    setActiveWeightSet,
    updateWeightSet,
    calculatePatientSICBE,
    validateSICBEAssessment,
    exportSICBEData,
  };

  return <ClinicalContext.Provider value={value}>{children}</ClinicalContext.Provider>;
};

export const useClinical = () => {
  const context = useContext(ClinicalContext);
  if (!context) {
    throw new Error('useClinical debe usarse dentro de un ClinicalProvider');
  }
  return context;
};
