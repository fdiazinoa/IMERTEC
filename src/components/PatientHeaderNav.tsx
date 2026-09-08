import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  History,
  LayoutDashboard,
  Stethoscope,
} from 'lucide-react';

interface PatientHeaderNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSafetyModal: () => void;
  onStartEncounter: () => void;
}

const navigationGroups = [
  {
    label: 'Resumen',
    primary: 'summary',
    icon: LayoutDashboard,
    items: [{ id: 'summary', label: 'Resumen clínico' }],
  },
  {
    label: 'Consultas',
    primary: 'encounters',
    icon: Stethoscope,
    items: [
      { id: 'encounters', label: 'Consultas' },
      { id: 'history', label: 'Cuestionario clínico' },
    ],
  },
  {
    label: 'Resultados',
    primary: 'laboratory',
    icon: FlaskConical,
    items: [
      { id: 'laboratory', label: 'Laboratorio' },
      { id: 'documents', label: 'Documentos' },
      { id: 'sicbe', label: 'Evaluación biológica' },
      { id: 'eci', label: 'Análisis clínico avanzado' },
    ],
  },
  {
    label: 'Plan',
    primary: 'plan',
    icon: ClipboardList,
    items: [{ id: 'plan', label: 'Plan de cuidados' }],
  },
  {
    label: 'Historial',
    primary: 'timeline',
    icon: History,
    items: [
      { id: 'timeline', label: 'Evolución clínica' },
      { id: 'audit', label: 'Registro de auditoría' },
    ],
  },
];

export const PatientHeaderNav: React.FC<PatientHeaderNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSafetyModal,
  onStartEncounter,
}) => {
  const { selectedPatient, patientSafetyAlerts } = useClinical();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const activeAlert = patientSafetyAlerts.find(
    (alert) =>
      !alert.isResolved &&
      ['ROJO_CRITICO', 'CRITICAL', 'HIGH'].includes(alert.severity)
  );
  const sexLabel = selectedPatient.biologicalSex.toLowerCase() === 'femenino' ? 'Mujer' : 'Hombre';

  return (
    <section className="mb-6 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-3 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600">
              {selectedPatient.photoUrl ? (
                <img src={selectedPatient.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                selectedPatient.firstName[0]
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="truncate text-lg font-bold text-slate-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h1>
                <span className="text-xs text-slate-500">
                  {selectedPatient.age} años · {sexLabel}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                Expediente {selectedPatient.medicalRecordNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeAlert ? (
              <button
                type="button"
                onClick={onOpenSafetyModal}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Atención prioritaria
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
              <Calendar className="h-4 w-4" />
              Nueva consulta
            </button>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Secciones del expediente">
          {navigationGroups.map((group) => {
            const Icon = group.icon;
            const isActive = group.items.some((item) => item.id === currentTab);
            const hasMenu = group.items.length > 1;

            return (
              <div key={group.label} className="relative flex shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab(group.primary);
                    setOpenGroup(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${hasMenu ? '' : 'rounded-r-lg'}`}
                >
                  <Icon className="h-4 w-4" />
                  {group.label}
                </button>

                {hasMenu && (
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                    className={`rounded-r-lg px-1.5 text-slate-500 transition-colors ${
                      isActive ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-slate-50'
                    }`}
                    aria-label={`Más opciones de ${group.label}`}
                    aria-expanded={openGroup === group.label}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}

                {hasMenu && openGroup === group.label && (
                  <div className="absolute left-0 top-full z-30 mt-1 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentTab(item.id);
                          setOpenGroup(null);
                        }}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          currentTab === item.id
                            ? 'bg-cyan-50 font-semibold text-cyan-800'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </section>
  );
};
