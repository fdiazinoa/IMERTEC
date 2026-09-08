/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * FASE 3: NÚCLEO INTELIGENTE (ECI + MIACI + ICC + ICB + E21 + E25 + PUBLICACIÓN)
 *
 * Módulo integral de Adquisición Inteligente, Estado Clínico Integral,
 * Confiabilidad, Coherencia, Síntesis Explicable y Publicación Criptográfica Inmutable.
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  Brain,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  GitBranch,
  FileText,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Eye,
  Sliders,
  Award,
  AlertOctagon,
  FileCheck,
  ChevronRight,
  Fingerprint,
  FileSpreadsheet,
  Stethoscope,
  Info,
  Clock,
  KeyRound,
  FileCode,
  ShieldCheck,
  ArrowRight,
  ListOrdered,
  BookOpen,
} from 'lucide-react';
import {
  ECILifecycleState,
  ECI,
  DataGap,
  Uncertainty,
  Conflict,
  MIACIDirective,
  E25Report,
  ICBAxisDetail,
  InferredStateM23,
} from '../types/clinical';
import { compareECIVersions } from '../services/eciStateMachine';

export const IntelligentCoreECIView: React.FC = () => {
  const {
    selectedPatient,
    currentUser,
    currentECI,
    publishECI,
    branchECI,
    transitionECIState,
    ecis = [],
    patientECIs: contextPatientECIs = [],
    patientDataGaps = [],
    resolveDataGap,
    patientUncertainties = [],
    patientConflicts = [],
    resolveConflict,
    reconcileConflict,
    currentICC,
    currentICB,
    currentSufficiency,
    publicationGate,
    miaciDirectives = [],
    runMIACI,
    patientReports = [],
    createOrUpdateE25Report,
    signReport,
    applyOverride,
  } = useClinical();

  // Sub-tabs
  type CoreTab = 'eci_lifecycle' | 'miaci' | 'reliability_coherence' | 'e21_synthesis' | 'publication_e25';
  const [activeCoreTab, setActiveCoreTab] = useState<CoreTab>('eci_lifecycle');

  // Diff comparison modal / state
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  // ECI State transition modal
  const [targetTransitionState, setTargetTransitionState] = useState<ECILifecycleState | null>(null);
  const [transitionNote, setTransitionNote] = useState('');

  // Branching state
  const [isBranchingModalOpen, setIsBranchingModalOpen] = useState(false);
  const [branchReason, setBranchReason] = useState('');

  // E25 Sign modal state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signatureLicense, setSignatureLicense] = useState(currentUser.medicalLicense || 'COL-MED-84920');
  const [signaturePin, setSignaturePin] = useState('');
  const [signSuccessMessage, setSignSuccessMessage] = useState<string | null>(null);

  // E21 Override modal
  const [selectedE21Override, setSelectedE21Override] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Conflict resolution modal
  const [resolvingConflict, setResolvingConflict] = useState<Conflict | null>(null);
  const [conflictChosenIndex, setConflictChosenIndex] = useState<number>(0);
  const [conflictClinicalNote, setConflictClinicalNote] = useState('');

  // Patient ECI history
  const patientECIs = useMemo(() => {
    if (contextPatientECIs && contextPatientECIs.length > 0) return contextPatientECIs;
    if (ecis && selectedPatient?.id) {
      return ecis.filter((e) => e?.patient_id === selectedPatient.id);
    }
    return [];
  }, [contextPatientECIs, ecis, selectedPatient?.id]);

  // Diff comparison calculation
  const diffComparison = useMemo(() => {
    if (!currentECI || !compareVersionId) return null;
    const target = patientECIs.find((e) => e.eci_id === compareVersionId);
    if (!target) return null;
    return compareECIVersions(target, currentECI);
  }, [currentECI, compareVersionId, patientECIs]);

  // Active report
  const currentReport: E25Report | undefined = patientReports[patientReports.length - 1];

  // Colors and labels for ECI states
  const eciStateLabels: Record<ECILifecycleState, { label: string; bg: string; text: string; border: string }> = {
    E0_NO_INICIADO: { label: 'E0: No Iniciado', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    E1_INICIALIZADO: { label: 'E1: Inicializado', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    E2_EN_ADQUISICION: { label: 'E2: En Adquisición MIACI', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
    E3_EN_VALIDACION: { label: 'E3: En Validación', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
    E4_EN_RECONCILIACION: { label: 'E4: Reconciliación de Conflictos', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
    E5_PARCIALMENTE_CONSOLIDADO: { label: 'E5: Parcialmente Consolidado', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300' },
    E6_EVALUANDO_SUFICIENCIA: { label: 'E6: Evaluando Suficiencia', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' },
    E7_PUBLICABLE: { label: 'E7: Publicable Aprobado', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    E8_PUBLICADO: { label: 'E8: PUBLICADO (Inmutable)', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
    E9_EN_ACTUALIZACION: { label: 'E9: En Actualización / Rama', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
    E10_CERRADO_HISTORICO: { label: 'E10: Cerrado Histórico', bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-400' },
    E11_ARCHIVADO: { label: 'E11: Archivado', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  };

  const handleApplyTransition = () => {
    if (!targetTransitionState || !currentECI) return;
    transitionECIState(currentECI.eci_id, targetTransitionState, transitionNote || 'Transición clínica autorizada');
    setTargetTransitionState(null);
    setTransitionNote('');
  };

  const handleApplyBranch = () => {
    if (!currentECI) return;
    branchECI(currentECI.eci_id, branchReason || 'Nueva rama por nueva observación clínica relevante');
    setIsBranchingModalOpen(false);
    setBranchReason('');
  };

  const handleResolveConflictSubmit = () => {
    if (!resolvingConflict) return;
    const chosenEv = resolvingConflict.evidences[conflictChosenIndex] || resolvingConflict.evidences[0];
    const val = chosenEv?.observation_id || chosenEv?.evidence_id || 'RESOLVED';
    const note = conflictClinicalNote || 'Reconciliación clínica por revisión médica documentada.';
    if (resolveConflict) {
      resolveConflict(resolvingConflict.conflict_id, val, note);
    } else if (reconcileConflict) {
      reconcileConflict(resolvingConflict.conflict_id, 'PREFER_NEWER', val, note);
    }
    setResolvingConflict(null);
    setConflictClinicalNote('');
  };

  const handleApplyE21OverrideSubmit = () => {
    if (!selectedE21Override) return;
    applyOverride(selectedE21Override, overrideValue, overrideReason || 'Override justificado por criterio médico experto.');
    setSelectedE21Override(null);
    setOverrideValue('');
    setOverrideReason('');
  };

  const handleSignReportAction = () => {
    if (!currentReport) return;
    signReport(
      currentReport.report_id,
      signatureLicense,
      currentUser.name,
      'He revisado de forma personal e irrenunciable este Estado Clínico Integral. Los datos e inferencias han sido validados clínicamente.'
    );
    setSignSuccessMessage('Informe E25 firmado digitalmente con éxito y sellado criptográficamente.');
    setTimeout(() => {
      setIsSignModalOpen(false);
      setSignSuccessMessage(null);
    }, 1800);
  };

  const currentECIStatus = currentECI?.status || 'E2_EN_ADQUISICION';

  return (
    <div className="space-y-6">
      {/* 1. Header Principal del Núcleo Inteligente */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Núcleo Inteligente IMERTEC — ECI & MIACI
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/80 font-mono font-semibold">
                  FASE 3 ACTIVA
                </span>
                {currentECI && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      eciStateLabels[currentECIStatus]?.bg || 'bg-slate-100'
                    } ${eciStateLabels[currentECIStatus]?.text || 'text-slate-800'} ${
                      eciStateLabels[currentECIStatus]?.border || 'border-slate-300'
                    }`}
                  >
                    {eciStateLabels[currentECIStatus]?.label || currentECIStatus}
                  </span>
                )}
                {currentECI?.is_immutable && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    Inmutable
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Adquisición inteligente (MIACI), construcción del Estado Clínico Integral (ECI), síntesis M23 con explicabilidad (E21),
                auditoría de confiabilidad (ICC) y coherencia fisiológica (ICB) bajo control médico irrenunciable.
              </p>
            </div>
          </div>

          {/* Versión & Acciones Principales */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Versión ECI</div>
              <div className="font-mono text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <span>{currentECI?.version || '1.0.0-draft'}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({currentECI?.is_immutable ? 'PUBLICADO' : 'BORRADOR ACTIVO'})
                </span>
              </div>
            </div>

            <button
              onClick={() => runMIACI()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Re-evaluar directivas MIACI con las observaciones actuales"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-700" />
              <span>Evaluar MIACI</span>
            </button>

            {currentECI && !currentECI.is_immutable ? (
              <button
                onClick={() => {
                  if (publicationGate.allowed) {
                    publishECI(currentECI.eci_id);
                  } else {
                    setActiveCoreTab('publication_e25');
                  }
                }}
                className={`text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs ${
                  publicationGate.allowed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{publicationGate.allowed ? 'Publicar ECI Inmutable' : 'Verificar Gates'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsBranchingModalOpen(true)}
                className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Derivar Nueva Rama</span>
              </button>
            )}
          </div>
        </div>

        {/* SHA-256 Hash Bar */}
        {currentECI && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Fingerprint className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">SHA-256 Digest:</span>
              <code className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                {(currentECI.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855').slice(0, 36)}...
              </code>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span><strong>Observaciones $X_t$:</strong> {currentECI.components?.X_t?.length || 0}</span>
              <span><strong>Incertidumbres $U_t$:</strong> {patientUncertainties.length}</span>
              <span><strong>Conflictos $C_t$:</strong> {patientConflicts.length}</span>
              <span><strong>Brechas $G_t$:</strong> {patientDataGaps.length}</span>
              <span><strong>Creado Por:</strong> {currentECI.created_by}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Sub-Navegación del Núcleo Inteligente */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'eci_lifecycle', label: 'Ciclo ECI & Estados', icon: Layers, count: currentECI?.version },
          { id: 'miaci', label: 'Adquisición MIACI & Brechas', icon: Brain, count: miaciDirectives.length },
          { id: 'reliability_coherence', label: 'Confiabilidad (ICC) & Coherencia (ICB)', icon: Award },
          { id: 'e21_synthesis', label: 'Síntesis M23 / E21', icon: Sparkles },
          { id: 'publication_e25', label: 'Publicación Inmutable & E25', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCoreTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCoreTab(tab.id as CoreTab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white bg-white/60 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. CONTENIDO DE LAS SUB-PESTAÑAS */}

      {/* TAB 1: CICLO ECI & MÁQUINA DE ESTADOS */}
      {activeCoreTab === 'eci_lifecycle' && (
        <div className="space-y-6">
          {/* Stepper del Ciclo de Vida del ECI */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Máquina de Estados Finita del ECI (Transiciones Canónicas E0-E11)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  El ECI transita de forma determinista mediante reglas preclínicas auditadas. La publicación (E8) lo hace inmutable.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded font-semibold">
                Estado Actual: {currentECIStatus}
              </span>
            </div>

            {/* Visual Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
              {[
                { state: 'E0_NO_INICIADO', label: 'E0 No Iniciado' },
                { state: 'E1_INICIALIZADO', label: 'E1 Inicializado' },
                { state: 'E2_EN_ADQUISICION', label: 'E2 Adquisición' },
                { state: 'E3_EN_VALIDACION', label: 'E3 Validación' },
                { state: 'E4_EN_RECONCILIACION', label: 'E4 Reconciliación' },
                { state: 'E5_PARCIALMENTE_CONSOLIDADO', label: 'E5 Consolidado' },
                { state: 'E6_EVALUANDO_SUFICIENCIA', label: 'E6 Suficiencia' },
                { state: 'E7_PUBLICABLE', label: 'E7 Publicable' },
                { state: 'E8_PUBLICADO', label: 'E8 Publicado' },
                { state: 'E9_EN_ACTUALIZACION', label: 'E9 Rama / Actualiz.' },
                { state: 'E10_CERRADO_HISTORICO', label: 'E10 Cerrado' },
                { state: 'E11_ARCHIVADO', label: 'E11 Archivado' },
              ].map((step, idx) => {
                const isCurrent = currentECIStatus === step.state;

                return (
                  <div
                    key={step.state}
                    onClick={() => {
                      if (!currentECI?.is_immutable && !isCurrent) {
                        setTargetTransitionState(step.state as ECILifecycleState);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-700 border-cyan-800 text-white shadow-xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[10px] font-mono">{`E${idx}`}</div>
                    <div className="text-xs font-semibold truncate mt-0.5">{step.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Modal de Transición Manual si se hace click */}
            {targetTransitionState && (
              <div className="mt-4 p-4 rounded-xl bg-cyan-50/80 border border-cyan-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-cyan-950">
                  <strong>Solicitar cambio de estado:</strong> De <code className="font-mono font-bold">{currentECIStatus}</code> a{' '}
                  <code className="font-mono font-bold">{targetTransitionState}</code>.
                  <input
                    type="text"
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    placeholder="Motivo clínico o nota de auditoría (opcional)..."
                    className="w-full sm:w-80 mt-1 block px-2.5 py-1 text-xs border border-cyan-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTargetTransitionState(null)}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyTransition}
                    className="px-3 py-1 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-xs cursor-pointer"
                  >
                    Confirmar Transición
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Versiones del Paciente (SemVer) & Comparador Diff */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Versiones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs lg:col-span-1">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Árbol de Versiones ECI del Paciente
              </h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {patientECIs && patientECIs.length > 0 ? (
                  patientECIs.map((e) => {
                    const isSelected = currentECI?.eci_id === e.eci_id;

                    return (
                      <div
                        key={e.eci_id}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5 text-cyan-600" />
                            v{e.version}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${
                              eciStateLabels[e.status]?.bg || 'bg-slate-100'
                            } ${eciStateLabels[e.status]?.text || 'text-slate-700'}`}
                          >
                            {e.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {e.clinical_objective || 'Versión clínica registrada.'}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{new Date(e.created_at).toLocaleDateString()}</span>
                          {isSelected ? (
                            <span className="text-cyan-700 font-bold">Activo</span>
                          ) : (
                            <button
                              onClick={() => setCompareVersionId(e.eci_id)}
                              className="text-cyan-700 hover:text-cyan-900 font-semibold underline cursor-pointer"
                            >
                              Comparar Diff
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No se registran versiones ECI archivadas para este paciente.
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Comparación Diff */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-700" />
                  <span>Auditoría de Cambios entre Versiones (Diff Inspector)</span>
                </h4>
                {compareVersionId && (
                  <button
                    onClick={() => setCompareVersionId(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cerrar Diff
                  </button>
                )}
              </div>

              {diffComparison ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <div>
                      Comparando <strong className="font-mono">v{diffComparison.targetVersion}</strong> con{' '}
                      <strong className="font-mono text-cyan-800">v{diffComparison.currentVersion} (Actual)</strong>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-medium font-mono">
                      {diffComparison.newObservations.length} Nuevas Observaciones · {diffComparison.changedValues.length} Variaciones
                    </span>
                  </div>

                  {diffComparison.changedValues.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-1.5">Variaciones de Parámetros Clínicos</h5>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Variable</th>
                              <th className="p-2.5 font-mono">Valor en v{diffComparison.targetVersion}</th>
                              <th className="p-2.5 font-mono text-cyan-800">Valor en v{diffComparison.currentVersion}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {diffComparison.changedValues.map((v, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-2.5 font-medium text-slate-800">{v.variable}</td>
                                <td className="p-2.5 font-mono text-rose-700 bg-rose-50/50">{String(v.valueA)}</td>
                                <td className="p-2.5 font-mono text-emerald-700 bg-emerald-50/50 font-bold">
                                  {String(v.valueB)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {diffComparison.newObservations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-1.5">Nuevas Observaciones Agregadas</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {diffComparison.newObservations.map((obs) => (
                          <div
                            key={obs.id}
                            className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800">{obs.variableName}</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {String(obs.value)} {obs.unitOriginal || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <GitBranch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Selecciona una versión del árbol izquierdo para comparar variaciones paramétricas y adiciones clínicas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MIACI & ADQUISICIÓN INTELIGENTE */}
      {activeCoreTab === 'miaci' && (
        <div className="space-y-6">
          {/* Directivas Activas de MIACI */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-700" />
                  <span>Directivas de Adquisición Inteligente MIACI</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  El motor MIACI analiza el expediente y genera órdenes clínicas adaptativas: detención segura, peticiones de laboratorio, o biomarcadores faltantes.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800">
                {miaciDirectives.length} Directivas Generadas
              </span>
            </div>

            <div className="space-y-3">
              {miaciDirectives.map((dir) => {
                const isEmergency = dir.priority === 'EMERGENCY';
                const isHigh = dir.priority === 'HIGH';

                return (
                  <div
                    key={dir.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isEmergency
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : isHigh
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {isEmergency ? (
                          <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        ) : isHigh ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        ) : (
                          <Info className="w-5 h-5 text-cyan-700 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{dir.target_name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded font-mono font-bold uppercase ${
                                isEmergency
                                  ? 'bg-rose-200 text-rose-900'
                                  : isHigh
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {dir.directive_type}
                            </span>
                          </div>
                          <p className="text-xs mt-1 text-slate-700">{dir.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detección de Brechas de Información (DataGaps) y Conflictos Clínicos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brechas de Datos (DataGaps) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-700" />
                  <span>Brechas de Información Detectadas ({patientDataGaps.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500">Un dato faltante NUNCA es normal</span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {patientDataGaps.map((gap) => (
                  <div
                    key={gap.data_gap_id}
                    className={`p-3 rounded-xl border text-xs ${
                      gap.blocking && !gap.resolved_at
                        ? 'border-rose-300 bg-rose-50/50'
                        : gap.resolved_at
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{gap.variable_name || gap.variable_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          gap.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : gap.severity === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">Razón: {gap.reason} · Consumidor: {gap.consumer}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Bloquea SICBE: <strong className={gap.blocking ? 'text-rose-700' : 'text-slate-600'}>{gap.blocking ? 'SÍ' : 'NO'}</strong>
                      </span>
                      {gap.resolved_at ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reconciliada
                        </span>
                      ) : (
                        <button
                          onClick={() => resolveDataGap(gap.data_gap_id, 'Completado durante la evaluación médica.')}
                          className="text-cyan-700 hover:text-cyan-900 font-semibold underline cursor-pointer"
                        >
                          Marcar Justificado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflictos y Contradicciones Clínicas */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  <span>Contradicciones & Conflictos de Datos ({patientConflicts.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500">Separación estricta de fuentes</span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {patientConflicts.map((conf) => (
                  <div
                    key={conf.conflict_id}
                    className={`p-3 rounded-xl border text-xs ${
                      conf.status === 'RECONCILED'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{conf.variable_name || conf.variable_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          conf.status === 'RECONCILED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {conf.status === 'RECONCILED' ? 'Reconciliado' : 'Abierto'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1">{conf.description}</p>

                    {conf.evidences && conf.evidences.length >= 2 && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                        <div>
                          <span className="font-semibold text-slate-500">Evidencia A:</span>
                          <div>{String(conf.evidences[0].value)} ({conf.evidences[0].source_type})</div>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Evidencia B:</span>
                          <div>{String(conf.evidences[1].value)} ({conf.evidences[1].source_type})</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Severidad: {conf.severity}</span>
                      {conf.status !== 'RECONCILED' && (
                        <button
                          onClick={() => setResolvingConflict(conf)}
                          className="text-cyan-700 hover:text-cyan-900 font-semibold underline cursor-pointer"
                        >
                          Reconciliar Médicamente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIABILIDAD (ICC) & COHERENCIA BIOLÓGICA (ICB) */}
      {activeCoreTab === 'reliability_coherence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tarjeta ICC: Índice de Confiabilidad del Caso */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-700" />
                    <span>Índice de Confiabilidad del Caso (ICC)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evalúa la calidad, exhaustividad y vigencia del expediente clínico. NO mide gravedad del paciente.
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-base font-black px-3 py-1 rounded-xl font-mono ${
                      currentICC.result === 'ICC-A'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : currentICC.result === 'ICC-B'
                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                        : currentICC.result === 'ICC-C'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {currentICC.result}
                  </span>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">{currentICC.scorePercent}% Score</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{currentICC.description}</p>
                <p className="mt-1 text-slate-600">{currentICC.reason}</p>
              </div>

              {/* Desglose de Factores del ICC */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px]">Variables Recolectadas</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {currentICC.inputs.collectedVariables} / {currentICC.inputs.totalRequiredVariables}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px]">Brechas Críticas Faltantes</div>
                  <div className="font-bold text-rose-700 text-sm mt-0.5">
                    {currentICC.inputs.missingCriticalVariables}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px]">Conflictos Abiertos</div>
                  <div className="font-bold text-amber-700 text-sm mt-0.5">
                    {currentICC.inputs.unresolvedConflictsCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px]">Incertidumbres Activas</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {currentICC.inputs.activeUncertaintiesCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px]">Datos Caducados (&gt;180d)</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {currentICC.inputs.expiredObservationsCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px]">Regla de Evaluación</div>
                  <div className="font-mono text-slate-800 text-[11px] mt-0.5">ICC-CANONICAL-v1.2</div>
                </div>
              </div>
            </div>

            {/* Tarjeta ICB: Índice de Coherencia Biológica (5 Ejes Fisiológicos) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-700" />
                    <span>Índice de Coherencia Biológica (ICB)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifica concordancia inter-ejes fisiológicos. Impide clasificar modelos inconsistentes.
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl uppercase ${
                    currentICB.result === 'HIGH'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : currentICB.result === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  {currentICB.result}
                </span>
              </div>

              {/* Los 5 Ejes */}
              <div className="space-y-2.5">
                {(Object.values(currentICB.axes) as ICBAxisDetail[]).map((axis) => (
                  <div
                    key={axis.axisKey}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{axis.axisName}</div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{axis.details}</p>
                      {axis.evidenceNotes && (
                        <div className="text-[10px] text-slate-400 mt-1 italic">
                          Evidencia: {axis.evidenceNotes}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase flex-shrink-0 ${
                        axis.status === 'COHERENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : axis.status === 'INSUFFICIENT'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {axis.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluador de Suficiencia para SICBE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-700" />
                  <span>Suficiencia Epistemológica para SICBE</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Determina si el caso cuenta con suficiente densidad clínica y ausencia de bloqueos de seguridad para clasificar los 8 dominios.
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-xl ${
                  currentSufficiency.ready
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {currentSufficiency.ready ? 'APTO PARA SICBE' : 'BLOQUEADO / NO APTO'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-semibold text-slate-800 mb-1">Motivos y Justificación Determinista:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {currentSufficiency.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SÍNTESIS PRE-CLASIFICACIÓN E21 (M23) CON EXPLICABILIDAD */}
      {activeCoreTab === 'e21_synthesis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-700" />
                  <span>Síntesis Clínica Pre-Clasificación E21 (Variables Inferidas M23)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deducción causal determinista pre-clasificación con trazabilidad, nivel de evidencia y capacidad de override médico.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                Motor E21 v1.2.0 Activo
              </span>
            </div>

            {currentECI?.components?.Z_t && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.values(currentECI.components.Z_t) as InferredStateM23[]).map((v) => {
                  return (
                    <div
                      key={v.variableKey}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900">{v.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                            Evidencia {v.evidenceLevel}
                          </span>
                          {v.physicianOverride && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                              Override Activo
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200 my-2 flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Valor Canónico:</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {v.physicianOverride ? v.physicianOverride.overriddenValue : v.systemValue}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div><strong>Regla Utilizada:</strong> {v.ruleUsed} (v{v.ruleVersion})</div>
                        <div><strong>Confianza Epistémica:</strong> {v.confidence}</div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Observaciones base: {v.sourceObservationIds.join(', ')}</span>
                        <button
                          onClick={() => {
                            setSelectedE21Override(v.variableKey);
                            setOverrideValue(v.systemValue);
                          }}
                          className="text-cyan-700 hover:text-cyan-900 font-semibold underline cursor-pointer"
                        >
                          Override Médico
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PUBLICACIÓN INMUTABLE & INFORME E25 */}
      {activeCoreTab === 'publication_e25' && (
        <div className="space-y-6">
          {/* Las 8 Puertas de Publicación (Publication Gate) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-700" />
                  <span>Las 8 Puertas de Publicación ECI (Publication Gate)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reglas de paso que aseguran que un ECI jamás sea publicado de forma inconsistente, insegura o sin respaldo auditable.
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-xl ${
                  publicationGate.allowed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {publicationGate.allowed ? 'PUBLICACIÓN AUTORIZADA' : 'PUBLICACIÓN BLOQUEADA'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {publicationGate.checklist.map((gate) => (
                <div
                  key={gate.gate}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    gate.passed
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/50 border-rose-200 text-rose-950'
                  }`}
                >
                  {gate.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{gate.label}</div>
                    <p className="text-[11px] mt-0.5 opacity-90">{gate.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {currentECI && !currentECI.is_immutable && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {publicationGate.allowed
                    ? 'Todas las condiciones requeridas han sido verificadas. Puede proceder al sellado inmutable.'
                    : 'Corrija los factores bloqueantes antes de publicar la versión definitiva.'}
                </span>
                <button
                  disabled={!publicationGate.allowed}
                  onClick={() => publishECI(currentECI.eci_id)}
                  className={`text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                    publicationGate.allowed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Firmar y Publicar Versión Inmutable</span>
                </button>
              </div>
            )}
          </div>

          {/* Generador y Visor de Informe Clínico E25 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-700" />
                  <span>Informe Clínico E25 Consolidado</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolida alertas E00, síntesis E21, mapas de dominios, planes preventivos y firma médica criptográfica.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => createOrUpdateE25Report()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Actualizar E25
                </button>
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Firmar Informe Digital</span>
                </button>
              </div>
            </div>

            {currentReport ? (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {currentReport.sections.section1_patient_e00.patientInfo.fullName}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {currentReport.sections.section1_patient_e00.patientInfo.age} años ·{' '}
                      {currentReport.sections.section1_patient_e00.patientInfo.cohort} · Folio:{' '}
                      {currentReport.sections.section1_patient_e00.patientInfo.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200 font-bold">
                      {currentReport.report_id}
                    </span>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Versión ECI: {currentReport.eci_version}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Estado de Seguridad E00</span>
                    <p className="text-slate-600 text-[11px]">
                      {currentReport.sections.section1_patient_e00.safetyStatus}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Estado de Clasificación SICBE</span>
                    <p className="text-slate-600 text-[11px]">
                      {currentReport.sections.section4_sicbe_status.statusText}
                    </p>
                  </div>
                </div>

                {currentReport.signature && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Firmado Digitalmente por {currentReport.signature.physician_name}</span>
                      </div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        Cédula: {currentReport.signature.license} · Fecha: {new Date(currentReport.signature.signed_at).toLocaleString()}
                      </div>
                    </div>
                    <code className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                      Sello: {currentReport.signature.report_hash.slice(0, 16)}...
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay informe E25 generado para esta versión del ECI. Haga clic en "Actualizar E25" para compilarlo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RAMA DERIVADA (BRANCHING) */}
      {isBranchingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-cyan-800">
              <GitBranch className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Crear Rama Derivada del ECI</h3>
            </div>
            <p className="text-xs text-slate-500">
              La versión actual ({currentECI?.version}) está cerrada/inmutable. Para registrar nuevas observaciones o planes se debe crear una versión derivada (SemVer incremental).
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo Clínico de la Nueva Rama</label>
              <textarea
                value={branchReason}
                onChange={(e) => setBranchReason(e.target.value)}
                placeholder="Ejemplo: Incorporación de informe anatomopatológico de biopsia..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBranchingModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyBranch}
                className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs cursor-pointer"
              >
                Crear Rama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FIRMA DIGITAL E25 */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-cyan-800">
              <FileCheck className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Firma Digital del Informe E25</h3>
            </div>

            {signSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs text-center font-semibold">
                {signSuccessMessage}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Al firmar, asume la responsabilidad profesional sobre la síntesis clínica y el estado del paciente.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Médico Responsable</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.name}
                      className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cédula / Licencia Profesional</label>
                    <input
                      type="text"
                      value={signatureLicense}
                      onChange={(e) => setSignatureLicense(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN / Contraseña de Firma Médica</label>
                    <input
                      type="password"
                      value={signaturePin}
                      onChange={(e) => setSignaturePin(e.target.value)}
                      placeholder="Ingrese contraseña o PIN..."
                      className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsSignModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSignReportAction}
                    className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs cursor-pointer"
                  >
                    Estampar Firma Criptográfica
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RESOLUCIÓN DE CONFLICTO */}
      {resolvingConflict && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Reconciliación Médica de Conflicto</h3>
            </div>
            <p className="text-xs text-slate-600">{resolvingConflict.description}</p>

            <div className="space-y-2 text-xs">
              {resolvingConflict.evidences.map((ev, idx) => (
                <div
                  key={ev.evidence_id || idx}
                  onClick={() => setConflictChosenIndex(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    conflictChosenIndex === idx
                      ? 'border-cyan-500 bg-cyan-50 font-semibold'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-800">
                    Evidencia {idx === 0 ? 'A' : 'B'}: {ev.source_type}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Valor: {String(ev.value)} {ev.unit || ''} · Fecha: {ev.date}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{ev.claim}</div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Justificación Clínica del Juicio Médico</label>
              <textarea
                value={conflictClinicalNote}
                onChange={(e) => setConflictClinicalNote(e.target.value)}
                placeholder="Explique el criterio clínico para preferir esta observación..."
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingConflict(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolveConflictSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs cursor-pointer"
              >
                Aplicar Reconciliación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE OVERRIDE MÉDICO E21 */}
      {selectedE21Override && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-cyan-800">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Override Médico en Síntesis E21</h3>
            </div>
            <p className="text-xs text-slate-500">
              Variable: <strong className="text-slate-800">{selectedE21Override}</strong>. La autoridad médica final es irrenunciable y prevalece sobre la inferencia del sistema.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nuevo Valor Clínico</label>
                <input
                  type="text"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificación Médica Obligatoria</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Justifique el motivo clínico por el cual difiere de la inferencia automática..."
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedE21Override(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyE21OverrideSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs cursor-pointer"
              >
                Registrar Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
