/**
 * IMERTEC — Modal de Corrección No Destructiva de Observación Clínica
 * "Clinical data is never silently overwritten."
 * Guarda el valor original, el valor corregido, el usuario, la fecha y la justificación clínica.
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { ClinicalObservation } from '../types/clinical';
import {
  X,
  History,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface CorrectObservationModalProps {
  observation: ClinicalObservation;
  isOpen: boolean;
  onClose: () => void;
}

export const CorrectObservationModal: React.FC<CorrectObservationModalProps> = ({
  observation,
  isOpen,
  onClose,
}) => {
  const { correctObservation } = useClinical();

  const [correctedValue, setCorrectedValue] = useState<string>(
    String(observation.value)
  );
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reason.trim()) {
      setErrorMessage('La justificación clínica es mandatoria para realizar una corrección no destructiva.');
      return;
    }

    if (String(correctedValue).trim() === String(observation.value).trim()) {
      setErrorMessage('El valor corregido debe ser diferente al valor actual.');
      return;
    }

    // Procesar tipo de dato si es numérico
    let parsedValue: any = correctedValue;
    if (!isNaN(Number(correctedValue)) && correctedValue.trim() !== '') {
      parsedValue = Number(correctedValue);
    }

    correctObservation(observation.observation_id || observation.id || '', parsedValue, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Corrección No Destructiva de Observación
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {observation.variableName || observation.canonicalVariableId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Principio IMERTEC */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[11px] uppercase tracking-wider">
                Principio Ontológico IMERTEC: Los datos clínicos jamás se sobrescriben en silencio.
              </strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                El valor original se conserva intacto en la pista criptográfica W3C PROV-O y se genera una nueva versión con trazabilidad completa.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Comparador Visual Valor Actual -> Nuevo Valor */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Valor Actual Registrado
              </span>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono font-bold text-slate-800 text-sm">
                {String(observation.value)} {observation.unitOriginal || observation.unitUCUM}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Clase: {observation.epistemicClass}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-cyan-800 block mb-1">
                Valor Corregido Propuesto <span className="text-red-500">*</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  required
                  value={correctedValue}
                  onChange={(e) => setCorrectedValue(e.target.value)}
                  className="w-full p-2.5 bg-white border border-cyan-300 focus:ring-2 focus:ring-cyan-600 rounded-lg font-mono font-bold text-slate-900 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Unidad: {observation.unitOriginal || observation.unitUCUM || 'N/A'}
              </span>
            </div>
          </div>

          {/* Justificación Clínica */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Justificación Clínica y Causa del Error <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ej. Error de digitación en el teclado numérico durante la toma rápida; corroborado con bitácora física del tensiómetro..."
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          {/* Historial previo de correcciones si existe */}
          {observation.correctionHistory && observation.correctionHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Historial de Correcciones Previas ({observation.correctionHistory.length}):
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {observation.correctionHistory.map((h, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex justify-between font-mono">
                      <span>{String(h.previousValue)} → {String(h.correctedValue)}</span>
                      <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Por: {h.correctedBy} • Motivo: {h.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              <span>Registrar Corrección No Destructiva</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
