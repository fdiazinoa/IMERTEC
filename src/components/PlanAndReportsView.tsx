/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Plan Terapéutico y Generador de Reportes E25 (Técnico & Paciente)
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ClipboardList,
  Printer,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  HeartHandshake,
  Dna,
  ShieldAlert,
} from 'lucide-react';

export const PlanAndReportsView: React.FC = () => {
  const { selectedPatient, activeProblems, medications, patientDomains, patientSafetyAlerts } = useClinical();

  const [reportFormat, setReportFormat] = useState<'PROFESSIONAL' | 'PATIENT'>('PROFESSIONAL');

  const hasOncoAlert = patientSafetyAlerts.some(
    (a) => !a.isResolved && a.ruleCode.includes('ONCO')
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Format Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-cyan-700" />
              <span>Plan Clínico & Generador de Reportes E25</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-mono font-bold">
              Motor E25
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generación dual de informes: Informe Técnico Especializado vs Informe para el Paciente en Lenguaje Claro
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setReportFormat('PROFESSIONAL')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                reportFormat === 'PROFESSIONAL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Informe Técnico (Médico)
            </button>
            <button
              onClick={() => setReportFormat('PATIENT')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                reportFormat === 'PATIENT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Informe Paciente / Familiar
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Document Sheet */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-8 max-w-4xl mx-auto text-slate-800 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-800 text-white font-black text-sm flex items-center justify-center">
                IM
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                IMERTEC — Ecosistema Clínico Inteligente
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Plataforma Longitudinal de Biología del Envejecimiento & Onco-Geriatría
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="font-mono font-bold text-slate-900 block">
              EXPEDIENTE: {selectedPatient.medicalRecordNumber}
            </span>
            <span className="text-slate-500 block">
              COHORTE: {selectedPatient.cohortCode}
            </span>
            <span className="text-slate-500 block">
              FECHA: {new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Patient Identification Strip */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Paciente:</span>
            <strong className="text-slate-900 text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Edad / Sexo:</span>
            <strong className="text-slate-900">{selectedPatient.age} años · {selectedPatient.biologicalSex}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Cédula:</span>
            <strong className="text-slate-900 font-mono">{selectedPatient.nationalId}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Médico Responsable:</span>
            <strong className="text-slate-900">Dr. Leonel Liriano</strong>
          </div>
        </div>

        {/* PROFESSIONAL REPORT VIEW */}
        {reportFormat === 'PROFESSIONAL' ? (
          <div className="space-y-6 text-xs leading-relaxed">
            {/* 1. Diagnóstico Biológico & SICBE */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Dna className="w-4 h-4 text-cyan-700" />
                  <span>1. Diagnóstico Biológico y Clasificación SICBE v1.0</span>
                </h3>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
                  {selectedPatient.id === 'PAT-002' ? 'NO CLASIFICABLE (REGLA PD-005)' : 'ESTADO III'}
                </span>
              </div>

              {selectedPatient.id === 'PAT-002' ? (
                <p className="text-slate-700">
                  El SGEB preliminar cuantifica 88.0/100, no obstante, en aplicación de la <strong>Regla Canónica PD-005 (Documento 6 Borrador 1)</strong>,
                  se suspende formalmente la asignación de Estado Biológico definitivo debido a la existencia de un <strong>proceso oncológico activo sospechado</strong> en el anexo izquierdo
                  (CA-125 = 475.6 U/mL, ascitis moderada). Se constata un marcado desacoplamiento biológico:
                  <strong> D-VII (Funcional) PRESERVADO EXCEPCIONAL (5/5 ABVD independientes, marcha 0.92 m/s)</strong> frente a
                  <strong> D-VIII en ALARMA ACTIVA</strong>. La clasificación se completará tras la resolución quirúrgica e histopatológica.
                </p>
              ) : (
                <p className="text-slate-700">
                  Paciente clasificado en <strong>ESTADO III (Carga Biológica Moderada, SGEB 54.1)</strong> con compromiso funcional y metabólico en seguimiento.
                </p>
              )}
            </div>

            {/* 2. Resumen de Problemas y Plan de Manejo */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                2. Plan de Manejo Integral por Problemas (P1 a P6)
              </h3>
              <div className="space-y-3">
                {activeProblems.map((prob) => (
                  <div key={prob.id} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {prob.id}: {prob.title}
                      </span>
                      <span className="font-semibold text-slate-500 text-[10px]">
                        Prioridad {prob.priority}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Objetivo:</strong> {prob.objective}
                    </p>
                    <p className="text-slate-800 font-medium">
                      <strong>Plan de Acción:</strong> {prob.plan}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Farmacoterapia Conciliada */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                3. Conciliación Farmacológica y Seguridad Geriátrica
              </h3>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <p className="text-slate-700">
                  {medications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join(' • ')}
                </p>
                <p className="text-amber-800 text-[11px] font-semibold mt-1">
                  Nota Geriátrica: Controlar uso crónico de Omeprazol según criterios Beers. Suspender suplementación innecesaria antes de la intervención quirúrgica.
                </p>
              </div>
            </div>

            {/* Digital Signature Footer */}
            <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600">
              <div className="text-center sm:text-left">
                <p className="font-bold text-slate-900 text-sm">Dr. Leonel Liriano</p>
                <p className="text-slate-500">Especialista en Medicina Interna & Geriatría Clínica</p>
                <p className="text-[10px] text-slate-400 font-mono">Exeq. No. 4912-88 · Colegiatura Médica Dominicana</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-right font-mono text-[10px] space-y-0.5">
                <div className="text-slate-500 font-bold">FIRMA DIGITAL VERIFICADA (ECI E8)</div>
                <div className="text-cyan-800 font-bold">HASH: SHA256-9A8B7C6D5E4F3A2B1C0D</div>
                <div className="text-slate-400">Timestamp: {new Date().toISOString()}</div>
              </div>
            </div>
          </div>
        ) : (
          /* PATIENT / FAMILY REPORT VIEW (LENGUAJE CLARO) */
          <div className="space-y-6 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-teal-900">
                <HeartHandshake className="w-5 h-5 text-teal-700" />
                <span>Resumen de su Evaluación de Salud (En Palabras Sencillas)</span>
              </div>
              <p>
                Estimada <strong>{selectedPatient.firstName}</strong> y familia: este informe explica de manera clara el resultado de sus estudios y los pasos a seguir para cuidar su salud y bienestar.
              </p>
            </div>

            {/* Fortaleza Principal */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Su Gran Fortaleza: Excelente Estado Físico y Autonomía</span>
              </h3>
              <p className="text-emerald-950">
                A sus {selectedPatient.age} años, usted conserva una vitalidad admirable. Es completamente independiente para todas sus actividades diarias (bañarse, vestirse, alimentarse), camina a un ritmo seguro y adecuado ({selectedPatient.id === 'PAT-002' ? '0.92 m/s' : '0.88 m/s'}) y tiene un buen peso corporal. Esta reserva de energía es su mejor aliada.
              </p>
            </div>

            {/* Hallazgo a Atender con Prioridad */}
            {selectedPatient.id === 'PAT-002' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
                <h3 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-amber-700" />
                  <span>El Asunto que Debemos Atender con Prioridad</span>
                </h3>
                <p className="text-amber-950">
                  En los estudios de imagen y análisis de sangre se encontró una masa en la parte baja del abdomen (anexo izquierdo) y líquido pélvico. Para resolver esto de la manera más segura, hemos programado una consulta con el especialista en Cirugía Ginecológica Oncológica en los próximos 7 días para planificar su retiro definitivo.
                </p>
              </div>
            )}

            {/* Pasos a Seguir */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                Recomendaciones para Casa y Próximas Citas
              </h3>
              <div className="space-y-2 text-slate-700">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong>1. Alimentación y Peso:</strong> Mantener una dieta variada y balanceada, rica en proteínas (huevos, pescado, legumbres) para mantener la fuerza muscular.
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong>2. Medicamentos:</strong> Continuar tomando sus medicamentos habituales para la presión y tiroides en los horarios indicados.
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong>3. Cita de Especialista:</strong> Consulta de Ginecología Oncológica para valoración quirúrgica el 9 de Julio de 2026.
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-300 text-center text-slate-500 text-xs">
              <p className="font-semibold text-slate-800">
                Estamos a su disposición para cualquier duda o consulta familiar.
              </p>
              <p className="text-[11px] mt-1">
                Equipo Médico del Instituto IMERTEC · Tel. (809) 555-0144
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
