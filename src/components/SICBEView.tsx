/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Clasificador Biológico del Envejecimiento (SICBE Engine v1.0 / FASE 4)
 * Conforme a Documento 6 Borrador 1 / IMERTEC-ECO-001 Edición 2.2
 *
 * 8 Dominios Biológicos | 65 Biomarcadores Canónicos | SGEB-C / SGEB-E
 * Reglas de Clasificación PD-001 a PD-006 | Abstención Segura PD-005
 * Trazabilidad Longitudinal | Comparabilidad | Simulación Sensibilidad
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  Dna,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Scale,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Filter,
  Check,
  FileText,
  Download,
  Eye,
  Activity,
  AlertCircle,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronRight,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import {
  DomainId,
  SICBEState,
  DomainStatus,
  PhysicianSICBEInterpretation,
  DomainAssessment,
  EvaluatedBiomarker,
} from '../types/clinical';
import {
  SICBE_DOMAINS_METADATA,
  SICBE_65_BIOMARKERS,
  DEFAULT_DOMAIN_WEIGHT_SET,
} from '../data/sicbeBiomarkersData';
import { evaluateAssessmentComparability } from '../services/sicbeEngine';

interface SICBEViewProps {
  onOpenTestSuite?: () => void;
}

export const SICBEView: React.FC<SICBEViewProps> = ({ onOpenTestSuite }) => {
  const {
    selectedPatient,
    activeSicbeAssessment,
    patientSicbeAssessments,
    calculatePatientSICBE,
    validateSICBEAssessment,
    exportSICBEData,
    currentUser,
  } = useClinical();

  // Sub-tabs de navegación
  const [activeTab, setActiveTab] = useState<
    'domains' | 'biomarkers' | 'rules' | 'longitudinal' | 'simulation' | 'validation'
  >('domains');

  // Estado para filtros de biomarcadores
  const [bioSearch, setBioSearch] = useState('');
  const [bioDomainFilter, setBioDomainFilter] = useState<DomainId | 'ALL'>('ALL');
  const [bioLevelFilter, setBioLevelFilter] = useState<'ALL' | 'ESSENTIAL' | 'EXTENDED'>('ALL');
  const [selectedBioModal, setSelectedBioModal] = useState<any | null>(null);

  // Dominio seleccionado para ver detalle
  const [expandedDomainId, setExpandedDomainId] = useState<DomainId | null>('D-VI');

  // Estado del simulador "What-If"
  const [simIl6, setSimIl6] = useState<number>(3.5);
  const [simDynamometry, setSimDynamometry] = useState<number>(30);
  const [simGaitSpeed, setSimGaitSpeed] = useState<number>(1.0);
  const [simCrp, setSimCrp] = useState<number>(2.0);
  const [simPwv, setSimPwv] = useState<number>(8.5);
  const [simDunedin, setSimDunedin] = useState<number>(0.98);
  const [simEssentialOnly, setSimEssentialOnly] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Formulario de Validación Médica
  const [valInterpretation, setValInterpretation] = useState<string>(
    activeSicbeAssessment?.physician_interpretation?.interpretation || ''
  );
  const [valAgreement, setValAgreement] = useState<'CONCUR' | 'RESERVATIONS' | 'DISAGREE'>(
    activeSicbeAssessment?.physician_interpretation?.clinical_agreement || 'CONCUR'
  );
  const [valRecommendation, setValRecommendation] = useState<string>(
    activeSicbeAssessment?.physician_interpretation?.follow_up_recommendation ||
      'Control analítico y re-evaluación funcional en 6 meses.'
  );
  const [valSavedMessage, setValSavedMessage] = useState<string | null>(null);

  // Colores por Estado Biológico
  const stateColors: Record<SICBEState, { bg: string; text: string; border: string; label: string }> = {
    ESTADO_I: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      label: 'Estado I: Envejecimiento Biológico Óptimo',
    },
    ESTADO_II: {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
      label: 'Estado II: Senescencia Leve / Compensada',
    },
    ESTADO_III: {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      label: 'Estado III: Carga Moderada de Senescencia',
    },
    ESTADO_IV: {
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-300',
      label: 'Estado IV: Daño Biológico Avanzado',
    },
    ESTADO_V: {
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      border: 'border-rose-300',
      label: 'Estado V: Colapso Homeostático / Terminal',
    },
    NO_CLASIFICABLE: {
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-400',
      label: 'No Clasificable (Abstención Segura)',
    },
  };

  // Colores por Estado de Dominio
  const domainStatusColors: Record<DomainStatus, { bg: string; text: string; border: string }> = {
    PRESERVADO_EXCEPCIONAL: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    OPTIMO: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    PRESERVADO: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    VIGILANCIA: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    COMPROMETIDO: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    ALARMA_ACTIVA: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    SIN_DATOS: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  // Auto-cálculo de SICBE si el paciente no cuenta con evaluación previa
  React.useEffect(() => {
    if (!activeSicbeAssessment && selectedPatient?.id) {
      calculatePatientSICBE(selectedPatient.id);
    }
  }, [selectedPatient?.id, activeSicbeAssessment, calculatePatientSICBE]);

  // Manejo de cálculo en vivo
  const handleRunCalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      calculatePatientSICBE(selectedPatient.id);
      setIsCalculating(false);
    }, 300);
  };

  // Manejo de validación médica
  const handleSaveValidation = async () => {
    if (!activeSicbeAssessment) return;
    const interp: PhysicianSICBEInterpretation = {
      interpretation: valInterpretation,
      clinical_agreement: valAgreement,
      relevant_domains: ['D-VI', 'D-VII'],
      priority_findings: ['Fuerza de prensión manual', 'Inflammaging IL-6'],
      limitations: activeSicbeAssessment.limitations,
      follow_up_recommendation: valRecommendation,
      physician_id: currentUser.id,
      physician_name: currentUser.name,
      license_number: currentUser.licenseNumber || 'Exeq. 89412-MED',
      timestamp: new Date().toISOString(),
    };

    const ok = await validateSICBEAssessment(activeSicbeAssessment.assessment_id, interp);
    if (ok) {
      setValSavedMessage('Validación médica sellada e incorporada a la auditoría inmutable.');
      setTimeout(() => setValSavedMessage(null), 4000);
    }
  };

  // Exportar datos
  const handleExport = (format: 'json' | 'csv') => {
    const data = exportSICBEData(selectedPatient.id, format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SICBE_${selectedPatient.id}_${activeSicbeAssessment?.visit_milestone || 'V0'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cálculo simulado rápido para pestaña What-If
  const simulatedScore = useMemo(() => {
    if (!activeSicbeAssessment) return null;
    const baseSgeb = activeSicbeAssessment.sgeb || 40;
    // Efecto de cambios en biomarcadores simulados
    const deltaIl6 = (simIl6 - 3.5) * 1.2;
    const deltaDyn = (30 - simDynamometry) * 0.8;
    const deltaGait = (1.0 - simGaitSpeed) * 8;
    const deltaCrp = (simCrp - 2.0) * 1.5;
    const deltaPwv = (simPwv - 8.5) * 1.4;

    const rawPredicted = baseSgeb + deltaIl6 + deltaDyn + deltaGait + deltaCrp + deltaPwv;
    const predictedSgeb = Math.max(5, Math.min(95, Number(rawPredicted.toFixed(1))));

    let predictedState: SICBEState = 'ESTADO_II';
    if (predictedSgeb < 35) predictedState = 'ESTADO_I';
    else if (predictedSgeb < 45) predictedState = 'ESTADO_II';
    else if (predictedSgeb < 60) predictedState = 'ESTADO_III';
    else if (predictedSgeb < 75) predictedState = 'ESTADO_IV';
    else predictedState = 'ESTADO_V';

    return {
      predictedSgeb,
      predictedState,
      delta: Number((predictedSgeb - baseSgeb).toFixed(1)),
    };
  }, [activeSicbeAssessment, simIl6, simDynamometry, simGaitSpeed, simCrp, simPwv]);

  // Filtrado de biomarcadores
  const filteredBiomarkers = useMemo(() => {
    return SICBE_65_BIOMARKERS.filter((bio) => {
      const matchSearch =
        bioSearch === '' ||
        bio.name.toLowerCase().includes(bioSearch.toLowerCase()) ||
        bio.code.toLowerCase().includes(bioSearch.toLowerCase()) ||
        bio.variable_id.toLowerCase().includes(bioSearch.toLowerCase());
      const matchDomain = bioDomainFilter === 'ALL' || bio.domain_id === bioDomainFilter;
      const matchLevel = bioLevelFilter === 'ALL' || bio.analysis_level === bioLevelFilter;
      return matchSearch && matchDomain && matchLevel;
    });
  }, [bioSearch, bioDomainFilter, bioLevelFilter]);

  // Comparabilidad con la evaluación anterior
  const comparability = useMemo(() => {
    if (patientSicbeAssessments.length < 2) return null;
    const prev = patientSicbeAssessments[patientSicbeAssessments.length - 2];
    const curr = patientSicbeAssessments[patientSicbeAssessments.length - 1];
    return evaluateAssessmentComparability(prev, curr);
  }, [patientSicbeAssessments]);

  // Si no hay evaluación calculada, mostrar estado inicial o calcular
  const assessment = activeSicbeAssessment;

  return (
    <div className="space-y-6">
      {/* 1. Encabezado Ejecutivo y Botonera Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Dna className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Clasificador Biológico del Envejecimiento (SICBE)
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold font-mono">
                  v1.0 Oficial
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  8 Dominios / 65 Biomarcadores
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Paciente: <strong className="text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.id}) • Expediente: {selectedPatient.medicalRecordNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Botonera de Acciones Rápidas */}
        <div className="flex items-center flex-wrap gap-2">
          {onOpenTestSuite && (
            <button
              onClick={onOpenTestSuite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Abrir Suite de Pruebas Clínicas Automatizadas (QA) y validar motor SICBE"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suite QA</span>
            </button>
          )}

          <button
            onClick={handleRunCalculation}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>{isCalculating ? 'Calculando...' : 'Recalcular SICBE'}</span>
          </button>

          <button
            onClick={() => setActiveTab('validation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Validar Informe</span>
          </button>

          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden text-xs">
            <button
              onClick={() => handleExport('json')}
              title="Exportar JSON FHIR"
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium border-r border-slate-200 cursor-pointer"
            >
              JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              title="Exportar CSV de Dominios"
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Banner de Abstención Ontológica Segura (PD-005) si aplica */}
      {assessment?.is_blocked_or_abstained && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  ABSTENCIÓN CLÍNICA SEGURA ACTIVA — REGLA PD-005
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold">
                  Bloqueo Preventivo Ontológico
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1.5 leading-relaxed">
                {assessment.abstention_reason ||
                  'Por principio ontológico y seguridad clínica, ante la presencia de un proceso oncológico activo o una alarma crítica vital no resuelta, el instrumento SICBE suspende la asignación formal de un Estado Biológico I a V. Los dominios biológicos se muestran exclusivamente con fines informativos y de vigilancia fisiológica.'}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-950">
                <span className="bg-white/80 border border-amber-300/80 px-2.5 py-1 rounded-lg">
                  Estado Registrado: NO_CLASIFICABLE
                </span>
                <span className="bg-white/80 border border-amber-300/80 px-2.5 py-1 rounded-lg">
                  SGEB Formal: Suspendido
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dictamen de Estado y Métricas Ejecutivas */}
      {assessment && (
        <div
          className={`rounded-2xl border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
            assessment.is_blocked_or_abstained
              ? 'bg-amber-50/20 border-amber-200'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Estado Biológico */}
            <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-slate-200/70 pb-4 md:pb-0 md:pr-4">
              <span className="text-xs font-medium text-slate-500 block">
                Dictamen Oficial de Estado Biológico
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`text-lg font-bold px-3 py-1 rounded-xl border ${
                    stateColors[assessment.state]?.bg || 'bg-slate-100'
                  } ${stateColors[assessment.state]?.text || 'text-slate-900'} ${
                    stateColors[assessment.state]?.border || 'border-slate-300'
                  }`}
                >
                  {stateColors[assessment.state]?.label || assessment.state}
                </span>
              </div>

              {/* Discordancia PD-006 */}
              {assessment.is_discordant && (
                <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Regla PD-006 (Resolución de Discordancia):</strong> SGEB ({assessment.state_by_sgeb}) difiere del perfil de dominios ({assessment.state_by_profile}). Se asigna conservadoramente el estado más desfavorable ({assessment.state}).
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-2">
                {assessment.explanation?.sgeb_summary}
              </p>
            </div>

            {/* Puntaje SGEB */}
            <div className="border-b md:border-b-0 md:border-r border-slate-200/70 pb-4 md:pb-0 md:pr-4">
              <span className="text-xs font-medium text-slate-500 block">
                Puntaje SGEB Global
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {assessment.is_blocked_or_abstained ? '—' : assessment.sgeb.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 100</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold font-mono">
                  {assessment.sgeb_type}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {assessment.sgeb_type === 'SGEB-C'
                  ? 'Panel Completo (>=70% completitud)'
                  : 'Panel Esencial (mínimo operativo)'}
              </span>
            </div>

            {/* Calidad & Versión */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-500 font-medium block">Parámetros Epistémicos</span>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Completitud:</span>
                <span className="font-bold text-slate-800">{assessment.completeness_pct}%</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Confianza:</span>
                <span className="font-bold text-slate-800">{assessment.confidence}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Hito Temporal:</span>
                <span className="font-mono text-cyan-800 font-bold">{assessment.visit_milestone || 'V0'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Versión Pesos:</span>
                <span className="font-mono text-slate-700">{assessment.domain_weight_version}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Selector de Pestañas de Trabajo */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
            activeTab === 'domains'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-700" />
          <span>8 Dominios Biológicos</span>
        </button>

        <button
          onClick={() => setActiveTab('biomarkers')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
            activeTab === 'biomarkers'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Dna className="w-3.5 h-3.5 text-cyan-700" />
          <span>Catálogo de 65 Biomarcadores</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
            activeTab === 'rules'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-slate-600" />
          <span>Reglas Clínicas PD-001 a PD-006</span>
        </button>

        <button
          onClick={() => setActiveTab('longitudinal')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
            activeTab === 'longitudinal'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-600" />
          <span>Trayectoria & Comparabilidad</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
            activeTab === 'simulation'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-slate-600" />
          <span>Simulador "What-If"</span>
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
            activeTab === 'validation'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Dictamen Médico</span>
        </button>
      </div>

      {/* Fallback si no hay evaluación aún */}
      {!assessment && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
          <div className="p-3 bg-cyan-50 text-cyan-700 rounded-2xl w-fit mx-auto">
            <Dna className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Generando Evaluación SICBE
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Evaluando suficiencia epistémica, normalizando los 65 biomarcadores y calculando el SGEB para {selectedPatient.firstName} {selectedPatient.lastName}...
          </p>
          <button
            onClick={handleRunCalculation}
            disabled={isCalculating}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {isCalculating ? 'Calculando...' : 'Calcular Evaluación Ahora'}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. CONTENIDO DE PESTAÑA 1: 8 DOMINIOS BIOLÓGICOS              */}
      {/* ============================================================== */}
      {activeTab === 'domains' && assessment && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(assessment.domains) as DomainId[]).map((dId) => {
              const dom = assessment.domains[dId];
              const meta = SICBE_DOMAINS_METADATA[dId];
              const isExpanded = expandedDomainId === dId;
              const statusCfg = domainStatusColors[dom.status] || domainStatusColors.PRESERVADO;

              return (
                <div
                  key={dId}
                  className={`bg-white rounded-2xl border transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between ${
                    isExpanded ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Encabezado Dominio */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
                          {dId} • {dom.weight}%
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                          {meta?.name || dom.domain_name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {dom.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Scores del Dominio */}
                    <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50/70 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Puntaje 0–100</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {dom.normalized_score.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Aporte Ponderado</span>
                        <span className="text-base font-extrabold text-cyan-800">
                          {dom.weighted_score.toFixed(2)} pts
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso de daño */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                        <span>Carga biológica</span>
                        <span>{dom.normalized_score.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            dom.normalized_score > 60
                              ? 'bg-rose-500'
                              : dom.normalized_score > 40
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, dom.normalized_score))}%` }}
                        />
                      </div>
                    </div>

                    {/* Hallazgos dominantes */}
                    {dom.dominant_findings.length > 0 && (
                      <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                        {dom.dominant_findings[0]}
                      </p>
                    )}
                  </div>

                  {/* Botón expandir detalle */}
                  <button
                    onClick={() => setExpandedDomainId(isExpanded ? null : dId)}
                    className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center justify-between w-full cursor-pointer"
                  >
                    <span>{isExpanded ? 'Ocultar biomarcadores' : 'Ver biomarcadores'}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Detalle del dominio expandido */}
          {expandedDomainId && assessment.domains[expandedDomainId] && (
            <div className="bg-white rounded-2xl border border-cyan-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800 font-bold font-mono text-xs">
                    {expandedDomainId}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Biomarcadores Evaluados — {SICBE_DOMAINS_METADATA[expandedDomainId]?.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {SICBE_DOMAINS_METADATA[expandedDomainId]?.biological_concept}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400">Puntaje Normalizado: </span>
                  <strong className="text-slate-800 font-bold">
                    {assessment.domains[expandedDomainId].normalized_score.toFixed(1)} / 100
                  </strong>
                </div>
              </div>

              {/* Tabla de biomarcadores disponibles */}
              {assessment.domains[expandedDomainId].available_biomarkers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                        <th className="py-2.5 px-3 font-semibold">Código</th>
                        <th className="py-2.5 px-3 font-semibold">Biomarcador</th>
                        <th className="py-2.5 px-3 font-semibold">Nivel</th>
                        <th className="py-2.5 px-3 font-semibold">Valor Medido</th>
                        <th className="py-2.5 px-3 font-semibold">Puntaje Normalizado (0-100)</th>
                        <th className="py-2.5 px-3 font-semibold">Estado</th>
                        <th className="py-2.5 px-3 font-semibold">Método / Validez</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assessment.domains[expandedDomainId].available_biomarkers.map((bio) => (
                        <tr key={bio.biomarker_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{bio.code}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{bio.name}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                              {bio.analysis_level}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {typeof bio.value === 'number' ? bio.value.toFixed(2) : bio.value} {bio.unit}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    bio.normalized_value > 60
                                      ? 'bg-rose-500'
                                      : bio.normalized_value > 40
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${bio.normalized_value}%` }}
                                />
                              </div>
                              <span className="font-mono text-slate-700 font-semibold">
                                {bio.normalized_value.toFixed(1)}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                bio.status === 'NORMAL'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : bio.status === 'BORDERLINE'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {bio.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{bio.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  Sin biomarcadores analíticos directos en este corte temporal. Se utiliza score sintético consolidado de dominio ({assessment.domains[expandedDomainId].normalized_score.toFixed(1)}).
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. CONTENIDO DE PESTAÑA 2: CATÁLOGO 65 BIOMARCADORES          */}
      {/* ============================================================== */}
      {activeTab === 'biomarkers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Catálogo Canónico de 65 Biomarcadores del Envejecimiento
              </h3>
              <p className="text-xs text-slate-500">
                Definiciones matemáticas, periodos de validez, rangos fisiológicos y dirección patológica
              </p>
            </div>

            {/* Controles de Búsqueda y Filtros */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar biomarcador o código..."
                  value={bioSearch}
                  onChange={(e) => setBioSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-56 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <select
                value={bioDomainFilter}
                onChange={(e) => setBioDomainFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Dominios (8)</option>
                {Object.keys(SICBE_DOMAINS_METADATA).map((dId) => (
                  <option key={dId} value={dId}>
                    {dId}: {SICBE_DOMAINS_METADATA[dId as DomainId].name}
                  </option>
                ))}
              </select>

              <select
                value={bioLevelFilter}
                onChange={(e) => setBioLevelFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Niveles</option>
                <option value="ESSENTIAL">Esencial (29 biomarcadores)</option>
                <option value="EXTENDED">Extendido (36 biomarcadores)</option>
              </select>
            </div>
          </div>

          {/* Tabla Exhaustiva */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Código</th>
                  <th className="py-2.5 px-3 font-semibold">Nombre del Biomarcador</th>
                  <th className="py-2.5 px-3 font-semibold">Dominio</th>
                  <th className="py-2.5 px-3 font-semibold">Nivel</th>
                  <th className="py-2.5 px-3 font-semibold">Unidad</th>
                  <th className="py-2.5 px-3 font-semibold">Dirección</th>
                  <th className="py-2.5 px-3 font-semibold">Validez</th>
                  <th className="py-2.5 px-3 font-semibold">Rango Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBiomarkers.map((b) => (
                  <tr
                    key={b.biomarker_id}
                    onClick={() => setSelectedBioModal(b)}
                    className="hover:bg-cyan-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{b.code}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{b.name}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                        {b.domain_id}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          b.analysis_level === 'ESSENTIAL'
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.analysis_level}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{b.unit}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {b.direction === 'HIGHER_WORSE'
                          ? '↑ Mayor peor'
                          : b.direction === 'LOWER_WORSE'
                          ? '↓ Menor peor'
                          : '↔ Bidireccional'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{b.validity_period_days} días</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                      {b.reference_low !== undefined && b.reference_high !== undefined
                        ? `${b.reference_low} – ${b.reference_high}`
                        : b.cutoff_worst !== undefined
                        ? `Límite: ${b.cutoff_worst}`
                        : 'Ver ficha'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ficha Biomarcador */}
      {selectedBioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-md">
                  {selectedBioModal.code} • {selectedBioModal.domain_id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {selectedBioModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBioModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed text-slate-600">
                <strong>Justificación Biológica:</strong> {selectedBioModal.rationale}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Método Analítico</span>
                  <span className="font-semibold text-slate-800">{selectedBioModal.method}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Periodo de Validez</span>
                  <span className="font-semibold text-slate-800">{selectedBioModal.validity_period_days} días</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Unidad UCUM</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedBioModal.unit}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Nivel de Análisis</span>
                  <span className="font-semibold text-cyan-800">{selectedBioModal.analysis_level}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBioModal(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. CONTENIDO DE PESTAÑA 3: REGLAS CLÍNICAS PD-001 A PD-006     */}
      {/* ============================================================== */}
      {activeTab === 'rules' && assessment && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Traza de Decisión: Reglas Clínicas de Clasificación PD-001 a PD-006
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocolo determinista para arbitraje de fenotipos extremos, discordancia y seguridad oncológica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'PD-001',
                title: 'Reserva Funcional Motora / Sarcopenia Severa (D-VII)',
                desc: 'Si D-VII presenta estado COMPROMETIDO o ALARMA_ACTIVA, el paciente no puede clasificarse en Estado I o II independientemente del SGEB.',
                applied: assessment.classification_rules_applied.find((r) => r.rule_id === 'PD-001'),
              },
              {
                id: 'PD-002',
                title: 'SASP Severo e Inmunosenescencia Descontrolada (D-VI)',
                desc: 'Si D-VI está en ALARMA_ACTIVA o raw_score >= 80, bloquea la asignación de Estado I y obliga a revisión de Estado III o IV.',
                applied: assessment.classification_rules_applied.find((r) => r.rule_id === 'PD-002'),
              },
              {
                id: 'PD-003',
                title: 'Carga Multidominio Difusa',
                desc: 'Si >= 5 dominios están en estado COMPROMETIDO o ALARMA_ACTIVA, fuerza Estado IV o V.',
                applied: assessment.classification_rules_applied.find((r) => r.rule_id === 'PD-003'),
              },
              {
                id: 'PD-004',
                title: 'Reserva Motora Robusta con Inflamación Aislada',
                desc: 'Si D-VII es PRESERVADO y sólo 1 dominio presenta alteración, modula conservadoramente hacia Estado II o III.',
                applied: assessment.classification_rules_applied.find((r) => r.rule_id === 'PD-004'),
              },
              {
                id: 'PD-005',
                title: 'Abstención Oncológica o Emergencia Vital E00',
                desc: 'Proceso oncológico activo o alarma crítica E00 no resuelta suspende formalmente la asignación de Estado I–V (NO_CLASIFICABLE).',
                applied: assessment.classification_rules_applied.find((r) => r.rule_id === 'PD-005'),
              },
              {
                id: 'PD-006',
                title: 'Resolución Conservadora de Discordancia',
                desc: 'Cuando el estado calculado por SGEB difiere del estado por Perfil de Dominios, prevalece el estado de mayor severidad clínica.',
                applied: assessment.classification_rules_applied.find((r) => r.rule_id === 'PD-006'),
              },
            ].map((rule) => {
              const record = rule.applied;
              const isTriggered = record?.triggered;

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTriggered
                      ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isTriggered ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {rule.id}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5">{rule.title}</h4>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isTriggered ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isTriggered ? 'ACTIVADA' : 'NO ACTIVADA'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{rule.desc}</p>

                  {record && (
                    <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200/80 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Resultado:</span>
                        <strong className="text-slate-800">{record.result}</strong>
                      </div>
                      <p className="text-slate-600 italic mt-0.5">{record.reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. CONTENIDO DE PESTAÑA 4: TRAYECTORIA Y COMPARABILIDAD       */}
      {/* ============================================================== */}
      {activeTab === 'longitudinal' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Trayectoria Longitudinal & Garantía de Comparabilidad SICBE
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seguimiento evolutivo de hitos temporales (V0, V1, V2...) con verificación de consistencia analítica
            </p>
          </div>

          {/* Banner de Comparabilidad */}
          {comparability && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                comparability.status === 'FULLY_COMPARABLE'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : comparability.status === 'PARTIALLY_COMPARABLE'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Evaluación de Comparabilidad:{' '}
                  {comparability.status === 'FULLY_COMPARABLE'
                    ? 'PLENAMENTE COMPARABLE'
                    : comparability.status === 'PARTIALLY_COMPARABLE'
                    ? 'PARCIALMENTE COMPARABLE'
                    : 'NO COMPARABLE DIRECTAMENTE'}
                </span>
              </div>
              {comparability.comparability_notes.map((n, i) => (
                <p key={i} className="mt-1">
                  • {n}
                </p>
              ))}
              {comparability.is_data_coverage_change && (
                <p className="mt-2 font-semibold">
                  Alerta Médica: La variación en cobertura ({comparability.coverage_delta}%) puede explicar diferencias en el score SGEB independientemente de la respuesta biológica.
                </p>
              )}
            </div>
          )}

          {/* Historial de Evaluaciones */}
          <div className="space-y-3">
            {patientSicbeAssessments.map((a, idx) => (
              <div
                key={a.assessment_id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-800 bg-cyan-100/70 px-2 py-0.5 rounded-md">
                      {a.visit_milestone || `Hito #${idx + 1}`}
                    </span>
                    <span className="font-bold text-slate-900">
                      {stateColors[a.state]?.label || a.state}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{a.created_at.slice(0, 10)}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{a.explanation?.sgeb_summary}</p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">SGEB</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {a.is_blocked_or_abstained ? '—' : a.sgeb.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Cobertura</span>
                    <span className="font-bold text-slate-800">{a.completeness_pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. CONTENIDO DE PESTAÑA 5: SIMULADOR "WHAT-IF"                */}
      {/* ============================================================== */}
      {activeTab === 'simulation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Simulador de Sensibilidad e Intervención Biológica ("What-If")
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proyecte el impacto en SGEB y Estado Biológico antes de prescribir intervenciones de longevidad
              </p>
            </div>

            {/* Resultado Proyectado en Vivo */}
            {simulatedScore && (
              <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-cyan-700 block font-medium">SGEB Proyectado</span>
                  <span className="text-xl font-extrabold text-cyan-950">
                    {simulatedScore.predictedSgeb} pts
                  </span>
                </div>
                <div className="border-l border-cyan-200 pl-3">
                  <span className="text-[10px] text-cyan-700 block font-medium">Estado Estimado</span>
                  <span className="font-bold text-cyan-900">
                    {simulatedScore.predictedState}
                  </span>
                </div>
                <div className="border-l border-cyan-200 pl-3">
                  <span className="text-[10px] text-cyan-700 block font-medium">Variación Neta</span>
                  <span
                    className={`font-bold ${
                      simulatedScore.delta < 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {simulatedScore.delta > 0 ? `+${simulatedScore.delta}` : simulatedScore.delta} pts
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controles de Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 font-bold">Interleucina-6 (IL-6)</span>
                <span className="font-mono font-bold text-cyan-800">{simIl6} pg/mL</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.1"
                value={simIl6}
                onChange={(e) => setSimIl6(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-cyan-600"
              />
              <span className="text-[11px] text-slate-400 block">Normal: &lt; 3.0 pg/mL • Dominio D-VI</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 font-bold">Dinamometría Manual (Fuerza)</span>
                <span className="font-mono font-bold text-cyan-800">{simDynamometry} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="1"
                value={simDynamometry}
                onChange={(e) => setSimDynamometry(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-cyan-600"
              />
              <span className="text-[11px] text-slate-400 block">Punto de corte sarcopenia: &lt; 27 kg (M) / 16 kg (F) • D-VII</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 font-bold">Velocidad de la Marcha</span>
                <span className="font-mono font-bold text-cyan-800">{simGaitSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.5"
                step="0.05"
                value={simGaitSpeed}
                onChange={(e) => setSimGaitSpeed(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-cyan-600"
              />
              <span className="text-[11px] text-slate-400 block">Fragilidad motora: &lt; 0.8 m/s • D-VII</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 font-bold">Proteína C Reactiva (hs-CRP)</span>
                <span className="font-mono font-bold text-cyan-800">{simCrp} mg/L</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="10.0"
                step="0.1"
                value={simCrp}
                onChange={(e) => setSimCrp(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-cyan-600"
              />
              <span className="text-[11px] text-slate-400 block">Inflammaging óptimo: &lt; 1.0 mg/L • D-VI</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 font-bold">Rigidez Arterial (cfPWV)</span>
                <span className="font-mono font-bold text-cyan-800">{simPwv} m/s</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="15.0"
                step="0.1"
                value={simPwv}
                onChange={(e) => setSimPwv(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-cyan-600"
              />
              <span className="text-[11px] text-slate-400 block">Envejecimiento vascular acelerado: &gt; 10 m/s • D-VIII</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 font-bold">Ritmo DunedinPACE</span>
                <span className="font-mono font-bold text-cyan-800">{simDunedin}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.02"
                value={simDunedin}
                onChange={(e) => setSimDunedin(parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-cyan-600"
              />
              <span className="text-[11px] text-slate-400 block">Ritmo normal = 1.00 por año cronológico • D-III</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. CONTENIDO DE PESTAÑA 6: DICTAMEN MÉDICO Y AUDITORÍA       */}
      {/* ============================================================== */}
      {activeTab === 'validation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Validación y Dictamen Médico Facultativo del SICBE
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conforme a la normativa clínica, los algoritmos actúan como soporte a la decisión; la validación médica es el acto formal obligatorio.
            </p>
          </div>

          {valSavedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>{valSavedMessage}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Concurrencia Médica con el Dictamen Algorítmico:
              </label>
              <div className="flex items-center gap-4">
                {[
                  { key: 'CONCUR', label: 'Concurro Plenamente' },
                  { key: 'RESERVATIONS', label: 'Concurro con Reservas Clínicas' },
                  { key: 'DISAGREE', label: 'Disiento del Dictamen' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="agreement"
                      value={item.key}
                      checked={valAgreement === item.key}
                      onChange={() => setValAgreement(item.key as any)}
                      className="accent-cyan-600 cursor-pointer"
                    />
                    <span className="text-slate-800 font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Juicio Clínico e Interpretación Integral:
              </label>
              <textarea
                rows={4}
                value={valInterpretation}
                onChange={(e) => setValInterpretation(e.target.value)}
                placeholder="Describa la interpretación clínica, concordancia biológica, hallazgos de mayor impacto..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Recomendación Terapéutica y Plan de Seguimiento:
              </label>
              <input
                type="text"
                value={valRecommendation}
                onChange={(e) => setValRecommendation(e.target.value)}
                placeholder="Plazo de re-evaluación, control analítico, prehabilitación..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-slate-400 text-[11px]">
                Médico responsable: <strong>{currentUser.name}</strong> ({currentUser.licenseNumber || 'Exeq. 89412-MED'})
              </span>
              <button
                onClick={handleSaveValidation}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
              >
                Firmar y Sellar Validación Médica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
