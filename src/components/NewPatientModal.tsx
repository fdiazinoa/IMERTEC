/**
 * IMERTEC — Modal de Admisión y Registro de Nuevo Paciente
 * Conforme a requisitos CDECI, consentimiento informado y auditoría
 */

import React, { useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  X,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose }) => {
  const { addPatient } = useClinical();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('1950-01-01');
  const [biologicalSex, setBiologicalSex] = useState<'Femenino' | 'Masculino' | 'Intersexual'>('Femenino');
  const [nationalId, setNationalId] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Casado/a');
  const [educationLevel, setEducationLevel] = useState('Secundaria');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('Santiago de los Caballeros, RD');
  const [phone, setPhone] = useState('(809) ');
  const [email, setEmail] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Familiar');

  // Consentimientos
  const [consentClinical, setConsentClinical] = useState(true);
  const [consentStorage, setConsentStorage] = useState(true);
  const [consentResearch, setConsentResearch] = useState(true);
  const [consentTelemed, setConsentTelemed] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Cálculo de edad aproximada
  const calculatedAge = Math.max(
    0,
    new Date().getFullYear() - new Date(birthDate).getFullYear()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Nombres y apellidos son campos obligatorios.');
      return;
    }

    if (!nationalId.trim()) {
      setErrorMessage('El documento de identidad nacional (Cédula) es obligatorio.');
      return;
    }

    if (!consentClinical) {
      setErrorMessage('El consentimiento para atención clínica es mandatorio para admitir al paciente.');
      return;
    }

    addPatient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      age: calculatedAge,
      biologicalSex,
      genderIdentity: biologicalSex,
      nationalId: nationalId.trim(),
      maritalStatus,
      educationLevel,
      occupation: occupation.trim() || 'No especificada',
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      emergencyContact: {
        name: emergencyName.trim() || 'No registrado',
        phone: emergencyPhone.trim() || 'No registrado',
        relationship: emergencyRelation,
      },
      consentFlags: {
        clinicalCare: consentClinical,
        imageStorage: consentStorage,
        researchAnonymous: consentResearch,
        teleconsultation: consentTelemed,
      },
      isDemoData: true,
      photoUrl:
        biologicalSex === 'Femenino'
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Admisión y Registro de Paciente
              </h2>
              <p className="text-xs text-slate-400">
                Generación automática de Expediente MRN y Código de Cohorte SICBE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Datos Personales */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              Datos Demográficos & Filiación
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Rosa Margarita"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Peña Grullón"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cédula / Identidad Nacional <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="031-XXXXXXX-X"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha de Nacimiento ({calculatedAge} años) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sexo Biológico <span className="text-red-500">*</span>
                </label>
                <select
                  value={biologicalSex}
                  onChange={(e) => setBiologicalSex(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                >
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Intersexual">Intersexual</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado Civil</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-cyan-600"
                >
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                  <option value="Unión Libre">Unión Libre</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contacto & Ubicación */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              Contacto y Domicilio
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono Principal</label>
                <input
                  type="text"
                  placeholder="(809) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="paciente@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Dirección Residencial</label>
                <input
                  type="text"
                  placeholder="Calle, Número, Sector, Ciudad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              Contacto de Emergencia / Cuidador
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="ej. Carlos Peña"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="(809) 000-0000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parentesco</label>
                <input
                  type="text"
                  placeholder="ej. Hijo/a, Cónyuge"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Consentimientos Informados */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Consentimientos Clínicos e Investigativos (CDECI)
            </h4>
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentClinical}
                  onChange={(e) => setConsentClinical(e.target.checked)}
                  className="rounded text-cyan-700 focus:ring-cyan-600 h-4 w-4"
                />
                <span className="text-slate-700 font-medium">
                  Autorización de atención clínica y registro en expediente electrónico (Mandatorio)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentStorage}
                  onChange={(e) => setConsentStorage(e.target.checked)}
                  className="rounded text-cyan-700 focus:ring-cyan-600 h-4 w-4"
                />
                <span className="text-slate-600">
                  Almacenamiento seguro de imágenes diagnósticas y estudios complementarios
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentResearch}
                  onChange={(e) => setConsentResearch(e.target.checked)}
                  className="rounded text-cyan-700 focus:ring-cyan-600 h-4 w-4"
                />
                <span className="text-slate-600">
                  Uso anonimizado para bioestadística y validación de cohortes de gerociencia
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTelemed}
                  onChange={(e) => setConsentTelemed(e.target.checked)}
                  className="rounded text-cyan-700 focus:ring-cyan-600 h-4 w-4"
                />
                <span className="text-slate-600">
                  Habilitación para teleconsulta y monitoreo ambulatorio
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admitir y Crear Expediente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
