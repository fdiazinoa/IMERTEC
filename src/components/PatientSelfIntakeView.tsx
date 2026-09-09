import React, { useMemo, useState } from 'react';
import { useClinical } from '../context/ClinicalContext';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HeartPulse,
  HelpCircle,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

interface PatientSelfIntakeViewProps {
  onExit: () => void;
  onComplete: (patientId: string) => void;
}

const steps = [
  { title: 'Datos personales', help: 'Escribe tus datos exactamente como aparecen en tu documento de identidad.' },
  { title: 'Contacto', help: 'Usaremos estos datos solamente para coordinar tu atención.' },
  { title: 'Salud actual', help: 'No necesitas usar términos médicos. Describe con tus propias palabras lo que recuerdes.' },
  { title: 'Persona de apoyo', help: 'Indica a quién podemos contactar si necesitas ayuda durante tu atención.' },
  { title: 'Revisar y enviar', help: 'Confirma que la información esté correcta antes de enviarla al equipo clínico.' },
];

const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';
const labelClass = 'block text-sm font-semibold text-slate-700';

export const PatientSelfIntakeView: React.FC<PatientSelfIntakeViewProps> = ({ onExit, onComplete }) => {
  const { addPatient } = useClinical();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submittedPatientId, setSubmittedPatientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    biologicalSex: 'Femenino' as 'Femenino' | 'Masculino' | 'Intersexual',
    nationalId: '',
    maritalStatus: 'Soltero/a',
    educationLevel: 'Secundaria',
    occupation: '',
    phone: '',
    email: '',
    address: '',
    conditions: '',
    medications: '',
    allergies: '',
    reasonForVisit: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    consentClinical: false,
    confirmAccuracy: false,
  });

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const age = useMemo(() => {
    if (!form.birthDate) return 0;
    const birth = new Date(`${form.birthDate}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) years -= 1;
    return Math.max(0, years);
  }, [form.birthDate]);

  const validateCurrentStep = () => {
    if (step === 0 && (!form.firstName.trim() || !form.lastName.trim() || !form.birthDate || !form.nationalId.trim())) {
      return 'Completa nombre, apellidos, fecha de nacimiento y documento de identidad.';
    }
    if (step === 1 && (!form.phone.trim() || !form.address.trim())) {
      return 'Indica al menos un teléfono y tu dirección.';
    }
    if (step === 2 && !form.reasonForVisit.trim()) {
      return 'Cuéntanos brevemente por qué deseas recibir atención.';
    }
    if (step === 3 && (!form.emergencyName.trim() || !form.emergencyPhone.trim() || !form.emergencyRelationship.trim())) {
      return 'Completa los datos de una persona de apoyo.';
    }
    if (step === 4 && (!form.consentClinical || !form.confirmAccuracy)) {
      return 'Debes autorizar la atención y confirmar que revisaste la información.';
    }
    return '';
  };

  const goNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    const patient = addPatient({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthDate: form.birthDate,
      age,
      biologicalSex: form.biologicalSex,
      genderIdentity: form.biologicalSex,
      nationalId: form.nationalId.trim(),
      maritalStatus: form.maritalStatus,
      educationLevel: form.educationLevel,
      occupation: form.occupation.trim() || 'No especificada',
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      emergencyContact: {
        name: form.emergencyName.trim(),
        phone: form.emergencyPhone.trim(),
        relationship: form.emergencyRelationship.trim(),
      },
      consentFlags: {
        clinicalCare: form.consentClinical,
        imageStorage: false,
        researchAnonymous: false,
        teleconsultation: false,
      },
      notes: [
        `Motivo de atención referido por el paciente: ${form.reasonForVisit.trim()}`,
        `Condiciones referidas: ${form.conditions.trim() || 'No refiere'}`,
        `Medicamentos referidos: ${form.medications.trim() || 'No refiere'}`,
        `Alergias referidas: ${form.allergies.trim() || 'No refiere'}`,
        'Ficha autoguiada completada por el paciente; información pendiente de validación clínica.',
      ].join('\n'),
      isDemoData: true,
    });

    setSubmittedPatientId(patient.id);
  };

  if (submittedPatientId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Tu ficha fue enviada</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            El equipo clínico revisará la información contigo antes de incorporarla como información confirmada en tu expediente.
          </p>
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Código de recepción: <strong className="text-slate-800">{submittedPatientId}</strong>
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => onComplete(submittedPatientId)}
              className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Ver ficha registrada
            </button>
            <button type="button" onClick={onExit} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white"><HeartPulse className="h-5 w-5" /></span>
            <div>
              <p className="font-bold text-slate-900">Ficha del paciente</p>
              <p className="text-xs text-slate-500">Te acompañamos paso a paso</p>
            </div>
          </div>
          <button type="button" onClick={onExit} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Cerrar ficha">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Paso {step + 1} de {steps.length}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-5 space-y-3">
            {steps.map((item, index) => (
              <li key={item.title} className={`flex items-center gap-2 text-xs ${index === step ? 'font-semibold text-cyan-800' : index < step ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${index === step ? 'bg-cyan-100' : index < step ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {item.title}
              </li>
            ))}
          </ol>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><UserRound className="h-5 w-5" /></span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{steps[step].title}</h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{steps[step].help}</p>
            </div>
          </div>

          {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6">
            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Nombres *<input className={inputClass} value={form.firstName} onChange={(event) => update('firstName', event.target.value)} autoFocus /></label>
                <label className={labelClass}>Apellidos *<input className={inputClass} value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label>
                <label className={labelClass}>Fecha de nacimiento *<input type="date" className={inputClass} value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} /></label>
                <label className={labelClass}>Sexo biológico *<select className={inputClass} value={form.biologicalSex} onChange={(event) => update('biologicalSex', event.target.value)}><option>Femenino</option><option>Masculino</option><option>Intersexual</option></select></label>
                <label className={labelClass}>Cédula o documento de identidad *<input className={inputClass} value={form.nationalId} onChange={(event) => update('nationalId', event.target.value)} placeholder="Ej. 000-0000000-0" /></label>
                <label className={labelClass}>Estado civil<select className={inputClass} value={form.maritalStatus} onChange={(event) => update('maritalStatus', event.target.value)}><option>Soltero/a</option><option>Casado/a</option><option>Unión libre</option><option>Divorciado/a</option><option>Viudo/a</option></select></label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Teléfono *<input type="tel" className={inputClass} value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="(809) 000-0000" /></label>
                <label className={labelClass}>Correo electrónico<input type="email" className={inputClass} value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
                <label className={`${labelClass} sm:col-span-2`}>Dirección *<input className={inputClass} value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Calle, número, sector y ciudad" /></label>
                <label className={labelClass}>Ocupación<input className={inputClass} value={form.occupation} onChange={(event) => update('occupation', event.target.value)} /></label>
                <label className={labelClass}>Nivel educativo<select className={inputClass} value={form.educationLevel} onChange={(event) => update('educationLevel', event.target.value)}><option>Primaria</option><option>Secundaria</option><option>Técnico</option><option>Universitario</option><option>Posgrado</option><option>Prefiero no responder</option></select></label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <label className={labelClass}>¿Por qué deseas recibir atención? *<textarea rows={3} className={inputClass} value={form.reasonForVisit} onChange={(event) => update('reasonForVisit', event.target.value)} placeholder="Cuéntanos qué sientes o qué deseas evaluar" /></label>
                <label className={labelClass}>Enfermedades o condiciones conocidas<textarea rows={2} className={inputClass} value={form.conditions} onChange={(event) => update('conditions', event.target.value)} placeholder="Ej. presión alta, diabetes. Si no tienes, escribe Ninguna" /></label>
                <label className={labelClass}>Medicamentos que utilizas<textarea rows={2} className={inputClass} value={form.medications} onChange={(event) => update('medications', event.target.value)} placeholder="Nombre y dosis si la recuerdas" /></label>
                <label className={labelClass}>Alergias conocidas<textarea rows={2} className={inputClass} value={form.allergies} onChange={(event) => update('allergies', event.target.value)} placeholder="Medicamentos, alimentos u otras alergias" /></label>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Nombre completo *<input className={inputClass} value={form.emergencyName} onChange={(event) => update('emergencyName', event.target.value)} /></label>
                <label className={labelClass}>Parentesco *<input className={inputClass} value={form.emergencyRelationship} onChange={(event) => update('emergencyRelationship', event.target.value)} placeholder="Ej. hija, esposo, hermana" /></label>
                <label className={labelClass}>Teléfono *<input type="tel" className={inputClass} value={form.emergencyPhone} onChange={(event) => update('emergencyPhone', event.target.value)} /></label>
                <div className="rounded-xl bg-cyan-50 p-4 text-sm leading-relaxed text-cyan-900">
                  <HelpCircle className="mb-2 h-5 w-5" /> Esta persona solo será contactada cuando sea necesario para tu atención.
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p><strong>{form.firstName} {form.lastName}</strong> · {age} años</p>
                  <p className="mt-1">{form.phone} · {form.email || 'Sin correo indicado'}</p>
                  <p className="mt-1">Motivo: {form.reasonForVisit}</p>
                  <button type="button" onClick={() => setStep(0)} className="mt-3 text-xs font-semibold text-cyan-700">Corregir información</button>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" checked={form.consentClinical} onChange={(event) => update('consentClinical', event.target.checked)} />
                  <span className="text-sm text-slate-700">Autorizo el registro de estos datos para coordinar y prestar mi atención clínica.</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" checked={form.confirmAccuracy} onChange={(event) => update('confirmAccuracy', event.target.checked)} />
                  <span className="text-sm text-slate-700">Confirmo que revisé la información y que es correcta según mi conocimiento.</span>
                </label>
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> El personal clínico validará contigo los datos de salud antes de utilizarlos para tomar decisiones.
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => step === 0 ? onExit() : setStep((current) => current - 1)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Salir' : 'Anterior'}
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                Enviar mi ficha <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
