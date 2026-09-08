/**
 * IMERTEC — Banco de Trabajo de Laboratorio & Bioquímica
 * Registro manual de analíticas, validación contra rangos DMV, semáforo de referencia y vinculación a encuentros.
 */

import React, { useState, useMemo } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { LaboratoryResult } from '../types/clinical';
import { DMV_VARIABLES } from '../data/dmvData';
import {
  TestTube2,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const LaboratoryWorkbench: React.FC = () => {
  const {
    laboratories,
    selectedPatient,
    addLaboratoryResult,
    currentUser,
    activeEncounter,
  } = useClinical();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPanel, setFilterPanel] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal State
  const [selectedDmvId, setSelectedDmvId] = useState('DMV-0010'); // CA-125 default
  const [testValue, setTestValue] = useState('');
  const [customTestName, setCustomTestName] = useState('');
  const [testUnit, setTestUnit] = useState('');
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().split('T')[0]);
  const [labName, setLabName] = useState('Laboratorio Central Referencia');

  // Filtrar analíticas del paciente seleccionado
  const patientLabs = useMemo(() => {
    return (laboratories || []).filter(
      (l) => (l.patientId || l.patient_id) === selectedPatient?.id
    );
  }, [laboratories, selectedPatient?.id]);

  const filteredLabs = useMemo(() => {
    return patientLabs.filter((lab) => {
      if (filterPanel !== 'ALL' && lab.panel !== filterPanel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (lab.testName || '').toLowerCase().includes(q);
        const matchCode = (lab.canonicalVariableId || '').toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [patientLabs, filterPanel, searchQuery]);

  const panels = useMemo(() => {
    const setP = new Set<string>();
    patientLabs.forEach((l) => {
      if (l.panel) setP.add(l.panel);
    });
    return Array.from(setP);
  }, [patientLabs]);

  // Handle DMV variable change in modal
  const handleDmvSelect = (id: string) => {
    setSelectedDmvId(id);
    const dmv = DMV_VARIABLES.find((v) => v.id === id);
    if (dmv) {
      setCustomTestName(dmv.name);
      setTestUnit(dmv.canonicalUnit);
    }
  };

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    const dmv = DMV_VARIABLES.find((v) => v.id === selectedDmvId);

    const valNum = Number(testValue);
    let isOutOfRange = false;
    let interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' = 'NORMAL';

    if (dmv?.referenceRange) {
      if (dmv.referenceRange.max !== undefined && valNum > dmv.referenceRange.max) {
        isOutOfRange = true;
        interpretation = valNum > dmv.referenceRange.max * 2 ? 'CRITICAL' : 'HIGH';
      } else if (dmv.referenceRange.min !== undefined && valNum < dmv.referenceRange.min) {
        isOutOfRange = true;
        interpretation = 'LOW';
      }
    }

    addLaboratoryResult({
      patientId: selectedPatient.id,
      encounterId: activeEncounter?.id,
      canonicalVariableId: dmv?.id || selectedDmvId,
      testName: customTestName || dmv?.name || 'Analítica de Laboratorio',
      value: valNum,
      unit: testUnit || dmv?.canonicalUnit || '',
      referenceRange: dmv?.referenceRange
        ? `${dmv.referenceRange.min ?? '-'} - ${dmv.referenceRange.max ?? '-'}`
        : undefined,
      isOutOfRange,
      interpretation,
      sampleDate,
      resultDate: new Date().toISOString(),
      panel: dmv?.category || 'Bioquímica',
      status: 'FINAL',
      laboratoryName: labName,
    });

    setIsAddModalOpen(false);
    setTestValue('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <TestTube2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Banco de Datos de Laboratorio & Bioquímica
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Paciente: <strong className="text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.id} • {selectedPatient.cohortCode})
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            handleDmvSelect('DMV-0010');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ingresar Resultado de Laboratorio</span>
        </button>
      </div>

      {/* 2. Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar analítica por nombre o código DMV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterPanel('ALL')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterPanel === 'ALL'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({patientLabs.length})
          </button>
          {panels.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPanel(p)}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                filterPanel === p
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tabla de Resultados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Analítica / Prueba</th>
                <th className="px-4 py-3">Variable DMV</th>
                <th className="px-4 py-3">Panel</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Rango Referencial</th>
                <th className="px-4 py-3">Interpretación</th>
                <th className="px-4 py-3">Fecha Muestra</th>
                <th className="px-4 py-3">Laboratorio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLabs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No hay resultados de laboratorio registrados para este criterio.
                  </td>
                </tr>
              ) : (
                filteredLabs.map((lab) => {
                  return (
                    <tr key={lab.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {lab.testName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-cyan-800 font-semibold">
                        {lab.canonicalVariableId || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {lab.panel || 'Bioquímica'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-sm">
                        {lab.value} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {lab.referenceRange || 'Ver técnica'}
                      </td>
                      <td className="px-4 py-3.5">
                        {lab.isOutOfRange ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              lab.interpretation === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {lab.interpretation || 'FUERA DE RANGO'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {lab.sampleDate}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {lab.laboratoryName || 'Central'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal de Nuevo Resultado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TestTube2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Ingreso de Resultado de Laboratorio
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="p-6 space-y-4 text-xs">
              {/* Selección de variable DMV */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Variable Canónica DMV <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDmvId}
                  onChange={(e) => handleDmvSelect(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white"
                >
                  {DMV_VARIABLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} - {v.name} ({v.canonicalUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Valor Medido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    placeholder="ej. 475.6"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={testUnit}
                    onChange={(e) => setTestUnit(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Toma</label>
                  <input
                    type="date"
                    value={sampleDate}
                    onChange={(e) => setSampleDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Laboratorio Emisor</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Resultado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
