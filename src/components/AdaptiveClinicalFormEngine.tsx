/**
 * IMERTEC — Motor de Formularios Clínicos Adaptativos
 * Consume declarativamente `ADAPTIVE_CLINICAL_MODULES` y `DMV_VARIABLES`
 * Flujo: QUESTION -> ANSWER -> RULE -> ACTION -> NEXT QUESTION / MODULE
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { ADAPTIVE_CLINICAL_MODULES } from '../data/adaptiveFormConfig';
import { DMV_VARIABLES } from '../data/dmvData';
import { evaluateE00Safety } from '../services/clinicalEngine';
import {
  AdaptiveModule,
  AdaptiveQuestion,
  AdaptiveRule,
} from '../types/clinical';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  Sparkles,
  Stethoscope,
  Info,
  Clock,
  FileCheck,
} from 'lucide-react';

interface AdaptiveFormEngineProps {
  encounterId: string;
  onFinish?: () => void;
  onSaveDraft?: () => void;
}

export const AdaptiveClinicalFormEngine: React.FC<AdaptiveFormEngineProps> = ({
  encounterId,
  onFinish,
  onSaveDraft,
}) => {
  const {
    selectedPatient,
    currentUser,
    addObservation,
    createAlert,
    logAuditEvent,
  } = useClinical();

  // Módulos activos según reglas adaptativas
  const [activeModuleIds, setActiveModuleIds] = useState<string[]>([
    'MOD-IDENTIFICATION',
    'MOD-CHIEF-COMPLAINT',
    'MOD-VITALS',
    'MOD-FUNCTIONAL-EXAM',
    'MOD-SARCOPENIA',
  ]);

  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Respuestas del encuentro: questionId -> value
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const [triggeredRulesHistory, setTriggeredRulesHistory] = useState<string[]>([]);

  const activeModules = useMemo(() => {
    return ADAPTIVE_CLINICAL_MODULES.filter((m) => activeModuleIds.includes(m.id));
  }, [activeModuleIds]);

  const currentModule: AdaptiveModule | undefined = activeModules[currentModuleIndex] || activeModules[0];
  const currentQuestion: AdaptiveQuestion | undefined = currentModule?.questions[currentQuestionIndex];

  // Cálculo de progreso general
  const totalQuestionsInActiveModules = useMemo(() => {
    return activeModules.reduce((acc, m) => acc + m.questions.length, 0);
  }, [activeModules]);

  const answeredQuestionsCount = useMemo(() => {
    let count = 0;
    activeModules.forEach((m) => {
      m.questions.forEach((q) => {
        if (answers[q.id] !== undefined && answers[q.id] !== '') {
          count++;
        }
      });
    });
    return count;
  }, [activeModules, answers]);

  const progressPercentage = Math.round(
    totalQuestionsInActiveModules > 0
      ? (answeredQuestionsCount / totalQuestionsInActiveModules) * 100
      : 0
  );

  // Variable DMV asociada
  const associatedDmv = useMemo(() => {
    if (!currentQuestion?.variableId) return null;
    return DMV_VARIABLES.find((v) => v.id === currentQuestion.variableId);
  }, [currentQuestion]);

  // Ejecución de Reglas Adaptativas tras cada Respuesta
  const evaluateQuestionRules = useCallback(
    (question: AdaptiveQuestion, answerValue: any) => {
      if (!question.rules || question.rules.length === 0) return;

      question.rules.forEach((rule: AdaptiveRule) => {
        let conditionMet = false;

        switch (rule.condition.operator) {
          case 'equals':
            conditionMet = answerValue === rule.condition.value;
            break;
          case 'not_equals':
            conditionMet = answerValue !== rule.condition.value;
            break;
          case 'greater_than':
            conditionMet = Number(answerValue) > Number(rule.condition.value);
            break;
          case 'less_than':
            conditionMet = Number(answerValue) < Number(rule.condition.value);
            break;
          case 'is_true':
            conditionMet = answerValue === true;
            break;
          case 'is_false':
            conditionMet = answerValue === false;
            break;
          case 'in':
            conditionMet =
              Array.isArray(rule.condition.value) &&
              rule.condition.value.includes(answerValue);
            break;
          default:
            break;
        }

        if (conditionMet) {
          // Ejecutar acción adaptativa
          switch (rule.action) {
            case 'OPEN_MODULE':
              if (rule.target) {
                const targetMod = rule.target;
                setActiveModuleIds((prev) =>
                  prev.includes(targetMod) ? prev : [...prev, targetMod]
                );
                setTriggeredRulesHistory((prev) => [
                  ...prev,
                  `Regla [${rule.id}]: Activado módulo complementario ${targetMod}`,
                ]);
              }
              break;

            case 'TRIGGER_ALERT':
              createAlert({
                patientId: selectedPatient.id,
                encounterId,
                title: rule.payload?.title || `Alerta clínica por ${question.text}`,
                severity: rule.payload?.severity || 'ALERTA_AMARILLA',
                evidence: rule.payload?.evidence || `Respuesta detectada: ${String(answerValue)}`,
                requiredAction: rule.payload?.requiredAction || 'Reevaluación clínica prioritaria.',
                ruleCode: rule.target || rule.id,
              });
              setTriggeredRulesHistory((prev) => [
                ...prev,
                `Regla [${rule.id}]: Disparada alerta E00 (${rule.payload?.title || rule.id})`,
              ]);
              break;

            case 'ADD_UNCERTAINTY':
              logAuditEvent(
                'UPDATE',
                'ClinicalEngine',
                question.id,
                `Bandera de incertidumbre epistémica agregada: ${rule.id}`
              );
              break;

            default:
              break;
          }
        }
      });
    },
    [selectedPatient.id, encounterId, createAlert, logAuditEvent]
  );

  // Manejador de Registro de Respuesta
  const handleAnswerChange = (val: any) => {
    if (!currentQuestion) return;
    setSaveStatus('SAVING');

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));

    // Ejecutar reglas declarativas
    evaluateQuestionRules(currentQuestion, val);

    // Si tiene variable DMV asociada, registrar en Observaciones Clínicas
    if (currentQuestion.variableId) {
      const dmv = DMV_VARIABLES.find((v) => v.id === currentQuestion.variableId);
      if (dmv) {
        addObservation({
          observation_id: `OBS-${Date.now()}`,
          patientId: selectedPatient.id,
          encounterId,
          canonicalVariableId: dmv.id,
          variableName: dmv.name,
          epistemicClass:
            currentQuestion.responseType === 'single_choice' || currentQuestion.responseType === 'boolean'
              ? 'OBSERVED'
              : 'MEASURED',
          value: val,
          original_value: val,
          unitOriginal: dmv.canonicalUnit,
          valueNormalized: val,
          unitUCUM: dmv.canonicalUnit,
          clinicalTime: new Date().toISOString(),
          recordedTime: new Date().toISOString(),
          sourceType: 'physician_exam',
          reliability: 'Alta',
          definitionHash: 'SHA256-DMV-V1',
          operatorId: currentUser.id,
        });
      }
    }

    // Evaluación E00 de Seguridad hemodinámica en tiempo real si son signos vitales
    if (currentQuestion.variableId === 'DMV-0001') {
      const pas = Number(val);
      if (pas >= 180 || pas < 80) {
        const e00Alerts = evaluateE00Safety(selectedPatient.id, encounterId, {
          systolicBP: pas,
        });
        e00Alerts.forEach((alt) => createAlert(alt));
      }
    }

    setTimeout(() => {
      setSaveStatus('SAVED');
    }, 300);
  };

  // Navegación
  const handleNext = () => {
    if (!currentModule) return;
    if (currentQuestionIndex < currentModule.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentModuleIndex < activeModules.length - 1) {
      setCurrentModuleIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      if (onFinish) onFinish();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentModuleIndex > 0) {
      const prevMod = activeModules[currentModuleIndex - 1];
      setCurrentModuleIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevMod.questions.length - 1);
    }
  };

  if (!currentModule || !currentQuestion) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <FileCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Evaluación Adaptativa Completada</h3>
        <p className="text-sm text-slate-500 mt-1">Todos los módulos activados han sido recolectados satisfactoriamente.</p>
        <button
          onClick={onFinish}
          className="mt-5 px-5 py-2.5 bg-cyan-700 text-white font-semibold rounded-xl text-xs hover:bg-cyan-800 cursor-pointer shadow-xs"
        >
          Proceder a Resumen Clínico
        </button>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Barra Superior del Encuentro Adaptativo */}
      <div className="bg-white px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                {selectedPatient.age} años • {selectedPatient.biologicalSex}
              </span>
              <span className="text-[10px] text-cyan-800 bg-cyan-100 border border-cyan-200 px-2 py-0.5 rounded-md font-mono">
                {encounterId}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span>Módulo {currentModuleIndex + 1} de {activeModules.length}:</span>
              <span className="font-semibold text-slate-700">{currentModule.title}</span>
            </div>
          </div>
        </div>

        {/* Estado de Guardado & Progreso */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {saveStatus === 'SAVING' ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Autoguardando...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Guardado en CDECI
              </span>
            )}
          </div>

          <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-cyan-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 font-mono">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* 2. Breadcrumbs de Módulos Activos */}
      <div className="bg-slate-100/80 px-5 py-2.5 border-b border-slate-200 overflow-x-auto flex items-center gap-2 text-xs">
        {activeModules.map((mod, idx) => {
          const isCurrent = idx === currentModuleIndex;
          const isDone = idx < currentModuleIndex;
          return (
            <button
              key={mod.id}
              onClick={() => {
                setCurrentModuleIndex(idx);
                setCurrentQuestionIndex(0);
              }}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : isDone
                  ? 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              <span>{mod.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Área Principal de Pregunta Activa */}
      <div className="p-6 md:p-8 flex-1 bg-white">
        <div className="max-w-2xl mx-auto">
          {/* Encabezado de Pregunta */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
              Pregunta {currentQuestionIndex + 1} de {currentModule.questions.length} • {currentQuestion.id}
            </span>
            {associatedDmv && (
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                <Info className="w-3 h-3 text-slate-400" />
                DMV: {associatedDmv.id} ({associatedDmv.canonicalUnit})
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 leading-snug">
            {currentQuestion.text}
          </h3>

          {currentQuestion.helpText && (
            <p className="mt-1.5 text-xs text-slate-500 italic">
              {currentQuestion.helpText}
            </p>
          )}

          {/* Opciones Interactivas según responseType */}
          <div className="mt-6">
            {/* BOOLEAN */}
            {currentQuestion.responseType === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleAnswerChange(true)}
                  className={`p-4 rounded-xl border text-center font-semibold text-sm transition-all cursor-pointer ${
                    currentAnswer === true
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block text-base mb-1">Sí</span>
                  <span className="text-[11px] font-normal text-slate-500">Presente o Afirmativo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswerChange(false)}
                  className={`p-4 rounded-xl border text-center font-semibold text-sm transition-all cursor-pointer ${
                    currentAnswer === false
                      ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-2 ring-cyan-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block text-base mb-1">No</span>
                  <span className="text-[11px] font-normal text-slate-500">Ausente o Negativo</span>
                </button>
              </div>
            )}

            {/* NUMBER */}
            {currentQuestion.responseType === 'number' && (
              <div className="space-y-3">
                <div className="relative rounded-xl shadow-xs max-w-xs">
                  <input
                    type="number"
                    step="any"
                    value={currentAnswer !== undefined ? currentAnswer : ''}
                    onChange={(e) =>
                      handleAnswerChange(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ingrese valor numérico..."
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
                  />
                  {associatedDmv?.canonicalUnit && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-slate-500 uppercase">
                      {associatedDmv.canonicalUnit}
                    </div>
                  )}
                </div>

                {associatedDmv?.referenceRange && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>
                      Rango Referencial Normal:{' '}
                      <strong className="text-slate-700">
                        {associatedDmv.referenceRange.min ?? '-'} a{' '}
                        {associatedDmv.referenceRange.max ?? '-'} {associatedDmv.canonicalUnit}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SINGLE_CHOICE */}
            {currentQuestion.responseType === 'single_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentAnswer === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => handleAnswerChange(opt.value)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50 border-cyan-600 text-cyan-900 font-semibold ring-2 ring-cyan-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="text-sm">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* TEXT */}
            {currentQuestion.responseType === 'text' && (
              <div>
                <textarea
                  rows={3}
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Escriba la descripción clínica..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            )}
          </div>

          {/* Historial de Reglas Dinámicas Disparadas en este Encuentro */}
          {triggeredRulesHistory.length > 0 && (
            <div className="mt-8 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Inferencia Adaptativa IMERTEC en Tiempo Real
              </div>
              <ul className="space-y-1 text-xs text-amber-800">
                {triggeredRulesHistory.slice(-3).map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notas Rápidas de la Consulta */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notas Clínicas Adicionales del Profesional
            </label>
            <input
              type="text"
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="Observación complementaria o contexto del paciente..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-cyan-600"
            />
          </div>
        </div>
      </div>

      {/* 4. Barra Inferior de Navegación */}
      <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentModuleIndex === 0 && currentQuestionIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              Guardar Borrador
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 shadow-xs cursor-pointer transition-colors"
          >
            <span>
              {currentModuleIndex === activeModules.length - 1 &&
              currentQuestionIndex === currentModule.questions.length - 1
                ? 'Finalizar y Resumir'
                : 'Siguiente'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
