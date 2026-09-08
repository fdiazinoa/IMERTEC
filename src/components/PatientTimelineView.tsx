/**
 * IMERTEC — Línea de Tiempo Clínica & Comparación Longitudinal de Variables
 * Reconstrucción cronológica y análisis delta de variables repetidas en el tiempo.
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  Clock,
  Calendar,
  Activity,
  TestTube2,
  FileText,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';

export const PatientTimelineView: React.FC = () => {
  const {
    selectedPatient,
    encounters,
    observations,
    laboratories,
    documents,
    alerts,
  } = useClinical();

  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'LONGITUDINAL'>('TIMELINE');
  const [filterEventType, setFilterEventType] = useState<string>('ALL');

  // Filtrar datos del paciente actual
  const patientEncounters = useMemo(
    () => (encounters || []).filter((e) => (e.patientId || e.patient_id) === selectedPatient?.id),
    [encounters, selectedPatient?.id]
  );

  const patientObs = useMemo(
    () => (observations || []).filter((o) => (o.patientId || o.patient_id) === selectedPatient?.id),
    [observations, selectedPatient?.id]
  );

  const patientLabs = useMemo(
    () => (laboratories || []).filter((l) => (l.patientId || l.patient_id) === selectedPatient?.id),
    [laboratories, selectedPatient?.id]
  );

  const patientDocs = useMemo(
    () => (documents || []).filter((d) => (d.patientId || d.patient_id) === selectedPatient?.id),
    [documents, selectedPatient?.id]
  );

  const patientAlerts = useMemo(
    () => (alerts || []).filter((a) => (a.patientId || a.patient_id) === selectedPatient?.id),
    [alerts, selectedPatient?.id]
  );

  // Unificar eventos para la línea de tiempo cronológica
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      date: string;
      type: 'ENCOUNTER' | 'LAB' | 'ALERT' | 'DOC' | 'OBS';
      title: string;
      description: string;
      badge?: string;
      severity?: string;
    }> = [];

    patientEncounters.forEach((e) => {
      events.push({
        id: e.id,
        date: e.startTime,
        type: 'ENCOUNTER',
        title: `Encuentro Clínico: ${e.encounterType || 'Ambulatorio'}`,
        description: e.chiefComplaint || 'Consulta clínica integral',
        badge: e.status,
      });
    });

    patientLabs.forEach((l) => {
      events.push({
        id: l.id,
        date: l.sampleDate,
        type: 'LAB',
        title: `Laboratorio: ${l.testName}`,
        description: `Resultado: ${l.value} ${l.unit} (Ref: ${l.referenceRange || 'N/A'})`,
        badge: l.interpretation,
        severity: l.isOutOfRange ? 'WARN' : 'NORMAL',
      });
    });

    patientAlerts.forEach((a) => {
      events.push({
        id: a.id || a.alert_id || '',
        date: (a as any).timestamp || new Date().toISOString(),
        type: 'ALERT',
        title: `Alerta E00: ${a.title}`,
        description: a.evidence || a.requiredAction,
        badge: a.ruleCode,
        severity: a.severity,
      });
    });

    patientDocs.forEach((d) => {
      events.push({
        id: d.id,
        date: d.uploadedAt,
        type: 'DOC',
        title: `Documento: ${d.title}`,
        description: d.notes || d.fileName,
        badge: d.documentType,
      });
    });

    // Ordenar de más reciente a más antiguo
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patientEncounters, patientLabs, patientAlerts, patientDocs]);

  const filteredTimeline = useMemo(() => {
    if (filterEventType === 'ALL') return timelineEvents;
    return timelineEvents.filter((e) => e.type === filterEventType);
  }, [timelineEvents, filterEventType]);

  // Análisis Longitudinal de Variables Repetidas
  // Agrupar observaciones por canonicalVariableId
  const longitudinalSeries = useMemo(() => {
    const map = new Map<string, Array<{ date: string; value: number; unit: string; name: string }>>();

    patientObs.forEach((o) => {
      if (typeof o.value === 'number' || !isNaN(Number(o.value))) {
        const key = o.canonicalVariableId || o.variableName;
        const list = map.get(key) || [];
        list.push({
          date: o.clinicalTime,
          value: Number(o.value),
          unit: o.unitOriginal || o.unitUCUM || '',
          name: o.variableName || key,
        });
        map.set(key, list);
      }
    });

    // También incluir analíticas de laboratorio numéricas
    patientLabs.forEach((l) => {
      if (typeof l.value === 'number') {
        const key = l.canonicalVariableId || l.testName;
        const list = map.get(key) || [];
        list.push({
          date: l.sampleDate,
          value: l.value,
          unit: l.unit,
          name: l.testName,
        });
        map.set(key, list);
      }
    });

    const results: Array<{
      key: string;
      name: string;
      unit: string;
      count: number;
      initialValue: number;
      initialDate: string;
      currentValue: number;
      currentDate: string;
      deltaAbsolute: number;
      deltaPercentage: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
    }> = [];

    map.forEach((records, key) => {
      if (records.length >= 1) {
        // Ordenar cronológicamente
        const sorted = [...records].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const initial = sorted[0];
        const current = sorted[sorted.length - 1];
        const deltaAbs = Number((current.value - initial.value).toFixed(2));
        const deltaPct =
          initial.value !== 0
            ? Number(((deltaAbs / initial.value) * 100).toFixed(1))
            : 0;

        let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        if (deltaAbs > 0.05) trend = 'UP';
        else if (deltaAbs < -0.05) trend = 'DOWN';

        results.push({
          key,
          name: initial.name,
          unit: initial.unit,
          count: sorted.length,
          initialValue: initial.value,
          initialDate: initial.date,
          currentValue: current.value,
          currentDate: current.date,
          deltaAbsolute: deltaAbs,
          deltaPercentage: deltaPct,
          trend,
        });
      }
    });

    return results;
  }, [patientObs, patientLabs]);

  return (
    <div className="space-y-6">
      {/* 1. Header con Selector de Modo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Evolución Temporal & Comparativa Longitudinal
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Paciente: <strong className="text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.id} • {selectedPatient.cohortCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Línea Cronológica
          </button>
          <button
            onClick={() => setActiveTab('LONGITUDINAL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'LONGITUDINAL'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comparación Delta Longitudinal
          </button>
        </div>
      </div>

      {/* 2. Vista de Línea Cronológica */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-4">
          {/* Filtros de eventos */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Filtrar por evento:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: `Todos (${timelineEvents.length})` },
                { id: 'ENCOUNTER', label: `Encuentros (${patientEncounters.length})` },
                { id: 'LAB', label: `Laboratorios (${patientLabs.length})` },
                { id: 'ALERT', label: `Alertas (${patientAlerts.length})` },
                { id: 'DOC', label: `Documentos (${patientDocs.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterEventType(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    filterEventType === f.id
                      ? 'bg-cyan-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            {filteredTimeline.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">
                No hay eventos registrados para el filtro seleccionado.
              </p>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {filteredTimeline.map((ev) => {
                  let icon = <Activity className="w-4 h-4" />;
                  let iconBg = 'bg-cyan-100 text-cyan-800';

                  if (ev.type === 'ENCOUNTER') {
                    icon = <Stethoscope className="w-4 h-4" />;
                    iconBg = 'bg-blue-100 text-blue-800';
                  } else if (ev.type === 'LAB') {
                    icon = <TestTube2 className="w-4 h-4" />;
                    iconBg = 'bg-purple-100 text-purple-800';
                  } else if (ev.type === 'ALERT') {
                    icon = <ShieldAlert className="w-4 h-4" />;
                    iconBg = 'bg-rose-100 text-rose-800';
                  } else if (ev.type === 'DOC') {
                    icon = <FileText className="w-4 h-4" />;
                    iconBg = 'bg-emerald-100 text-emerald-800';
                  }

                  return (
                    <div key={ev.id} className="relative pl-6 group">
                      {/* Icono en el nodo del timeline */}
                      <span
                        className={`absolute -left-3 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${iconBg}`}
                      >
                        {icon}
                      </span>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-sm">{ev.title}</span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(ev.date).toLocaleDateString()} • {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-slate-600 mt-0.5">{ev.description}</p>

                        {ev.badge && (
                          <div className="mt-2">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                              {ev.badge}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Vista de Comparación Longitudinal Delta */}
      {activeTab === 'LONGITUDINAL' && (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-700" />
              <span>
                Cálculo automatizado de variación longitudinal de parámetros clínicos entre la primera y la última observación registrada.
              </span>
            </div>
            <span className="font-mono font-bold text-cyan-800 text-[11px]">
              {longitudinalSeries.length} variables monitorizadas
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Variable Canónica</th>
                    <th className="px-4 py-3">Puntos</th>
                    <th className="px-4 py-3">Valor Inicial</th>
                    <th className="px-4 py-3">Valor Actual</th>
                    <th className="px-4 py-3">Delta Absoluto</th>
                    <th className="px-4 py-3">Variación %</th>
                    <th className="px-4 py-3">Tendencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {longitudinalSeries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No hay suficientes observaciones repetidas para calcular tendencias delta.
                      </td>
                    </tr>
                  ) : (
                    longitudinalSeries.map((s) => {
                      return (
                        <tr key={s.key} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{s.name}</div>
                            <div className="font-mono text-[10px] text-slate-500">{s.key}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-mono">
                            {s.count} registro(s)
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-700">
                            <strong>{s.initialValue}</strong> {s.unit}
                            <div className="text-[10px] text-slate-400">{new Date(s.initialDate).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-900 font-bold">
                            <strong>{s.currentValue}</strong> {s.unit}
                            <div className="text-[10px] text-slate-400">{new Date(s.currentDate).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono">
                            <span
                              className={`font-bold ${
                                s.deltaAbsolute > 0
                                  ? 'text-amber-700'
                                  : s.deltaAbsolute < 0
                                  ? 'text-blue-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {s.deltaAbsolute > 0 ? `+${s.deltaAbsolute}` : s.deltaAbsolute} {s.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                s.deltaPercentage > 15
                                  ? 'bg-amber-100 text-amber-800'
                                  : s.deltaPercentage < -15
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.deltaPercentage > 0 ? `+${s.deltaPercentage}%` : `${s.deltaPercentage}%`}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {s.trend === 'UP' ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                <ArrowUp className="w-3.5 h-3.5" />
                                <span>Ascenso</span>
                              </span>
                            ) : s.trend === 'DOWN' ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span>Descenso</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                                <Minus className="w-3.5 h-3.5" />
                                <span>Estable</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
