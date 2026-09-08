import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  Brain,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Dna,
  FileSpreadsheet,
  FlaskConical,
  FolderOpen,
  History,
  LayoutDashboard,
  MoreHorizontal,
  Stethoscope,
} from 'lucide-react';

interface PatientHeaderNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSafetyModal: () => void;
  onStartEncounter: () => void;
}

const primaryNavigation = [
  { id: 'summary', label: 'Resumen', icon: LayoutDashboard },
  { id: 'encounters', label: 'Consultas', icon: Stethoscope },
  { id: 'laboratory', label: 'Resultados', icon: FlaskConical },
  { id: 'plan', label: 'Plan', icon: ClipboardList },
  { id: 'timeline', label: 'Historial', icon: History },
];

const additionalNavigation = [
  { id: 'history', label: 'Cuestionario clínico', description: 'Evaluación guiada del paciente', icon: FileSpreadsheet },
  { id: 'documents', label: 'Documentos', description: 'Estudios y archivos clínicos', icon: FolderOpen },
  { id: 'sicbe', label: 'Evaluación biológica', description: 'Estado y dominios biológicos', icon: Dna },
  { id: 'eci', label: 'Análisis clínico avanzado', description: 'Núcleo de análisis ECI', icon: Brain },
  { id: 'audit', label: 'Auditoría', description: 'Trazabilidad del expediente', icon: History },
];

export const PatientHeaderNav: React.FC<PatientHeaderNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSafetyModal,
  onStartEncounter,
}) => {
  const { selectedPatient, patientSafetyAlerts } = useClinical();
  const [showMore, setShowMore] = useState(false);

  const activeAlert = patientSafetyAlerts.find(
    (alert) =>
      !alert.isResolved &&
      ['ROJO_CRITICO', 'CRITICAL', 'HIGH'].includes(alert.severity)
  );
  const sexLabel = selectedPatient.biologicalSex.toLowerCase() === 'femenino' ? 'Mujer' : 'Hombre';
  const activeAdditionalItem = additionalNavigation.find((item) => item.id === currentTab);

  return (
    <section className="mb-6 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-3 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600">
              {selectedPatient.photoUrl ? (
                <img src={selectedPatient.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : selectedPatient.firstName[0]}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="truncate text-lg font-bold text-slate-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h1>
                <span className="text-xs text-slate-500">{selectedPatient.age} años · {sexLabel}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">Expediente {selectedPatient.medicalRecordNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeAlert ? (
              <button
                type="button"
                onClick={onOpenSafetyModal}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Atención prioritaria
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Sin alertas críticas
              </span>
            )}
            <button
              type="button"
              onClick={onStartEncounter}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-800"
            >
              <Calendar className="h-4 w-4" /> Nueva consulta
            </button>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap items-center gap-1" aria-label="Secciones del expediente">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setCurrentTab(item.id); setShowMore(false); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                  isActive ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMore((open) => !open)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                activeAdditionalItem || showMore
                  ? 'bg-cyan-50 text-cyan-800'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              aria-expanded={showMore}
            >
              <MoreHorizontal className="h-4 w-4" />
              {activeAdditionalItem?.label || 'Más opciones'}
            </button>

            {showMore && (
              <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:left-0 sm:right-auto">
                <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Todas las herramientas
                </p>
                {additionalNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setCurrentTab(item.id); setShowMore(false); }}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        currentTab === item.id ? 'bg-cyan-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${currentTab === item.id ? 'text-cyan-700' : 'text-slate-400'}`} />
                      <span>
                        <span className="block text-xs font-semibold text-slate-800">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </section>
  );
};
