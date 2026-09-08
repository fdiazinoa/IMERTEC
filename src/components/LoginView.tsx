/**
 * IMERTEC — Módulo de Autenticación, Control de Acceso (RBAC) y Seguridad
 * FASE 2: MVP Clínico Funcional
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types/clinical';

export const LoginView: React.FC = () => {
  const { availableUsers, login, switchUser, requestPasswordRecovery } = useClinical();

  const [email, setEmail] = useState('dr.liriano@imertec.org');
  const [password, setPassword] = useState('••••••••••••');
  const [errorMessage, setErrorMessage] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const success = login(email);
    if (!success) {
      setErrorMessage('Credenciales institucionales no encontradas en el directorio CDECI.');
    }
  };

  const handleRoleQuickSwitch = (userId: string) => {
    switchUser(userId);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    const msg = requestPasswordRecovery(recoveryEmail);
    setRecoveryMessage(msg);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SCIENTIFIC_ADMIN':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PHYSICIAN':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'NURSE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'TECHNICIAN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-700 text-white shadow-lg mb-4 ring-4 ring-cyan-500/20">
          <Activity className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          IMERTEC
        </h2>
        <p className="mt-1 text-sm text-cyan-300 font-medium">
          Ecosistema Clínico Inteligente — MVP Fase 2
        </p>
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
          Autenticación médica segura, control de acceso basado en roles (RBAC) y auditoría inmutable.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico Institucional
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@imertec.org"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Contraseña de Seguridad
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryModalOpen(true)}
                  className="text-xs text-cyan-700 hover:text-cyan-900 font-medium cursor-pointer"
                >
                  ¿Olvidó contraseña?
                </button>
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-600 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Iniciar Sesión Segura
            </button>
          </form>

          {/* Selector Rápido de Roles para Evaluación & Demo */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-cyan-600" />
                Acceso Rápido por Rol Clínico (Demostración)
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-sm">
                RBAC v2.2
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Seleccione un perfil para acceder instantáneamente a la plataforma con los permisos correspondientes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleRoleQuickSwitch(user.id)}
                  className="flex items-start text-left p-2.5 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all cursor-pointer group"
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-cyan-100 text-slate-700 group-hover:text-cyan-800 flex items-center justify-center font-bold text-xs mr-2.5">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-600" />
                Recuperación de Credenciales
              </h3>
              <button
                onClick={() => {
                  setIsRecoveryModalOpen(false);
                  setRecoveryMessage('');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {recoveryMessage ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Instrucciones enviadas
                </div>
                {recoveryMessage}
                <button
                  onClick={() => {
                    setIsRecoveryModalOpen(false);
                    setRecoveryMessage('');
                  }}
                  className="mt-4 w-full py-2 bg-emerald-700 text-white font-semibold rounded-lg text-xs hover:bg-emerald-800 cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Ingrese su correo electrónico institucional registrado en CDECI. El sistema de auditoría registrará la solicitud de reseteo.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    placeholder="dr.liriano@imertec.org"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 text-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg cursor-pointer shadow-xs"
                  >
                    Enviar Enlace Seguro
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
