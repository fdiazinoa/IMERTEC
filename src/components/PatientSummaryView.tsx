/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Vista Resumen del Paciente — Diseño Limpio y Amigable
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Activity,
  Calendar,
  Pill,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertOctagon,
  Dna,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Stethoscope,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface PatientSummaryViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenSafetyModal: () => void;
  onStartEncounter: () => void;
}

export const PatientSummaryView: React.FC<PatientSummaryViewProps> = ({
  onNavigateTab,
  onOpenSafetyModal,
  onStartEncounter,
}) => {
  const {
    selectedPatient,
    activeProblems,
    medications,
    allergies,
    patientSafetyAlerts,
    patientDomains,
    longitudinalPoints,
  } = useClinical();

  // Mode: 'friendly' (clean & friendly) vs 'technical' (full clinical breakdown)
  const [viewMode, setViewMode] = useState<'friendly' | 'technical'>('friendly');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const activeE00Alerts = (patientSafetyAlerts || []).filter((a) => !a.isResolved);
  const latestVisit = (longitudinalPoints || [])[(longitudinalPoints || []).length - 1];

  // Helper for sparklines
  const renderSparkline = (
    data: number[],
    color: string,
    unit: string,
    minVal?: number,
    maxVal?: number
  ) => {
    if (!data || data.length === 0) return <span className="text-slate-400 text-xs">Sin datos</span>;
    const min = minVal !== undefined ? minVal : Math.min(...data);
    const max = maxVal !== undefined ? maxVal : Math.max(...data);
    const range = max - min || 1;

    const width = 100;
    const height = 30;
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1 || 1)) * (width - 10) + 5;
        const y = height - ((val - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    const currentVal = data[data.length - 1];

    return (
      <div className="flex items-center gap-2">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((val, idx) => {
            const x = (idx / (data.length - 1 || 1)) * (width - 10) + 5;
            const y = height - ((val - min) / range) * (height - 8) - 4;
            return <circle key={idx} cx={x} cy={y} r="3" fill={color} />;
          })}
        </svg>
        <span className="text-xs font-mono font-bold text-slate-800">
          {currentVal} <span className="text-[10px] font-normal text-slate-500">{unit}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Mode Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Resumen Clínico del Paciente</h2>
            <p className="text-xs text-slate-500">Información esencial consolidada para la toma de decisiones</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setViewMode('friendly')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'friendly'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-700" />
            <span>Vista Amigable</span>
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'technical'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Vista Detallada</span>
          </button>
        </div>
      </div>

      {/* 1. Alerta Médica Prioritaria (Suave, tranquilizadora y clara) */}
      {activeE00Alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300/60 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                    Atención Médica Prioritaria
                  </span>
                  <span className="text-xs text-slate-500">
                    Registrada el {new Date(activeE00Alerts[0].triggeredAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {activeE00Alerts[0].title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                  {activeE00Alerts[0].evidence}
                </p>
                <div className="mt-2 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <span className="font-bold text-amber-800">Plan recomendado:</span> {activeE00Alerts[0].requiredAction}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSafetyModal}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl whitespace-nowrap shadow-xs cursor-pointer transition-colors self-start sm:self-center"
            >
              Revisar Protocolo
            </button>
          </div>
        </div>
      )}

      {/* 2. Cuatro Métricas Vitales Clave (Grandes, limpias, amigables) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presión Arterial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Presión Arterial</span>
            <span className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {latestVisit?.systolicBP ? `${latestVisit.systolicBP}/80` : '130/80'}
              </span>
              <span className="text-xs text-slate-400 font-medium">mmHg</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Controlada
            </span>
          </div>
        </div>

        {/* Velocidad de Marcha */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Movilidad & Marcha</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <HeartPulse className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {latestVisit?.gaitSpeedMs ? latestVisit.gaitSpeedMs.toFixed(2) : '1.05'}
              </span>
              <span className="text-xs text-slate-400 font-medium">m/s</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Excelente movilidad
            </span>
          </div>
        </div>

        {/* Capacidad Funcional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Autonomía Diaria</span>
            <span className="p-1.5 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">100%</span>
              <span className="text-xs text-slate-400 font-medium">Barthel</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Independiente en ABVD
            </span>
          </div>
        </div>

        {/* Marcador Relevante */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Marcador Prioritario</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {selectedPatient.id === 'PAT-002' ? '475.6' : '14.2'}
              </span>
              <span className="text-xs text-slate-400 font-medium">CA-125 U/mL</span>
            </div>
            <span
              className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                selectedPatient.id === 'PAT-002'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              {selectedPatient.id === 'PAT-002' ? 'Seguimiento Oncológico' : 'Rango Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tarjeta de Estado de Salud & Clasificación Biológica */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
                <Dna className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Perfil Biológico y Envejecimiento Saludable
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluación multifactorial de la reserva biológica, molecular y funcional
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('sicbe')}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Explorar los 8 Dominios en Detalle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Narrative & Status Highlight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-500">Dictamen Clínico:</span>
              {selectedPatient.id === 'PAT-002' ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80">
                  En Evaluación Oncológica (Regla PD-005)
                </span>
              ) : selectedPatient.id === 'PAT-003' ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                  Estado III · Carga Moderada
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900">
                  Estado I · Envejecimiento Óptimo
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
              {selectedPatient.id === 'PAT-002'
                ? 'Casilda presenta una reserva física y cognitiva excepcional para sus 80 años (caminar ágil, 100% independiente en actividades diarias). La estadificación global de longevidad se encuentra temporalmente en pausa médica debido al hallazgo de una masa anexial con elevación de CA-125, priorizando su resolución oncológica antes de reanudar el cálculo definitivo.'
                : selectedPatient.id === 'PAT-003'
                ? 'El paciente presenta compromiso moderado en dominios metabólico e inflamatorio, pero mantiene capacidad funcional suficiente para beneficiarse de intervención de rehabilitación y nutrición.'
                : 'Todos los parámetros biológicos, moleculares y funcionales se sitúan en rangos óptimos de longevidad saludable.'}
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-500">Puntaje Global (SGEB)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900">
                {selectedPatient.id === 'PAT-002' ? '88.0' : selectedPatient.id === 'PAT-003' ? '54.1' : '17.8'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 100 pts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {selectedPatient.id === 'PAT-002'
                ? 'Estimación preliminar (sujeta a resolución oncológica)'
                : 'Puntaje de carga biológica normalizado'}
            </p>
          </div>
        </div>

        {/* Clean 8-Domain Indicator Chips (Readable, color-coded, uncluttered) */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 block mb-2.5">
            Estado Rápido de los 8 Dominios Biológicos:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {patientDomains.map((dom) => {
              const isAlarm = dom.status === 'ALARMA_ACTIVA';
              const isCompromised = dom.status === 'COMPROMETIDO';
              const isVigilance = dom.status === 'VIGILANCIA';
              const isGood = dom.status === 'PRESERVADO' || dom.status === 'PRESERVADO_EXCEPCIONAL' || dom.status === 'OPTIMO';

              let dotColor = 'bg-slate-400';
              let textStatus = 'Normal';
              let chipBg = 'bg-slate-50 text-slate-700 border-slate-200/70';

              if (isAlarm) {
                dotColor = 'bg-rose-500';
                textStatus = 'Alarma';
                chipBg = 'bg-rose-50/70 text-rose-900 border-rose-200';
              } else if (isCompromised) {
                dotColor = 'bg-orange-500';
                textStatus = 'Compromiso';
                chipBg = 'bg-orange-50/70 text-orange-900 border-orange-200';
              } else if (isVigilance) {
                dotColor = 'bg-amber-500';
                textStatus = 'Vigilancia';
                chipBg = 'bg-amber-50/70 text-amber-900 border-amber-200';
              } else if (isGood) {
                dotColor = 'bg-emerald-500';
                textStatus = 'Óptimo';
                chipBg = 'bg-emerald-50/60 text-emerald-900 border-emerald-200';
              }

              return (
                <div
                  key={dom.domainId}
                  className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${chipBg}`}
                >
                  <span className="font-semibold truncate">{dom.domainName}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="text-[10px] font-medium">{textStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Resumen Clínico Operativo: Problemas y Medicación (2 Columnas Limpias y Espaciosas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problemas Clínicos Prioritarios */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
                  <FileText className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Problemas Clínicos Principales</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold font-mono">
                {activeProblems.length} activos
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {activeProblems.slice(0, 3).map((prob) => (
                <div key={prob.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {prob.id}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{prob.title}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        prob.priority === 'Alta'
                          ? 'bg-rose-100 text-rose-800'
                          : prob.priority === 'Media'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Prioridad {prob.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prob.objective}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('plan')}
            className="w-full mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Plan Completo de Intervención</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Medicación Activa & Alergias */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <Pill className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Tratamiento Farmacológico Actual</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold font-mono">
                {medications.length} fármacos
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {medications.slice(0, 3).map((med) => (
                <div key={med.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{med.name}</span>
                    <span className="text-xs text-slate-500">{med.frequency} · Vía {med.route}</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {med.dosage}
                  </span>
                </div>
              ))}
            </div>

            {/* Micro banner for allergies */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Alergias Conocidas:
              </span>
              <span className="font-semibold text-slate-800">
                {allergies.length === 0 ? 'Sin alergias documentadas' : `${allergies.length} registrada(s)`}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('laboratory')}
            className="w-full mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Laboratorios y Biomarcadores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Acordeón Plegable: Detalles Técnicos & Epistemológicos (Para cuando se necesite inspeccionar a fondo) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-slate-100 text-slate-600">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              Detalles Técnicos, Tendencias y Confiabilidad Epistemológica (ECI v2.1)
            </span>
          </div>
          <span className="text-xs font-semibold text-cyan-700 flex items-center gap-1">
            <span>{showTechnicalDetails ? 'Ocultar detalles' : 'Ver métricas avanzadas'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showTechnicalDetails && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Indices ECI */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">Índices de Confiabilidad Epistemológica</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Índice Confiabilidad Caso (ICC):</span>
                  <span className="font-mono font-bold text-cyan-800">ICC-B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Índice Coherencia Biológica (ICB):</span>
                  <span className="font-mono font-bold text-emerald-700">ICB Medio</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                  <span>Hechos observados $X(t)$: 42</span>
                  <span>Inferencias $Z(t)$: 11</span>
                  <span>Incertidumbres $U(t)$: 2</span>
                </div>
              </div>

              {/* Sparklines */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block">Curvas Rápidas Intervisitas</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Peso Corporal:</span>
                  {renderSparkline(longitudinalPoints.map((p) => p.weightKg), '#0284c7', 'kg')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Velocidad Marcha:</span>
                  {renderSparkline(longitudinalPoints.map((p) => p.gaitSpeedMs), '#059669', 'm/s', 0.4, 1.3)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
