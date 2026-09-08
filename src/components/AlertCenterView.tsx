/**
 * IMERTEC — Centro Centralizado de Alertas de Seguridad Clínica E00
 * Permite filtrar por severidad, estado (Activas / Resueltas), paciente y resolver con justificación clínica.
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { SafetyAlert, AlertSeverity } from '../types/clinical';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Check,
  User,
  Clock,
  ArrowRight,
  Stethoscope,
  X,
  FileText,
} from 'lucide-react';

export const AlertCenterView: React.FC = () => {
  const {
    alerts,
    patients,
    selectedPatient,
    setSelectedPatient,
    resolveAlert,
    currentUser,
  } = useClinical();

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [filterPatient, setFilterPatient] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de resolución
  const [resolvingAlert, setResolvingAlert] = useState<SafetyAlert | null>(null);
  const [resolutionReason, setResolutionReason] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const filteredAlerts = useMemo(() => {
    return (alerts || []).filter((alert) => {
      // Estado
      const isResolved = alert.isResolved || alert.status === 'RESOLVED';
      const isActive = !isResolved;

      if (filterStatus === 'ACTIVE' && !isActive) return false;
      if (filterStatus === 'RESOLVED' && !isResolved) return false;

      // Severidad
      if (filterSeverity !== 'ALL') {
        const isAlertCritical =
          alert.severity === 'ROJO_CRITICO' || alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
        const isAlertWarning =
          alert.severity === 'ALERTA_AMARILLA' || alert.severity === 'MEDIUM';

        if (filterSeverity === 'ROJO_CRITICO' && !isAlertCritical) return false;
        if (filterSeverity === 'ALERTA_AMARILLA' && !isAlertWarning) return false;
        if (filterSeverity === 'INFORMATIONAL' && alert.severity !== 'INFORMATIONAL') return false;
      }

      // Paciente
      if (filterPatient !== 'ALL') {
        const pId = alert.patientId || alert.patient_id;
        if (pId !== filterPatient) return false;
      }

      // Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = alert.title.toLowerCase().includes(q);
        const matchCode = (alert.ruleCode || alert.rule_id || '').toLowerCase().includes(q);
        const matchEvidence = (alert.evidence || '').toLowerCase().includes(q);
        const matchAction = (alert.requiredAction || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchEvidence && !matchAction) return false;
      }

      return true;
    });
  }, [alerts, filterStatus, filterSeverity, filterPatient, searchQuery]);

  const activeAlertsCount = useMemo(() => {
    return (alerts || []).filter((a) => !a.isResolved && a.status !== 'RESOLVED').length;
  }, [alerts]);

  const resolvedAlertsCount = useMemo(() => {
    return (alerts || []).filter((a) => a.isResolved || a.status === 'RESOLVED').length;
  }, [alerts]);

  const criticalCount = useMemo(() => {
    return (alerts || []).filter(
      (a) =>
        (!a.isResolved && a.status !== 'RESOLVED') &&
        (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL' || a.severity === 'HIGH')
    ).length;
  }, [alerts]);

  const handleOpenResolve = (alert: SafetyAlert) => {
    setResolvingAlert(alert);
    setResolutionReason('');
    setActionTaken('');
    setErrorMsg('');
  };

  const handleConfirmResolve = () => {
    if (!resolvingAlert) return;
    if (!resolutionReason.trim()) {
      setErrorMsg('Debe ingresar una justificación clínica médica.');
      return;
    }

    resolveAlert(
      resolvingAlert.id || resolvingAlert.alert_id || '',
      resolutionReason.trim(),
      actionTaken.trim() || undefined
    );

    setResolvingAlert(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Centro de Seguridad Clínica E00 & Monitoreo
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Vigilancia hemodinámica, oncológica y biológica continua según ontología IMERTEC
              </p>
            </div>
          </div>
        </div>

        {/* Badges de Estado */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-700">Críticas Activas</div>
              <div className="text-lg font-bold text-rose-900 font-mono leading-none">{criticalCount}</div>
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Activas</div>
              <div className="text-lg font-bold text-slate-800 font-mono leading-none">{activeAlertsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filtros & Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por regla E00, título o evidencia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600"
          />
        </div>

        {/* Estado */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterStatus === 'ACTIVE'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activas ({activeAlertsCount})
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterStatus === 'RESOLVED'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resueltas ({resolvedAlertsCount})
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({(alerts || []).length})
          </button>
        </div>

        {/* Severidad */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white"
        >
          <option value="ALL">Todas las Severidades</option>
          <option value="ROJO_CRITICO">Rojo Crítico / Crítica</option>
          <option value="ALERTA_AMARILLA">Alerta Amarilla / Media</option>
          <option value="INFORMATIONAL">Informativa</option>
        </select>

        {/* Paciente */}
        <select
          value={filterPatient}
          onChange={(e) => setFilterPatient(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white"
        >
          <option value="ALL">Todos los Pacientes</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName} ({p.id})
            </option>
          ))}
        </select>
      </div>

      {/* 3. Lista de Alertas */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-base">No hay alertas con los filtros seleccionados</h3>
            <p className="text-xs mt-1">Todos los umbrales de seguridad se encuentran estables o han sido resueltos.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const patientId = alert.patientId || alert.patient_id;
            const patientObj = patients.find((p) => p.id === patientId);
            const isResolved = alert.isResolved || alert.status === 'RESOLVED';
            const isCritical =
              alert.severity === 'ROJO_CRITICO' ||
              alert.severity === 'CRITICAL' ||
              alert.severity === 'HIGH';

            return (
              <div
                key={alert.id || alert.alert_id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isResolved
                    ? 'bg-slate-50/70 border-slate-200 opacity-75'
                    : isCritical
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                    : 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isResolved
                        ? 'bg-slate-200 text-slate-600'
                        : isCritical
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {alert.ruleCode || alert.rule_id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{alert.title}</h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isResolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isResolved ? 'RESUELTA' : 'ACTIVA'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Evidencia:</strong> {alert.evidence}
                    </p>

                    <p className="text-xs text-slate-800">
                      <strong>Acción Requerida:</strong> {alert.requiredAction}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      {patientObj && (
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(patientObj)}
                          className="flex items-center gap-1 text-cyan-800 hover:underline font-semibold cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>
                            {patientObj.firstName} {patientObj.lastName} ({patientObj.id})
                          </span>
                        </button>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Encuentro: {alert.encounterId || alert.encounter_id || 'N/A'}</span>
                      </span>

                      {isResolved && alert.resolvedAt && (
                        <span className="text-emerald-700 font-medium">
                          Resuelta por {alert.resolvedBy || alert.resolved_by || 'Médico'} • {new Date(alert.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acción de Resolución */}
                <div className="shrink-0">
                  {!isResolved ? (
                    <button
                      type="button"
                      onClick={() => handleOpenResolve(alert)}
                      className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Resolver con Justificación</span>
                    </button>
                  ) : (
                    <div className="text-right text-[11px] text-slate-500 italic max-w-xs">
                      {alert.resolutionReason && `"${alert.resolutionReason}"`}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Modal de Resolución de Alerta */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Resolución Médica de Alerta E00
                </h3>
              </div>
              <button
                onClick={() => setResolvingAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-mono text-[10px] font-bold text-rose-700">
                  {resolvingAlert.ruleCode || resolvingAlert.rule_id}
                </span>
                <h4 className="font-bold text-slate-900 text-xs mt-0.5">{resolvingAlert.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1">{resolvingAlert.evidence}</p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Justificación Clínica Obligatoria <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  placeholder="Explique el criterio médico por el cual esta alerta se considera gestionada..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Acción Ejecutada (Opcional)
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="ej. Ajuste de antihipertensivo, solicitud de TAC urgente, interconsulta..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Resolución</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
