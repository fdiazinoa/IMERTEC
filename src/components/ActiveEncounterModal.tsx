/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Modal de Encuentro Clínico Completo (SCR-05) y Síntesis M23
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  X,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Stethoscope,
  Lock,
  Edit3,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Key,
  Sparkles,
  Sliders,
  Brain,
  Search,
  AlertOctagon,
  Info,
} from 'lucide-react';
import { InferredStateM23 } from '../types/clinical';
import {
  evaluateE00Safety,
  inferE21Variables,
  FunctionalInput,
  VitalsInput,
} from '../services/clinicalEngine';
import { AdaptiveClinicalFormEngine } from './AdaptiveClinicalFormEngine';

interface ActiveEncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveEncounterModal: React.FC<ActiveEncounterModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedPatient,
    currentUser,
    activeEncounter,
    startEncounter,
    signAndCloseEncounter,
    cancelEncounter,
    createAlert,
    applyOverride,
    miaciDirectives,
    patientDataGaps,
    resolveDataGap,
    patientUncertainties,
  } = useClinical();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [assessmentMode, setAssessmentMode] = useState<'ADAPTIVE' | 'MANUAL'>('ADAPTIVE');

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState(
    selectedPatient.id === 'PAT-002'
      ? 'Evaluación pre-quirúrgica y funcional integral. Refiere sensación de pesadez pélvica leve.'
      : 'Control periódico de salud y monitoreo biológico SICBE.'
  );

  // Vitals & Safety Inputs
  const [systolicBP, setSystolicBP] = useState<number>(128);
  const [diastolicBP, setDiastolicBP] = useState<number>(76);
  const [heartRate, setHeartRate] = useState<number>(72);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(16);
  const [oxygenSaturation, setOxygenSaturation] = useState<number>(98);
  const [ca125, setCa125] = useState<number>(selectedPatient.id === 'PAT-002' ? 475.6 : 14.2);
  const [isChestPain, setIsChestPain] = useState<boolean>(false);
  const [isAcuteNeuro, setIsAcuteNeuro] = useState<boolean>(false);

  // Functional Inputs
  const [gripStrength, setGripStrength] = useState<number>(18.5);
  const [gaitSpeed, setGaitSpeed] = useState<number>(0.92);
  const [abvdDependentCount, setAbvdDependentCount] = useState<number>(0);
  const [friedCount, setFriedCount] = useState<number>(0);

  // Digital Signature
  const [signaturePassword, setSignaturePassword] = useState('');
  const [signatureSuccess, setSignatureSuccess] = useState(false);
  const [signatureError, setSignatureError] = useState('');

  // Overrides in Step 4
  const [overrides, setOverrides] = useState<Record<string, { value: string; reason: string }>>({});
  const [overrideModalVar, setOverrideModalVar] = useState<string | null>(null);
  const [overrideValueInput, setOverrideValueInput] = useState('');
  const [overrideReasonInput, setOverrideReasonInput] = useState('');

  // Real-time E00 Safety Evaluation
  const e00Alerts = useMemo(() => {
    return evaluateE00Safety(selectedPatient.id, activeEncounter?.id || 'TEMP-ENC', {
      systolicBP,
      diastolicBP,
      heartRate,
      respiratoryRate,
      oxygenSaturation,
      ca125,
      isChestPainAcute: isChestPain,
      isAcuteNeuroDeficit: isAcuteNeuro,
    });
  }, [
    selectedPatient.id,
    activeEncounter?.id,
    systolicBP,
    diastolicBP,
    heartRate,
    respiratoryRate,
    oxygenSaturation,
    ca125,
    isChestPain,
    isAcuteNeuro,
  ]);

  // Real-time E21 / M23 Synthesis Inference
  const inferredM23 = useMemo(() => {
    const input: FunctionalInput = {
      gripStrengthKg: gripStrength,
      gaitSpeedMs: gaitSpeed,
      biologicalSex: selectedPatient.biologicalSex,
      age: selectedPatient.age,
      abvdDependentCount,
      abvdHelpCount: 0,
      hasSecurityAivdDependent: false,
      hasConvenienceAivdDependent: false,
      friedComponentsCount: friedCount,
      muscleMassReduced: false,
      weightLossInvoluntary: selectedPatient.id === 'PAT-002',
      appetiteReduced: false,
      cognitiveComplaint: false,
      dclSuspected: false,
      currentDepressedMood: false,
      priorDepressionDiagnosis: false,
      livesAlone: selectedPatient.id === 'PAT-002',
      socialSupportScale: 8,
      hasFallPastYear: false,
      usesAssistiveDevice: false,
      fearOfFalling: false,
    };
    return inferE21Variables(input);
  }, [
    gripStrength,
    gaitSpeed,
    selectedPatient.biologicalSex,
    selectedPatient.age,
    selectedPatient.id,
    abvdDependentCount,
    friedCount,
  ]);

  if (!isOpen) return null;

  const handleApplyOverride = () => {
    if (!overrideModalVar || !overrideReasonInput.trim()) return;

    setOverrides((prev) => ({
      ...prev,
      [overrideModalVar]: {
        value: overrideValueInput,
        reason: overrideReasonInput,
      },
    }));

    applyOverride(overrideModalVar, overrideValueInput, overrideReasonInput);
    setOverrideModalVar(null);
    setOverrideValueInput('');
    setOverrideReasonInput('');
  };

  const handleSignEncounter = () => {
    if (signaturePassword.length < 3) {
      setSignatureError('Debe ingresar su contraseña de firma digital autorizada.');
      return;
    }

    // Auto-create any detected critical E00 alerts
    e00Alerts.forEach((a) => {
      createAlert({
        patientId: selectedPatient.id,
        encounterId: activeEncounter?.id || 'ENC-NEW',
        title: a.title,
        ruleCode: a.ruleCode,
        severity: a.severity,
        evidence: a.evidence,
        requiredAction: a.requiredAction,
      });
    });

    const success = signAndCloseEncounter(signaturePassword);
    if (success) {
      setSignatureSuccess(true);
      setTimeout(() => {
        setSignatureSuccess(false);
        onClose();
      }, 2000);
    } else {
      setSignatureError('Error al validar la firma médica digital.');
    }
  };

  if (!isOpen) return null;

  const safeDirectives = miaciDirectives || [];
  const safeDataGaps = patientDataGaps || [];
  const unresolvedGaps = safeDataGaps.filter((g) => !g.resolved_at);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Encuentro Clínico Integral (Pipeline HCI → MIACI → ECI)
              </h2>
              <p className="text-xs text-slate-400">
                Paciente: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.cohortCode}) · Médico: {currentUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cancelEncounter();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Steps */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          {[
            { num: 1, title: 'Motivo & Síntomas' },
            { num: 2, title: 'Signos & E00' },
            { num: 3, title: 'Pruebas Funcionales' },
            { num: 4, title: 'Síntesis M23 / Overrides' },
            { num: 5, title: 'Cierre & Firma' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md transition-colors cursor-pointer ${
                step === s.num
                  ? 'bg-cyan-700 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                {s.num}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* MIACI Directives & Data Gap Real-time Guidance Banner */}
          {safeDirectives.length > 0 && (
            <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-800" />
                  <span className="font-bold text-cyan-950 text-xs">
                    Guía de Adquisición Inteligente MIACI ({safeDirectives.length} Directivas Activas)
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-200/80 text-cyan-900 font-mono">
                  FASE 3
                </span>
              </div>

              <div className="space-y-1.5">
                {safeDirectives.slice(0, 3).map((dir) => (
                  <div
                    key={dir.id}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white/90 border border-cyan-100 text-[11px]"
                  >
                    <div className="flex items-start gap-2">
                      {dir.priority === 'EMERGENCY' ? (
                        <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="text-slate-900 font-bold">{dir.target_name}: </strong>
                        <span className="text-slate-700">{dir.reason}</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono px-1.5 py-0.5 bg-slate-100 rounded">
                      {dir.directive_type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Brechas de Información no resueltas */}
              {unresolvedGaps.length > 0 && (
                <div className="pt-2 border-t border-cyan-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Search className="w-3.5 h-3.5 text-cyan-700" />
                    <span>
                      <strong>Brechas críticas detectadas:</strong>{' '}
                      {unresolvedGaps
                        .map((g) => g.variable_name || g.variable_id)
                        .join(', ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const firstGap = unresolvedGaps[0];
                      if (firstGap) {
                        resolveDataGap(firstGap.data_gap_id, 'Completado durante la consulta clínica.');
                      }
                    }}
                    className="text-cyan-800 hover:text-cyan-950 font-bold underline cursor-pointer"
                  >
                    Reconciliar Brecha Clave
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Motivo de consulta */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Motivo Principal del Encuentro (HCI)
                </label>
                <textarea
                  rows={3}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 text-xs text-slate-800"
                  placeholder="Describa el motivo de la consulta..."
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800">
                  Verificación Rápida de Banderas Rojas Inmediatas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChestPain}
                      onChange={(e) => setIsChestPain(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">Dolor torácico agudo opresivo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAcuteNeuro}
                      onChange={(e) => setIsAcuteNeuro(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">Déficit neurológico o sospecha ACV</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Signos Vitales y Motor E00 / Motor Adaptativo */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Selector de Modo */}
              <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-2">
                  <Sparkles className="w-4 h-4 text-cyan-700" />
                  Método de Adquisición de Datos Clínicos:
                </span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setAssessmentMode('ADAPTIVE')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      assessmentMode === 'ADAPTIVE'
                        ? 'bg-cyan-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Motor Adaptativo IMERTEC
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssessmentMode('MANUAL')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      assessmentMode === 'MANUAL'
                        ? 'bg-cyan-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Parámetros Rápidos & Signos
                  </button>
                </div>
              </div>

              {assessmentMode === 'ADAPTIVE' ? (
                <AdaptiveClinicalFormEngine
                  encounterId={activeEncounter?.id || 'ENC-2026-07-002'}
                  onFinish={() => setStep(3)}
                  onSaveDraft={() => {}}
                />
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Presión Sistólica (mmHg)</label>
                      <input
                        type="number"
                        value={systolicBP}
                        onChange={(e) => setSystolicBP(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Presión Diastólica (mmHg)</label>
                      <input
                        type="number"
                        value={diastolicBP}
                        onChange={(e) => setDiastolicBP(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Frecuencia Cardíaca (lpm)</label>
                      <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Frecuencia Resp. (rpm)</label>
                      <input
                        type="number"
                        value={respiratoryRate}
                        onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Saturación SpO2 (%)</label>
                      <input
                        type="number"
                        value={oxygenSaturation}
                        onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">CA-125 (U/mL)</label>
                      <input
                        type="number"
                        value={ca125}
                        onChange={(e) => setCa125(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Real-time E00 Engine Output */}
                  <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-cyan-700" />
                        <span>Evaluación Automática del Motor de Seguridad E00</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          e00Alerts.length > 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {e00Alerts.length > 0 ? `${e00Alerts.length} ALERTA(S) DETECTADA(S)` : 'TODO EN RANGO'}
                      </span>
                    </div>

                    {e00Alerts.length === 0 ? (
                      <p className="text-slate-500">
                        No se detectan alertas críticas que comprometan la seguridad inmediata ni el flujo de consulta.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {e00Alerts.map((alt, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-900">{alt.title}</span>
                              <span className="text-[9px] font-mono bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-bold">
                                {alt.ruleCode}
                              </span>
                            </div>
                            <p className="text-rose-800 mt-1">{alt.evidence}</p>
                            <p className="text-rose-900 font-semibold mt-1">
                              <strong>Acción Inmediata:</strong> {alt.requiredAction}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Pruebas Funcionales */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block font-bold text-slate-800">
                    Velocidad de Marcha Habitual (4 metros)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={gaitSpeed}
                      onChange={(e) => setGaitSpeed(Number(e.target.value))}
                      className="w-32 p-2 border border-slate-300 rounded-lg font-mono text-sm"
                    />
                    <span className="font-medium text-slate-600">m/s</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Umbral crítico: &lt; 0.8 m/s indica limitación moderada; &lt; 0.6 m/s severa.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block font-bold text-slate-800">
                    Fuerza de Prensión Manual (Dinamometría)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      value={gripStrength}
                      onChange={(e) => setGripStrength(Number(e.target.value))}
                      className="w-32 p-2 border border-slate-300 rounded-lg font-mono text-sm"
                    />
                    <span className="font-medium text-slate-600">kg</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Puntos de corte EWGSOP2: &lt; 16 kg en mujeres, &lt; 27 kg en hombres.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block font-bold text-slate-800">
                    Dependencia en ABVD (0 a 6 actividades dependientes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={abvdDependentCount}
                    onChange={(e) => setAbvdDependentCount(Number(e.target.value))}
                    className="w-32 p-2 border border-slate-300 rounded-lg font-mono text-sm"
                  />
                  <p className="text-[11px] text-slate-500">
                    0 = Completamente independiente (Bañarse, vestirse, alimentarse, continencia, traslado, uso del retrete).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block font-bold text-slate-800">
                    Criterios de Fragilidad de Fried (0 a 5 componentes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={friedCount}
                    onChange={(e) => setFriedCount(Number(e.target.value))}
                    className="w-32 p-2 border border-slate-300 rounded-lg font-mono text-sm"
                  />
                  <p className="text-[11px] text-slate-500">
                    0 = Robusto; 1-2 = Prefrágil; &gt;= 3 = Frágil.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Síntesis M23 y Overrides Médicos */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Módulo 23 (M23): Síntesis Pre-SICBE y Autoridad Médica
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    El médico mantiene la autoridad final. Puede refinar o revocar cualquier inferencia algorítmica con justificación clínica documentada.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.values(inferredM23) as InferredStateM23[]).map((item) => {
                  const hasOverride = !!overrides[item.variableKey];
                  const displayVal = hasOverride
                    ? overrides[item.variableKey].value
                    : item.systemValue;

                  return (
                    <div
                      key={item.variableKey}
                      className={`p-3.5 rounded-xl border transition-all ${
                        hasOverride
                          ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{item.label}</span>
                        <button
                          onClick={() => {
                            setOverrideModalVar(item.variableKey);
                            setOverrideValueInput(displayVal);
                            setOverrideReasonInput(overrides[item.variableKey]?.reason || '');
                          }}
                          className="text-cyan-700 hover:text-cyan-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{hasOverride ? 'Editar Override' : 'Override'}</span>
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            hasOverride
                              ? 'bg-purple-200 text-purple-900'
                              : 'bg-white border border-slate-300 text-slate-800'
                          }`}
                        >
                          {displayVal}
                        </span>
                        {hasOverride && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-700 text-white font-bold">
                            OVERRIDE MÉDICO
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                        Regla: {item.ruleUsed} · Nivel {item.evidenceLevel}
                      </p>

                      {hasOverride && (
                        <p className="text-[11px] text-purple-800 mt-1 italic">
                          "Motivo: {overrides[item.variableKey].reason}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Pop-up for Override Rationale */}
              {overrideModalVar && (
                <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Aplicar Override Clínico a {overrideModalVar}
                    </h4>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">
                        Nuevo Valor Determinado por Médico
                      </label>
                      <input
                        type="text"
                        value={overrideValueInput}
                        onChange={(e) => setOverrideValueInput(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">
                        Justificación Clínica Obligatoria (para Bitácora de Auditoría)
                      </label>
                      <textarea
                        rows={3}
                        value={overrideReasonInput}
                        onChange={(e) => setOverrideReasonInput(e.target.value)}
                        placeholder="Explique el criterio clínico..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setOverrideModalVar(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleApplyOverride}
                        className="px-3.5 py-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Guardar Override
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Cierre y Firma Digital */}
          {step === 5 && (
            <div className="space-y-4 max-w-lg mx-auto py-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Cierre de Encuentro y Publicación de ECI
                </h4>
                <p className="text-slate-500 mt-1">
                  Al firmar, el Estado Clínico Integral (ECI) transiciona a <strong>E8_PUBLICADO</strong> y se vuelve <strong>inmutable</strong> para trazabilidad W3C PROV-O.
                </p>
              </div>

              {signatureSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-1 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p>¡Encuentro firmado y sellado criptográficamente!</p>
                  <p className="text-[11px] font-mono text-emerald-700">Hash SHA256 generado y auditado.</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contraseña de Firma Médica ({currentUser.name})
                    </label>
                    <input
                      type="password"
                      placeholder="Ingrese contraseña autorizada..."
                      value={signaturePassword}
                      onChange={(e) => {
                        setSignaturePassword(e.target.value);
                        setSignatureError('');
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  {signatureError && (
                    <p className="text-rose-600 font-semibold text-[11px]">{signatureError}</p>
                  )}

                  <button
                    onClick={handleSignEncounter}
                    className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Firmar Digitalmente y Publicar ECI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setStep((prev) => Math.max(1, prev - 1) as any)}
            disabled={step === 1}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              step === 1 ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep((prev) => Math.min(5, prev + 1) as any)}
              className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-slate-400 text-xs font-medium">Paso final de cierre</span>
          )}
        </div>
      </div>
    </div>
  );
};
