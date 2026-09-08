/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Vista General del Dashboard — Diseño Limpio y Amigable
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  Users,
  ShieldAlert,
  Calendar,
  Activity,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Stethoscope,
  HeartPulse,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DashboardOverviewProps {
  onSelectPatient: (id: string, tab?: string) => void;
  onOpenSafetyModal: () => void;
  onOpenNewPatientModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectPatient,
  onOpenSafetyModal,
  onOpenNewPatientModal,
}) => {
  const { patients, safetyAlerts, unresolvedCriticalAlertsCount, auditLogs } = useClinical();
  const [patientSearch, setPatientSearch] = useState('');

  const activeAlerts = (safetyAlerts || []).filter((a) => !a.isResolved && a.status !== 'RESOLVED');

  const filteredPatients = (patients || []).filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      (p.cohortCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Friendly Greeting & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Ecosistema Clínico IMERTEC
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma de seguimiento longitudinal, biología del envejecimiento (SICBE) y seguridad clínica
          </p>
        </div>

        <button
          onClick={onOpenNewPatientModal}
          className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          + Registrar Nuevo Paciente
        </button>
      </div>

      {/* 2. 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pacientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pacientes Activos</span>
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{patients.length}</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> 100% cohorte
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Monitoreo continuo activo</p>
          </div>
        </div>

        {/* Alertas E00 */}
        <div
          onClick={onOpenSafetyModal}
          className={`p-5 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer transition-all flex flex-col justify-between ${
            unresolvedCriticalAlertsCount > 0
              ? 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/70'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Atención Prioritaria (E00)</span>
            <span
              className={`p-2 rounded-xl ${
                unresolvedCriticalAlertsCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-800">{unresolvedCriticalAlertsCount}</span>
              <span className="text-xs font-medium text-amber-800 px-2 py-0.5 rounded-full bg-amber-100">
                En resolución
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Casos con protocolo activado</p>
          </div>
        </div>

        {/* Ciclo Longitudinal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Protocolo Longitudinal</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">36</span>
              <span className="text-xs text-slate-400 font-medium">meses de estudio</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Visitas programadas V0 hasta V5</p>
          </div>
        </div>

        {/* Gobernanza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Trazabilidad Inmutable</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">{auditLogs.length}</span>
              <span className="text-xs text-slate-400 font-medium">registros PROV-O</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Gobernanza clínica auditada</p>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Patient Cohort & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cohort Directory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Directorio de Pacientes</h2>
                <p className="text-xs text-slate-500">Seleccione un paciente para abrir su expediente clínico</p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-600"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredPatients.map((p) => {
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPatient(p.id, 'summary')}
                    className="p-5 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-600 text-base shadow-xs">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                        ) : (
                          p.firstName[0]
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 hover:text-cyan-700">
                            {p.firstName} {p.lastName}
                          </h3>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {p.cohortCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {p.age} años · {p.biologicalSex === 'FEMENINO' ? 'Mujer' : 'Hombre'} · Exp: {p.medicalRecordNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        {p.id === 'PAT-002' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              En Evaluación Oncológica (PD-005)
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Reserva funcional excepcional
                            </div>
                          </div>
                        ) : p.id === 'PAT-003' ? (
                          <div>
                            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              Estado III · SGEB 54.1
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Carga Moderada
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                              Estado I · Envejecimiento Óptimo
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              SGEB 17.8 pts
                            </div>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tarjeta Amigable del Caso Piloto */}
          <div className="bg-gradient-to-r from-cyan-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-cyan-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Caso Piloto Documentado (16 Documentos Oficiales)
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  Casilda De La Cruz Martínez (80 años)
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Caso real que ilustra el desacoplamiento biológico: excelente reserva funcional (100% independiente en actividades diarias) frente a un proceso oncológico anexial activo que activa la <strong>Regla de Abstención Segura PD-005</strong>.
                </p>
              </div>
              <button
                onClick={() => onSelectPatient('PAT-002', 'summary')}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center flex-shrink-0"
              >
                <span>Abrir Expediente</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Active Alerts & Recent Stream */}
        <div className="space-y-6">
          {/* Bandeja de Seguridad E00 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Alertas de Atención E00</h3>
              </div>
              <button
                onClick={onOpenSafetyModal}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
              >
                Ver Todas
              </button>
            </div>

            <div className="p-4 space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  No existen alertas activas pendientes.
                </div>
              ) : (
                activeAlerts.map((alert) => {
                  const isCritical =
                    alert.severity === 'ROJO_CRITICO' ||
                    alert.severity === 'CRITICAL' ||
                    alert.severity === 'HIGH';

                  return (
                    <div
                      key={alert.id || alert.alert_id}
                      onClick={() => {
                        const pId = alert.patientId || alert.patient_id || '';
                        if (pId) {
                          onSelectPatient(pId, 'summary');
                        }
                        onOpenSafetyModal();
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                        isCritical
                          ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50/80'
                          : 'border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-medium">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-200/80 text-rose-900'
                              : 'bg-amber-200/80 text-amber-900'
                          }`}
                        >
                          {alert.ruleCode || alert.rule_id}
                        </span>
                        <span className="text-slate-500">
                          {new Date(alert.triggeredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1.5 leading-snug">{alert.title}</p>
                      <p className="text-slate-600 line-clamp-2 mt-1 text-[11px] leading-relaxed">
                        {alert.evidence}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-50 text-cyan-700">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Actividad Reciente</h3>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {auditLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="py-2.5 text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-800 font-medium mt-0.5 leading-snug">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.userName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
