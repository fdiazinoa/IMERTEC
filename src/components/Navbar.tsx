import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { ChevronDown, LogOut, Plus, ShieldCheck, UserRound } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewPatientModal: () => void;
  onOpenSafetyModal: () => void;
  onStartEncounter: () => void;
  onOpenTestSuite?: () => void;
  onLogout?: () => void;
}

const patientTabs = [
  'summary', 'timeline', 'history', 'encounters', 'laboratory',
  'documents', 'eci', 'sicbe', 'plan', 'audit',
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewPatientModal,
  onOpenTestSuite,
  onLogout,
}) => {
  const { currentUser, setCurrentUser, availableUsers, alerts } = useClinical();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeAlertsCount = (alerts || []).filter(
    (alert) => !alert.isResolved && alert.status !== 'RESOLVED'
  ).length;

  const navigation = [
    { id: 'dashboard', label: 'Inicio', active: currentTab === 'dashboard' },
    { id: 'patients', label: 'Pacientes', active: currentTab === 'patients' || patientTabs.includes(currentTab) },
    { id: 'alerts', label: 'Alertas', active: currentTab === 'alerts' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setCurrentTab('dashboard')}
          className="mr-1 flex shrink-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          aria-label="Ir al inicio"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-700 text-sm font-black text-white">IM</span>
          <span className="hidden text-left sm:block">
            <span className="block text-base font-bold leading-none text-slate-900">IMERTEC</span>
            <span className="mt-1 block text-[11px] text-slate-500">Atención clínica</span>
          </span>
        </button>

        <nav className="flex flex-1 items-center gap-1" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentTab(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                item.active ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
              {item.id === 'alerts' && activeAlertsCount > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={onOpenNewPatientModal}
          className="hidden items-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-800 lg:flex"
        >
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowUserMenu((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-left hover:bg-slate-50"
            aria-expanded={showUserMenu}
            aria-label="Abrir menú de usuario"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <UserRound className="h-4 w-4" />
            </span>
            <span className="hidden max-w-32 truncate text-xs font-medium text-slate-700 xl:block">{currentUser.name}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-2 pb-2 pt-1">
                <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{currentUser.specialty}</p>
              </div>

              <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cambiar perfil</p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { setCurrentUser(user); setShowUserMenu(false); }}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      user.id === currentUser.id ? 'bg-cyan-50 font-semibold text-cyan-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-slate-900">{user.name}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{user.role}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); onOpenNewPatientModal(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 lg:hidden"
                >
                  <Plus className="h-4 w-4" /> Nuevo paciente
                </button>
                {onOpenTestSuite && (
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); onOpenTestSuite(); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <ShieldCheck className="h-4 w-4" /> Herramientas de verificación
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
