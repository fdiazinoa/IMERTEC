/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Barra de Navegación Clínica, Control de Contexto, Selector de Roles y Acceso a Auditoría/QA
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ShieldAlert,
  User,
  Users,
  Activity,
  AlertTriangle,
  PlusCircle,
  FileText,
  Clock,
  ChevronDown,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewPatientModal: () => void;
  onOpenSafetyModal: () => void;
  onStartEncounter: () => void;
  onOpenTestSuite?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewPatientModal,
  onOpenSafetyModal,
  onStartEncounter,
  onOpenTestSuite,
  onLogout,
}) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    patients,
    selectedPatient,
    setSelectedPatient,
    unresolvedCriticalAlertsCount,
    patientSafetyAlerts,
    alerts,
  } = useClinical();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const activeAlertsCount = (alerts || []).filter(
    (a) => !a.isResolved && a.status !== 'RESOLVED'
  ).length;

  const currentPatientHasCritical = (alerts || []).some(
    (a) =>
      (a.patientId === selectedPatient?.id || a.patient_id === selectedPatient?.id) &&
      !a.isResolved &&
      (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL' || a.severity === 'HIGH')
  );

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner if Critical Alert */}
      {unresolvedCriticalAlertsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 max-w-4xl truncate">
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span className="truncate">
              {currentPatientHasCritical
                ? `Atención médica prioritaria E00 activa para ${selectedPatient?.firstName} ${selectedPatient?.lastName}: Alerta de seguridad clínica crítica detectada`
                : `Atención médica prioritaria: ${unresolvedCriticalAlertsCount} alertas críticas E00 detectadas en la cohorte clínica activa`}
            </span>
          </div>
          <button
            onClick={() => setCurrentTab('alerts')}
            className="bg-white/95 hover:bg-white text-slate-900 px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer shrink-0 ml-3"
          >
            Revisar en Centro de Alertas ({activeAlertsCount})
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setCurrentTab('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center text-white font-black text-xl shadow-md border border-cyan-400/30">
                IM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-100">
                    IMERTEC
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    MVP CLÍNICO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Ecosistema Clínico Inteligente
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 ml-4 text-sm font-medium">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentTab('patients')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentTab === 'patients'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Pacientes ({patients.length})
              </button>
              <button
                onClick={() => setCurrentTab('summary')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  ['summary', 'timeline', 'history', 'laboratory', 'documents', 'sicbe', 'plan', 'audit'].includes(currentTab)
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
                <span>Expediente 360°</span>
              </button>
              <button
                onClick={() => setCurrentTab('alerts')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentTab === 'alerts'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Alertas E00</span>
                {activeAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Area: Patient Selector, Quick Encounter, E00 Alerts, Role Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Active Patient Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-slate-300 text-[10px] font-bold">
                  {selectedPatient?.photoUrl ? (
                    <img
                      src={selectedPatient.photoUrl}
                      alt={selectedPatient.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedPatient?.firstName?.[0] || 'P'
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="font-semibold text-slate-200 truncate max-w-[130px]">
                    {selectedPatient?.firstName} {selectedPatient?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {selectedPatient?.cohortCode} · {selectedPatient?.age}a
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showPatientDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-2 z-50">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Seleccionar Paciente Activo
                  </div>
                  <div className="space-y-1 mt-1 max-h-72 overflow-y-auto">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDropdown(false);
                          if (['dashboard', 'patients'].includes(currentTab)) {
                            setCurrentTab('summary');
                          }
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${
                          p.id === selectedPatient?.id
                            ? 'bg-cyan-950 border border-cyan-800 text-white'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs overflow-hidden">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                          ) : (
                            p.firstName[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs text-white truncate">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {p.cohortCode} · {p.age} años · {p.biologicalSex}
                          </p>
                        </div>
                        {p.id === 'PAT-002' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            E00
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowPatientDropdown(false);
                        onOpenNewPatientModal();
                      }}
                      className="w-full py-1.5 px-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Registrar Nuevo Paciente</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Encounter Button */}
            <button
              onClick={onStartEncounter}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Iniciar nuevo encuentro clínico adaptativo"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Consulta</span>
            </button>

            {/* QA Test Suite Button */}
            {onOpenTestSuite && (
              <button
                onClick={onOpenTestSuite}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                title="Ejecutar Suite de Pruebas Clínicas & Auditoría QA"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="inline">Suite QA</span>
              </button>
            )}

            {/* User Profile / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-700 flex items-center justify-center text-[10px] font-bold text-white">
                  {currentUser.name[3] || 'D'}
                </div>
                <span className="hidden xl:inline text-slate-200 font-medium truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-2 z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Cambiar Rol Activo (RBAC)
                  </div>
                  <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          u.id === currentUser.id
                            ? 'bg-cyan-950 border border-cyan-800 text-cyan-200 font-semibold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {u.role} · {u.specialty}
                        </div>
                      </button>
                    ))}
                  </div>

                  {onLogout && (
                    <div className="border-t border-slate-800 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left p-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión / Pantalla de Acceso</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
