/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Vista de Auditoría y Trazabilidad Inmutable (W3C PROV-O)
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileCheck2,
  Lock,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useClinical();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = (auditLogs || []).filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  const exportAuditJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(auditLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `IMERTEC-AUDIT-LOG-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-700" />
              <span>Bitácora de Auditoría Clínica & Trazabilidad (PROV-O)</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Append-Only Inmutable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico de todas las mutaciones de datos, inferencias de motores, resoluciones de alertas E00 y overrides médicos
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en la bitácora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas las Acciones</option>
            <option value="CREATE">Creaciones (CREATE)</option>
            <option value="UPDATE">Modificaciones (UPDATE)</option>
            <option value="OVERRIDE">Overrides Médicos</option>
            <option value="RESOLVE_ALERT">Resoluciones de Alerta E00</option>
            <option value="SIGN_ENCOUNTER">Firmas & Sellados</option>
          </select>

          <button
            onClick={exportAuditJson}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp / ID</th>
                <th className="py-3 px-3 font-semibold">Usuario & Rol</th>
                <th className="py-3 px-3 font-semibold">Acción</th>
                <th className="py-3 px-3 font-semibold">Entidad / Ref</th>
                <th className="py-3 px-4 font-semibold">Detalles de Operación</th>
                <th className="py-3 px-3 font-semibold text-right">Valores / Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => {
                const isOverride = log.action === 'OVERRIDE';
                const isResolve = log.action === 'RESOLVE_ALERT';
                const isSign = log.action === 'SIGN_ENCOUNTER';

                return (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isOverride
                        ? 'bg-purple-50/50 hover:bg-purple-100/50'
                        : isResolve
                        ? 'bg-rose-50/40 hover:bg-rose-100/40'
                        : isSign
                        ? 'bg-emerald-50/40 hover:bg-emerald-100/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-semibold">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.id}</div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.userRole}</div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          isOverride
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : isResolve
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : isSign
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      <div>{log.entity}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.entityId}</div>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-800 leading-snug">
                      {log.details}
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      {log.previousValue || log.newValue ? (
                        <div className="text-[11px]">
                          <span className="text-slate-400 line-through mr-1">{log.previousValue}</span>
                          <span className="text-emerald-700 font-bold">{log.newValue}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                      {log.reason && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          "{log.reason}"
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
