/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Modal de Gestión y Resolución de Alertas de Seguridad E00
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';
import { SafetyAlert } from '../types/clinical';

interface SafetyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyAlertModal: React.FC<SafetyAlertModalProps> = ({ isOpen, onClose }) => {
  const { safetyAlerts, resolveAlert, selectedPatient } = useClinical();

  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleResolve = () => {
    if (!selectedAlert || !resolutionReason.trim()) return;

    resolveAlert(selectedAlert.id, resolutionReason);
    setSuccessMessage('Alerta médica resuelta y registrada en la bitácora de auditoría.');
    setTimeout(() => {
      setSuccessMessage('');
      setSelectedAlert(null);
      setResolutionReason('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-100 text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Centro de Gestión de Alertas E00 (Motor de Seguridad Prioritaria)
              </h3>
              <p className="text-[11px] text-slate-500">
                Protocolo estricto: Las alertas rojas críticas deben ser resueltas o derivadas explícitamente por un facultativo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {safetyAlerts.map((alt) => {
            const isSelected = selectedAlert?.id === alt.id;

            return (
              <div
                key={alt.id}
                onClick={() => {
                  setSelectedAlert(alt);
                  setResolutionReason(alt.resolutionReason || '');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  alt.isResolved
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : alt.severity === 'ROJO_CRITICO'
                    ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/70'
                    : 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
                } ${isSelected ? 'ring-2 ring-rose-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                        alt.severity === 'ROJO_CRITICO'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {alt.ruleCode}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Disparada: {new Date(alt.triggeredAt).toLocaleDateString()}
                    </span>
                  </div>

                  {alt.isResolved ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resuelta
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                      Pendiente
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-xs mt-2">{alt.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{alt.evidence}</p>

                <div className="mt-2 text-[11px] font-semibold text-rose-900">
                  Acción requerida: {alt.requiredAction}
                </div>

                {alt.isResolved && alt.resolutionReason && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-emerald-800 font-medium">
                    Resuelto por {alt.resolvedBy}: "{alt.resolutionReason}"
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resolution Form if an unresolved alert is selected */}
        {selectedAlert && !selectedAlert.isResolved && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900 text-xs">
              Resolver Alerta: {selectedAlert.title}
            </h4>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Justificación y Plan de Acción Médico (Obligatorio para Auditoría)
              </label>
              <textarea
                rows={2}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="Ej. Paciente derivado a ginecología oncológica, cita confirmada para el 9 de Julio..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolutionReason.trim()}
                className={`px-4 py-1.5 rounded-lg font-bold text-white transition-colors cursor-pointer ${
                  resolutionReason.trim()
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Confirmar Resolución Médica
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
