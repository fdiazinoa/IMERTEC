import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ArrowRight,
  ChevronRight,
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';

interface DashboardOverviewProps {
  onSelectPatient: (id: string, tab?: string) => void;
  onOpenSafetyModal: () => void;
  onOpenNewPatientModal: () => void;
  onOpenPatientIntake: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectPatient,
  onOpenSafetyModal,
  onOpenNewPatientModal,
  onOpenPatientIntake,
}) => {
  const { patients, safetyAlerts, currentUser } = useClinical();
  const [patientSearch, setPatientSearch] = useState('');

  const activeAlerts = (safetyAlerts || []).filter(
    (alert) => !alert.isResolved && alert.status !== 'RESOLVED'
  );
  const query = patientSearch.trim().toLowerCase();
  const visiblePatients = patients
    .filter((patient) => {
      if (!query) return true;
      return [
        patient.firstName,
        patient.lastName,
        patient.cohortCode,
        patient.medicalRecordNumber,
      ].some((value) => value?.toLowerCase().includes(query));
    })
    .slice(0, query ? patients.length : 6);

  const firstName = currentUser.name
    .replace(/^(Dr\.|Dra\.|Lic\.|Ing\.|Tec\.)\s*/i, '')
    .split(' ')[0];

  return (
    <div className="space-y-6 pt-2">
      <section className="flex flex-col gap-5 rounded-2xl bg-slate-900 px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-300">Buen día, {firstName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">¿Qué necesitas hacer?</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
            Busca un paciente para continuar su atención o registra un expediente nuevo.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-stretch">
          <button
            type="button"
            onClick={onOpenNewPatientModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            <Plus className="h-4 w-4" /> Nuevo paciente
          </button>
          <button
            type="button"
            onClick={onOpenPatientIntake}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Completar ficha autoguiada
          </button>
        </div>
      </section>

      <section>
        <label htmlFor="patient-search" className="sr-only">Buscar paciente</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="patient-search"
            type="search"
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
            placeholder="Buscar por nombre, expediente o código"
            className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => document.getElementById('patient-list')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
            <Users className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-2xl font-bold text-slate-900">{patients.length}</span>
            <span className="block text-xs text-slate-500">Pacientes registrados</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenSafetyModal}
          className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
            activeAlerts.length > 0
              ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-50'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            activeAlerts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <ShieldAlert className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-2xl font-bold text-slate-900">{activeAlerts.length}</span>
            <span className="block text-xs text-slate-500">Alertas que requieren revisión</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section id="patient-list" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">{query ? 'Resultados' : 'Pacientes recientes'}</h2>
              <p className="mt-0.5 text-xs text-slate-500">Selecciona un paciente para abrir su expediente</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNewPatientModal()}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 sm:hidden"
            >
              Añadir
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {visiblePatients.length > 0 ? visiblePatients.map((patient) => {
              const hasActiveAlert = activeAlerts.some(
                (alert) => (alert.patientId || alert.patient_id) === patient.id
              );
              const sexLabel = patient.biologicalSex.toLowerCase() === 'femenino' ? 'Mujer' : 'Hombre';

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient.id, 'summary')}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-semibold text-slate-600">
                    {patient.photoUrl ? (
                      <img src={patient.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : patient.firstName[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {patient.firstName} {patient.lastName}
                      </span>
                      {hasActiveAlert && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" title="Atención prioritaria" />
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {patient.age} años · {sexLabel} · {patient.medicalRecordNumber}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              );
            }) : (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">No encontramos pacientes</p>
                <p className="mt-1 text-xs text-slate-500">Prueba con otro nombre, expediente o código.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-cyan-700" />
            <h2 className="font-bold text-slate-900">Atención pendiente</h2>
          </div>

          {activeAlerts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {activeAlerts.slice(0, 3).map((alert) => {
                const patientId = alert.patientId || alert.patient_id;
                const patient = patients.find((item) => item.id === patientId);
                return (
                  <button
                    key={alert.id || alert.alert_id}
                    type="button"
                    onClick={() => {
                      if (patientId) onSelectPatient(patientId, 'summary');
                      onOpenSafetyModal();
                    }}
                    className="block w-full rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-left hover:bg-rose-50"
                  >
                    <span className="block truncate text-xs font-semibold text-rose-800">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente'}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-slate-700">{alert.title}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onOpenSafetyModal}
                className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Ver todas las alertas
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate-500">No hay alertas activas pendientes.</p>
          )}
        </aside>
      </div>
    </div>
  );
};
