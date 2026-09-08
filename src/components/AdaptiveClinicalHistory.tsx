/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Historia Clínica Adaptativa (MIACI - Módulos M01 a M28)
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Save,
  HelpCircle,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

interface ScreeningItem {
  id: string;
  question: string;
  expandedModuleId: string;
  expandedModuleTitle: string;
  category: string;
  hasTrigger: boolean;
}

export const AdaptiveClinicalHistory: React.FC = () => {
  const { selectedPatient, logAuditEvent } = useClinical();

  const [routeMode, setRouteMode] = useState<'RREI' | 'ULTRARAPIDA'>('RREI');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 17 Preguntas de Cribado de Alto Rendimiento (MIACI RREI)
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, boolean>>({
    Q01: selectedPatient.id === 'PAT-002', // Síntoma activo (distensión abdominal en Casilda)
    Q02: selectedPatient.id === 'PAT-003', // DM2/HTA
    Q03: false,
    Q04: false,
    Q05: selectedPatient.id === 'PAT-002', // Polifarmacia
    Q06: false,
    Q07: false,
    Q08: false,
    Q09: selectedPatient.id === 'PAT-002', // Pérdida de peso previa
    Q10: false,
    Q11: false,
    Q12: false,
    Q13: selectedPatient.id === 'PAT-002', // Vive sola (apoyo familiar diario)
    Q14: false,
    Q15: false,
    Q16: false, // 5/5 ABVD independientes
    Q17: false, // Sin caídas
  });

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    M02: selectedPatient.id === 'PAT-002',
    M06: selectedPatient.id === 'PAT-002',
    M09: selectedPatient.id === 'PAT-002',
    M13: selectedPatient.id === 'PAT-002',
  });

  const screeningItems: ScreeningItem[] = [
    {
      id: 'Q01',
      question: '1. ¿Presenta algún síntoma o molestia física activa en este momento?',
      expandedModuleId: 'M02',
      expandedModuleTitle: 'Módulo 2: Motivo y Caracterización de Síntomas Actuales',
      category: 'Síntomas',
      hasTrigger: true,
    },
    {
      id: 'Q02',
      question: '2. ¿Tiene diagnóstico de hipertensión, diabetes, cardiopatía u otra condición crónica?',
      expandedModuleId: 'M03',
      expandedModuleTitle: 'Módulo 3: Enfermedades Crónicas Preexistentes y Control',
      category: 'Enfermedades',
      hasTrigger: true,
    },
    {
      id: 'Q03',
      question: '3. ¿Ha tenido hospitalizaciones o cirugías en los últimos 12 meses?',
      expandedModuleId: 'M04',
      expandedModuleTitle: 'Módulo 4: Hospitalizaciones y Procedimientos Quirúrgicos',
      category: 'Antecedentes',
      hasTrigger: false,
    },
    {
      id: 'Q04',
      question: '4. ¿Tiene alergias conocidas a medicamentos, alimentos o medios de contraste?',
      expandedModuleId: 'M05',
      expandedModuleTitle: 'Módulo 5: Alergias y Reacciones Adversas Documentadas',
      category: 'Alergias',
      hasTrigger: false,
    },
    {
      id: 'Q05',
      question: '5. ¿Toma 5 o más medicamentos diarios de manera habitual (polifarmacia)?',
      expandedModuleId: 'M06',
      expandedModuleTitle: 'Módulo 6: Conciliación Farmacológica y Criterios Beers',
      category: 'Fármacos',
      hasTrigger: true,
    },
    {
      id: 'Q06',
      question: '6. ¿Consume tabaco, alcohol u otras sustancias tóxicas?',
      expandedModuleId: 'M07',
      expandedModuleTitle: 'Módulo 7: Hábitos Tóxicos y Exposición Ambiental',
      category: 'Hábitos',
      hasTrigger: false,
    },
    {
      id: 'Q07',
      question: '7. ¿Tiene antecedentes familiares de longevidad excepcional o cáncer antes de los 50 años?',
      expandedModuleId: 'M08',
      expandedModuleTitle: 'Módulo 8: Antecedentes Familiares y Heredofamiliares',
      category: 'Genética',
      hasTrigger: false,
    },
    {
      id: 'Q08',
      question: '8. ¿Presenta dificultades para masticar, tragar o problemas odontológicos activos?',
      expandedModuleId: 'M09B',
      expandedModuleTitle: 'Módulo 9B: Salud Bucal y Mecánica de Alimentación',
      category: 'Nutrición',
      hasTrigger: false,
    },
    {
      id: 'Q09',
      question: '9. ¿Ha perdido peso involuntariamente (>3 kg en 3 meses) o disminuido el apetito?',
      expandedModuleId: 'M09',
      expandedModuleTitle: 'Módulo 9: Evaluación Nutricional Detallada (GLIM / ESPEN)',
      category: 'Nutrición',
      hasTrigger: true,
    },
    {
      id: 'Q10',
      question: '10. ¿Pasa la mayor parte del día sentado o realiza menos de 150 min de actividad semanal?',
      expandedModuleId: 'M10',
      expandedModuleTitle: 'Módulo 10: Actividad Física y Conducta Sedentaria',
      category: 'Estilo de vida',
      hasTrigger: false,
    },
    {
      id: 'Q11',
      question: '11. ¿Tiene dificultades para conciliar el sueño, despertares frecuentes o somnolencia diurna?',
      expandedModuleId: 'M11',
      expandedModuleTitle: 'Módulo 11: Calidad del Sueño y Ritmos Circadianos',
      category: 'Sueño',
      hasTrigger: false,
    },
    {
      id: 'Q12',
      question: '12. ¿Se ha sentido desanimado, triste o sin interés por sus actividades habituales?',
      expandedModuleId: 'M12',
      expandedModuleTitle: 'Módulo 12: Estado Emocional, Depresión y Ansiedad',
      category: 'Ánimo',
      hasTrigger: false,
    },
    {
      id: 'Q13',
      question: '13. ¿Vive solo o considera que carece de una red de apoyo familiar/social sólida?',
      expandedModuleId: 'M13',
      expandedModuleTitle: 'Módulo 13: Entorno Social, Cuidador y Red de Apoyo',
      category: 'Social',
      hasTrigger: true,
    },
    {
      id: 'Q14',
      question: '14. ¿Ha notado olvidos frecuentes que interfieran con sus actividades o le preocupen a otros?',
      expandedModuleId: 'M19',
      expandedModuleTitle: 'Módulo 19: Queja Subjetiva de Memoria y Cribado Cognitivo',
      category: 'Cognición',
      hasTrigger: false,
    },
    {
      id: 'Q15',
      question: '15. ¿Siente dolor corporal persistente o de intensidad moderada/severa (>3/10)?',
      expandedModuleId: 'M20',
      expandedModuleTitle: 'Módulo 20: Mapeo y Cuantificación de Dolor Crónico',
      category: 'Dolor',
      hasTrigger: false,
    },
    {
      id: 'Q16',
      question: '16. ¿Requiere ayuda para bañarse, vestirse, comer, asearse o levantarse de la cama?',
      expandedModuleId: 'M16',
      expandedModuleTitle: 'Módulo 16: Autonomía en Actividades Básicas de la Vida Diaria (ABVD)',
      category: 'Funcional',
      hasTrigger: false,
    },
    {
      id: 'Q17',
      question: '17. ¿Ha sufrido caídas en el último año o siente miedo o inseguridad al caminar?',
      expandedModuleId: 'M17',
      expandedModuleTitle: 'Módulo 17: Riesgo de Caídas y Patrón de Marcha',
      category: 'Movilidad',
      hasTrigger: false,
    },
  ];

  const handleToggleScreening = (qId: string, moduleId: string) => {
    const newVal = !screeningAnswers[qId];
    setScreeningAnswers((prev) => ({ ...prev, [qId]: newVal }));

    // Si se activa "Sí", expandir automáticamente el módulo clínico profundo
    if (newVal) {
      setExpandedModules((prev) => ({ ...prev, [moduleId]: true }));
    }
  };

  const handleSaveHistory = () => {
    setSaveSuccess(true);
    logAuditEvent(
      'UPDATE',
      'ClinicalHistory',
      selectedPatient.id,
      `Historia Clínica adaptativa (MIACI RREI) actualizada y sincronizada con ECI`
    );
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector & Status Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-700" />
              <span>Modelo de Información y Adquisición Clínica Inteligente (MIACI)</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">
              v1.2 Adaptativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preguntas de cribado de alto rendimiento que despliegan modularmente solo los módulos con sospecha clínica
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setRouteMode('RREI')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                routeMode === 'RREI'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RREI (Inicial)
            </button>
            <button
              onClick={() => setRouteMode('ULTRARAPIDA')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                routeMode === 'ULTRARAPIDA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ultrarrápida (Seguimiento)
            </button>
          </div>

          <button
            onClick={handleSaveHistory}
            className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar & ECI</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Historia Clínica sincronizada exitosamente en el ECI. Bitácora de auditoría actualizada.</span>
        </div>
      )}

      {/* RREI: 17 Preguntas de Cribado */}
      {routeMode === 'RREI' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>17 Preguntas de Cribado de Alto Rendimiento (RREI)</span>
              </span>
              <span className="text-xs text-slate-500">
                {Object.values(screeningAnswers || {}).filter(Boolean).length} Módulos Activados
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {screeningItems.map((item) => {
                const isChecked = !!screeningAnswers[item.id];
                const isExpanded = !!expandedModules[item.expandedModuleId];

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${
                      isChecked ? 'bg-cyan-50/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={isChecked}
                          onChange={() => handleToggleScreening(item.id, item.expandedModuleId)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <div>
                          <label
                            htmlFor={item.id}
                            className={`text-xs font-medium cursor-pointer ${
                              isChecked ? 'text-slate-900 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {item.question}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              {item.category}
                            </span>
                            {isChecked && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-100 text-cyan-800 font-semibold">
                                Activa {item.expandedModuleId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isChecked && (
                        <button
                          onClick={() =>
                            setExpandedModules((prev) => ({
                              ...prev,
                              [item.expandedModuleId]: !isExpanded,
                            }))
                          }
                          className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-md hover:bg-cyan-100/50"
                        >
                          <span>{isExpanded ? 'Contraer' : 'Expandir'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Módulo Desplegado si isChecked && isExpanded */}
                    {isChecked && isExpanded && (
                      <div className="mt-3 ml-7 p-4 bg-white rounded-lg border border-cyan-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-cyan-900">
                            {item.expandedModuleTitle}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Código Ontológico: {item.expandedModuleId}
                          </span>
                        </div>

                        {/* Contenido según Módulo */}
                        {item.expandedModuleId === 'M02' && (
                          <div className="text-xs space-y-2">
                            <p className="text-slate-600">
                              <strong>Síntoma principal:</strong> Sensación de distensión y plenitud pelviana persistente (2 meses de evolución).
                            </p>
                            <p className="text-slate-600">
                              <strong>Severidad EVA:</strong> 3/10. Sin dolor cólico ni fiebre.
                            </p>
                            <p className="text-slate-600">
                              <strong>Hallazgo correlativo:</strong> Ecografía y TAC contrastada demuestran masa anexial compleja izquierda con líquido libre ascítico.
                            </p>
                          </div>
                        )}

                        {item.expandedModuleId === 'M06' && (
                          <div className="text-xs space-y-2">
                            <p className="text-slate-600">
                              <strong>Fármacos activos verificados:</strong> Losartán 50mg, Levotiroxina 50mcg, Omeprazol 20mg, Calcio + Vitamina D3, Atorvastatina 20mg.
                            </p>
                            <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                              <strong>Alerta de conciliación:</strong> Polifarmacia menor (5 principios activos). Se recomienda desprescribir Omeprazol si no hay reflujo activo según criterios Beers.
                            </div>
                          </div>
                        )}

                        {item.expandedModuleId === 'M09' && (
                          <div className="text-xs space-y-2">
                            <p className="text-slate-600">
                              <strong>Pérdida ponderal previa:</strong> Disminución involuntaria de peso en primavera 2026 (descenso de 135 a 120 lbs).
                            </p>
                            <p className="text-slate-600">
                              <strong>Evolución actual:</strong> Recuperación favorable en Julio 2026 alcanzando 135 lbs (61.2 kg) con IMC = 25.1 kg/m². Apetito conservado.
                            </p>
                          </div>
                        )}

                        {item.expandedModuleId === 'M13' && (
                          <div className="text-xs space-y-2">
                            <p className="text-slate-600">
                              <strong>Vivienda:</strong> Vive sola en vivienda unifamiliar adecuada, con excelente red de apoyo familiar (hija y nietos con visita y contacto diario).
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Ruta Ultrarrápida de Seguimiento */
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-700" />
            <span>Ruta Ultrarrápida de Seguimiento (10 Áreas de Verificación)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'F01', area: '1. Nuevos síntomas o quejas agudas', status: 'Sin cambios' },
              { id: 'F02', area: '2. Hospitalizaciones o eventos graves recientes', status: 'Sin cambios' },
              { id: 'F03', area: '3. Modificaciones en fármacos prescritos', status: 'Revisado' },
              { id: 'F04', area: '4. Pérdida de peso involuntaria o inapetencia', status: 'Mejoría / Estable' },
              { id: 'F05', area: '5. Caídas o tropiezos en el periodo', status: 'Sin caídas' },
              { id: 'F06', area: '6. Pérdida de autonomía para vestirse/bañarse', status: '100% Independiente' },
              { id: 'F07', area: '7. Deterioro cognitivo o de memoria evidente', status: 'Conservado' },
              { id: 'F08', area: '8. Dolor corporal limitante', status: 'Sin dolor agudo' },
              { id: 'F09', area: '9. Ánimo deprimido o desesperanza', status: 'Estable' },
              { id: 'F10', area: '10. Adherencia al plan terapéutico acordado', status: 'Óptima' },
            ].map((item) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800">{item.area}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
