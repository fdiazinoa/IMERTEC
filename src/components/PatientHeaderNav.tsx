/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Cabecera Ejecutiva del Paciente y Barra de Subnavegación
 */

import React from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  LayoutDashboard,
  Clock,
  FileSpreadsheet,
  Stethoscope,
  FlaskConical,
  FolderOpen,
  Dna,
  ClipboardList,
  ShieldAlert,
  History,
  AlertOctagon,
  Calendar,
  CheckCircle2,
  Brain,
} from 'lucide-react';

interface PatientHeaderNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSafetyModal: () => void;
  onStartEncounter: () => void;
}

export const PatientHeaderNav: React.FC<PatientHeaderNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSafetyModal,
  onStartEncounter,
}) => {
  const { selectedPatient, patientSafetyAlerts } = useClinical();

  const activeE00 = patientSafetyAlerts.find((a) => !a.isResolved && a.severity === 'ROJO_CRITICO');

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: LayoutDashboard },
    { id: 'timeline', label: 'Evolución', icon: Clock },
    { id: 'history', label: 'Cuestionario', icon: FileSpreadsheet },
    { id: 'encounters', label: 'Consultas', icon: Stethoscope },
    { id: 'laboratory', label: 'Laboratorio', icon: FlaskConical },
    { id: 'documents', label: 'Documentos', icon: FolderOpen, count: selectedPatient.id === 'PAT-002' ? 16 : undefined },
    { id: 'eci', label: 'Núcleo ECI', icon: Brain, count: 'Fase 3' },
    { id: 'sicbe', label: 'Estado Biológico', icon: Dna },
    { id: 'plan', label: 'Plan de Cuidados', icon: ClipboardList },
    { id: 'audit', label: 'Auditoría', icon: History },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6">
      {/* Patient Executive Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-600 text-lg shadow-xs">
              {selectedPatient.photoUrl ? (
                <img
                  src={selectedPatient.photoUrl}
                  alt={selectedPatient.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                selectedPatient.firstName[0]
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedPatient.age} años · {selectedPatient.biologicalSex === 'FEMENINO' ? 'Mujer' : 'Hombre'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/80 font-medium">
                  {selectedPatient.cohortCode}
                </span>

                {activeE00 ? (
                  <button
                    onClick={onOpenSafetyModal}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Atención Prioritaria Activa</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sin alertas críticas</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500 mt-1.5">
                <span>
                  <strong className="text-slate-700 font-medium">Historial Clínico:</strong> {selectedPatient.medicalRecordNumber}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700 font-medium">Cédula:</strong> {selectedPatient.nationalId}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700 font-medium">Teléfono:</strong> {selectedPatient.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Main Action */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium">Estado Biológico</div>
              <div className="font-bold text-xs mt-0.5">
                {selectedPatient.id === 'PAT-002' ? (
                  <span className="text-amber-700 inline-flex items-center gap-1">
                    <span>En Evaluación Oncológica</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300/60 font-semibold">PD-005</span>
                  </span>
                ) : selectedPatient.id === 'PAT-003' ? (
                  <span className="text-slate-700">Estado III (SGEB: 54.1)</span>
                ) : (
                  <span className="text-emerald-700">Estado I (SGEB: 17.8)</span>
                )}
              </div>
            </div>

            <button
              onClick={onStartEncounter}
              className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Nueva Consulta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-800 shadow-xs border border-cyan-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-cyan-200/60 text-cyan-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
