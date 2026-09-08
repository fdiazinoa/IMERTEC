/**
 * IMERTEC — Directorio y Gestión de Pacientes de la Cohorte
 * Vistas de Tarjetas y Tabla, Filtros por Estado Clínico, Búsqueda en tiempo real y Edición Auditada.
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { Patient } from '../types/clinical';
import {
  Search,
  Plus,
  ShieldAlert,
  Calendar,
  Eye,
  FileText,
  Filter,
  UserCheck,
  TrendingDown,
  TrendingUp,
  Edit2,
  Stethoscope,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';

interface PatientListProps {
  onSelectPatient: (id: string, tab?: string) => void;
  onOpenNewPatientModal: () => void;
  onStartEncounter: () => void;
  onEditPatient?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onSelectPatient,
  onOpenNewPatientModal,
  onStartEncounter,
  onEditPatient,
}) => {
  const {
    patients,
    selectedPatient,
    setSelectedPatient,
    alerts,
  } = useClinical();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  const filteredPatients = useMemo(() => {
    return (patients || []).filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.cohortCode || '').toLowerCase().includes(q) ||
        (p.nationalId || '').includes(q) ||
        (p.mrn || p.medicalRecordNumber || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterState === 'ALL') return true;
      if (filterState === 'CRITICAL') {
        return (alerts || []).some(
          (a) =>
            (a.patientId === p.id || a.patient_id === p.id) &&
            a.status === 'ACTIVE' &&
            (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL' || a.severity === 'HIGH')
        );
      }
      if (filterState === 'ALERTS') {
        return (alerts || []).some(
          (a) => (a.patientId === p.id || a.patient_id === p.id) && a.status === 'ACTIVE'
        );
      }
      if (filterState === 'FEMALE') return p.biologicalSex === 'Femenino';
      if (filterState === 'MALE') return p.biologicalSex === 'Masculino';

      return true;
    });
  }, [patients, searchTerm, filterState, alerts]);

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, expediente, cédula o cohorte (ej: Casilda, PAT-002, SICBE-PILOT)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
          />
        </div>

        {/* View Switcher & Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'GRID' ? 'bg-white text-cyan-800 shadow-2xs' : 'text-slate-500'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'TABLE' ? 'bg-white text-cyan-800 shadow-2xs' : 'text-slate-500'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setFilterState('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterState === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({patients.length})
          </button>
          <button
            onClick={() => setFilterState('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              filterState === 'CRITICAL'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Alertas Críticas
          </button>

          <button
            onClick={onOpenNewPatientModal}
            className="bg-cyan-700 hover:bg-cyan-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((p) => {
            const hasCritical = (alerts || []).some(
              (a) =>
                (a.patientId === p.id || a.patient_id === p.id) &&
                a.status === 'ACTIVE' &&
                (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL' || a.severity === 'HIGH')
            );
            const isSelected = p.id === selectedPatient?.id;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-cyan-600 ring-2 ring-cyan-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-base shrink-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                        ) : (
                          p.firstName[0]
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-sm">
                            {p.firstName} {p.lastName}
                          </h3>
                          {p.isDemoData && (
                            <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded border border-slate-200">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                          <span>{p.cohortCode}</span>
                          <span>•</span>
                          <span>{p.age} años</span>
                          <span>•</span>
                          <span>{p.biologicalSex}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasCritical && (
                        <span className="p-1.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200" title="Alerta Crítica E00 Activa">
                          <ShieldAlert className="w-4 h-4" />
                        </span>
                      )}
                      {onEditPatient && (
                        <button
                          onClick={() => onEditPatient(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Editar Paciente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Estado SICBE:</span>
                    {p.id === 'PAT-002' ? (
                      <span className="font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[11px]">
                        No Clasificable (PD-005)
                      </span>
                    ) : p.id === 'PAT-003' || p.id === 'PAT-005' ? (
                      <span className="font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                        Estado III (Comprometido)
                      </span>
                    ) : (
                      <span className="font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                        Estado I (Preservado)
                      </span>
                    )}
                  </div>

                  {/* Key Details */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expediente:</span>
                      <span className="font-mono font-medium text-slate-700">{p.mrn || p.medicalRecordNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cédula:</span>
                      <span className="font-mono font-medium text-slate-700">{p.nationalId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dirección:</span>
                      <span className="truncate max-w-[170px] text-slate-700">{p.address}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      onSelectPatient(p.id, 'summary');
                    }}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      onSelectPatient(p.id, 'timeline');
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Timeline longitudinal"
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      onStartEncounter();
                    }}
                    className="bg-cyan-700 hover:bg-cyan-800 text-white py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    title="Iniciar Consulta"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Consulta</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-4 py-3">Expediente (MRN)</th>
                  <th className="px-4 py-3">Cohorte</th>
                  <th className="px-4 py-3">Edad / Sexo</th>
                  <th className="px-4 py-3">Cédula</th>
                  <th className="px-4 py-3">Alertas E00</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => {
                  const hasCritical = (alerts || []).some(
                    (a) =>
                      (a.patientId === p.id || a.patient_id === p.id) &&
                      a.status === 'ACTIVE' &&
                      (a.severity === 'ROJO_CRITICO' || a.severity === 'CRITICAL' || a.severity === 'HIGH')
                  );
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <span>{p.firstName} {p.lastName}</span>
                        {p.isDemoData && (
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded border">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">{p.mrn || p.medicalRecordNumber}</td>
                      <td className="px-4 py-3.5 font-mono text-cyan-800 font-semibold">{p.cohortCode}</td>
                      <td className="px-4 py-3.5 text-slate-600">{p.age} años • {p.biologicalSex}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{p.nationalId}</td>
                      <td className="px-4 py-3.5">
                        {hasCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                            <ShieldAlert className="w-3 h-3" />
                            CRÍTICA
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedPatient(p);
                            onSelectPatient(p.id, 'summary');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(p);
                            onStartEncounter();
                          }}
                          className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Atender
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
