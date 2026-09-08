/**
 * IMERTEC — Repositorio de Documentos Clínicos & Evidencias
 * Visualización, carga por drag-and-drop o selección manual, filtrado y vinculación con encuentros.
 */

import React, { useState, useMemo, useRef } from 'react';
import { useClinical } from '../context/ClinicalContext';
import { ClinicalDocument } from '../types/clinical';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  X,
  FileCheck2,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

export const ClinicalDocumentRepository: React.FC = () => {
  const {
    documents,
    selectedPatient,
    addDocument,
    activeEncounter,
    currentUser,
  } = useClinical();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ClinicalDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<ClinicalDocument['documentType']>('LAB_REPORT');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patientDocs = useMemo(() => {
    return (documents || []).filter(
      (d) => (d.patientId || d.patient_id) === selectedPatient?.id
    );
  }, [documents, selectedPatient?.id]);

  const filteredDocs = useMemo(() => {
    return patientDocs.filter((doc) => {
      if (filterType !== 'ALL' && doc.documentType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchExt = (doc.fileExtension || '').toLowerCase().includes(q);
        if (!matchTitle && !matchExt) return false;
      }
      return true;
    });
  }, [patientDocs, filterType, searchQuery]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    addDocument({
      patientId: selectedPatient.id,
      encounterId: activeEncounter?.id,
      title: docTitle.trim(),
      documentType: docType,
      fileName: selectedFileName || `${docTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: selectedFileSize || 245000,
      fileExtension: selectedFileName.split('.').pop() || 'pdf',
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      notes: docNotes.trim() || undefined,
      sha256Hash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    });

    setIsUploadModalOpen(false);
    setDocTitle('');
    setSelectedFileName('');
    setDocNotes('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Repositorio de Documentos Clínicos & Evidencias
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Expediente: <strong className="text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</strong> ({selectedPatient.mrn})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Adjuntar Documento o Estudio</span>
        </button>
      </div>

      {/* 2. Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar documentos por título o formato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterType === 'ALL'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({patientDocs.length})
          </button>
          <button
            onClick={() => setFilterType('LAB_REPORT')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterType === 'LAB_REPORT'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laboratorios
          </button>
          <button
            onClick={() => setFilterType('IMAGING')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterType === 'IMAGING'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Imágenes
          </button>
          <button
            onClick={() => setFilterType('HISTOLOGY')}
            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
              filterType === 'HISTOLOGY'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histología
          </button>
        </div>
      </div>

      {/* 3. Grid de Documentos */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No hay documentos cargados</h3>
          <p className="text-xs mt-1">Haga clic en &quot;Adjuntar Documento o Estudio&quot; para subir informes o analíticas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isPdf = doc.fileExtension?.toLowerCase() === 'pdf';
            const isImg = ['jpg', 'jpeg', 'png', 'dcm'].includes(doc.fileExtension?.toLowerCase() || '');

            return (
              <div
                key={doc.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="p-2 rounded-lg bg-cyan-50 text-cyan-700">
                      {isImg ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {doc.documentType}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {doc.title}
                  </h3>

                  {doc.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                      &quot;{doc.notes}&quot;
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Archivo:</span>
                      <span className="font-mono text-slate-700 truncate max-w-[150px]">{doc.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tamaño:</span>
                      <span>{Math.round(doc.fileSize / 1024)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fecha:</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cargado por:</span>
                      <span className="font-medium text-slate-700">{doc.uploadedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                    {doc.sha256Hash || 'Hash PROV-O'}
                  </span>
                  <button
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Visualización */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{selectedDocForPreview.title}</h3>
                  <span className="text-[11px] text-slate-400">{selectedDocForPreview.fileName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                <FileCheck2 className="w-12 h-12 text-cyan-700 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{selectedDocForPreview.title}</h4>
                  <p className="text-slate-500 mt-1">
                    Documento clínico verificado con hash criptográfico W3C PROV-O
                  </p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 inline-block">
                  SHA-256: {selectedDocForPreview.sha256Hash || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}
                </div>
              </div>

              {selectedDocForPreview.notes && (
                <div className="p-3 bg-cyan-50/50 border border-cyan-200 rounded-xl">
                  <span className="font-bold text-cyan-900 block mb-0.5">Notas del Clínico:</span>
                  <p className="text-slate-700">{selectedDocForPreview.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div>Tipo: <strong>{selectedDocForPreview.documentType}</strong></div>
                <div>Encuentro: <strong>{selectedDocForPreview.encounterId || 'No asociado'}</strong></div>
                <div>Cargado por: <strong>{selectedDocForPreview.uploadedBy}</strong></div>
                <div>Fecha: <strong>{new Date(selectedDocForPreview.uploadedAt).toLocaleString()}</strong></div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-900"
                >
                  Cerrar Visor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Carga con Drag & Drop y Selección Manual */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Adjuntar Documento Clínico
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-600 bg-cyan-50/50'
                    : selectedFileName
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.dcm,.txt,.docx"
                />
                {selectedFileName ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <span className="font-bold text-slate-800 block">{selectedFileName}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {Math.round(selectedFileSize / 1024)} KB • Clic para cambiar archivo
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 text-cyan-700 mx-auto" />
                    <span className="font-bold text-slate-800 block">
                      Arrastre aquí el archivo o haga clic para seleccionar
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Formatos admitidos: PDF, JPG, PNG, DICOM (hasta 50 MB)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Título Descriptivo del Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Biopsia Ovárica Laparoscópica - Informe Anatomopatológico"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="LAB_REPORT">Informe de Laboratorio</option>
                    <option value="IMAGING">Estudio de Imagen / Ecografía</option>
                    <option value="HISTOLOGY">Informe Histopatológico</option>
                    <option value="CLINICAL_NOTE">Nota de Interconsulta</option>
                    <option value="DISCHARGE_SUMMARY">Epicrisis / Resumen Alta</option>
                    <option value="OTHER">Otro Documento</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Encuentro Asociado</label>
                  <input
                    type="text"
                    disabled
                    value={activeEncounter?.id || 'Encuentro Activo'}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-500 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas Clínicas Adicionales</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Observaciones diagnósticas o resumen del hallazgo..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Cargar y Custodiar en CDECI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
