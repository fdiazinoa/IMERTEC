/**
 * IMERTEC — Ecosistema Clínico Inteligente
 * Aplicación Principal (Fase 2: MVP Clínico Completo y Funcional)
 */

import React, { useState } from 'react';
import { ClinicalProvider, useClinical } from './context/ClinicalContext';
import { Patient } from './types/clinical';
import { Navbar } from './components/Navbar';
import { PatientHeaderNav } from './components/PatientHeaderNav';
import { DashboardOverview } from './components/DashboardOverview';
import { PatientList } from './components/PatientList';
import { PatientSummaryView } from './components/PatientSummaryView';
import { PatientTimelineView } from './components/PatientTimelineView';
import { AdaptiveClinicalHistory } from './components/AdaptiveClinicalHistory';
import { LaboratoryWorkbench } from './components/LaboratoryWorkbench';
import { ClinicalDocumentRepository } from './components/ClinicalDocumentRepository';
import { IntelligentCoreECIView } from './components/IntelligentCoreECIView';
import { SICBEView } from './components/SICBEView';
import { PlanAndReportsView } from './components/PlanAndReportsView';
import { AuditTrailView } from './components/AuditTrailView';
import { AlertCenterView } from './components/AlertCenterView';
import { SafetyAlertModal } from './components/SafetyAlertModal';
import { NewPatientModal } from './components/NewPatientModal';
import { EditPatientModal } from './components/EditPatientModal';
import { ActiveEncounterModal } from './components/ActiveEncounterModal';
import { ClinicalTestSuiteModal } from './components/ClinicalTestSuiteModal';
import { LoginView } from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PatientSelfIntakeView } from './components/PatientSelfIntakeView';

const AppContent: React.FC = () => {
  const {
    selectedPatient,
    setSelectedPatient,
    startEncounter,
    currentUser,
    isAuthenticated,
    logout,
  } = useClinical();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modal States
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);

  const handleSelectPatient = (id: string, targetTab?: string) => {
    setSelectedPatient(id);
    setCurrentTab(targetTab || 'summary');
  };

  const handleStartEncounter = () => {
    startEncounter('AMBULATORY');
    setIsEncounterModalOpen(true);
  };

  if (currentTab === 'patient-intake') {
    return (
      <PatientSelfIntakeView
        onExit={() => setCurrentTab('dashboard')}
        onComplete={(patientId) => {
          setSelectedPatient(patientId);
          setCurrentTab('summary');
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginView onOpenPatientIntake={() => setCurrentTab('patient-intake')} />;
  }

  const isPatientSubView = [
    'summary',
    'timeline',
    'history',
    'encounters',
    'laboratory',
    'documents',
    'eci',
    'sicbe',
    'plan',
    'audit',
  ].includes(currentTab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        onStartEncounter={handleStartEncounter}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onLogout={logout}
      />

      {/* 2. Patient Executive Header & Sub-Navigation (if viewing patient record) */}
      {isPatientSubView && selectedPatient && (
        <PatientHeaderNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
          onStartEncounter={handleStartEncounter}
        />
      )}

      {/* 3. Main Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            onSelectPatient={handleSelectPatient}
            onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
            onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
            onOpenPatientIntake={() => setCurrentTab('patient-intake')}
          />
        )}

        {currentTab === 'patients' && (
          <PatientList
            onSelectPatient={handleSelectPatient}
            onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
            onStartEncounter={handleStartEncounter}
            onEditPatient={(p) => setEditingPatient(p)}
          />
        )}

        {currentTab === 'alerts' && <AlertCenterView />}

        {currentTab === 'summary' && (
          <PatientSummaryView
            onNavigateTab={setCurrentTab}
            onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
            onStartEncounter={handleStartEncounter}
          />
        )}

        {currentTab === 'timeline' && <PatientTimelineView />}

        {currentTab === 'history' && <AdaptiveClinicalHistory />}

        {currentTab === 'encounters' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Consultas Clínicas & Síntesis M23
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Encuentros médicos ambulatorios, síntesis pre-SICBE y generación de snapshot ECI inmutable
                </p>
              </div>
              <button
                onClick={handleStartEncounter}
                className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                + Iniciar Nueva Consulta
              </button>
            </div>
            {/* Show Summary and History as baseline reference */}
            <PatientSummaryView
              onNavigateTab={setCurrentTab}
              onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
              onStartEncounter={handleStartEncounter}
            />
          </div>
        )}

        {currentTab === 'laboratory' && <LaboratoryWorkbench />}

        {currentTab === 'documents' && <ClinicalDocumentRepository />}

        {currentTab === 'eci' && (
          <ErrorBoundary fallbackTitle="Error al cargar el Núcleo ECI">
            <IntelligentCoreECIView />
          </ErrorBoundary>
        )}

        {currentTab === 'sicbe' && (
          <SICBEView onOpenTestSuite={() => setIsTestSuiteOpen(true)} />
        )}

        {currentTab === 'plan' && <PlanAndReportsView />}

        {currentTab === 'audit' && <AuditTrailView />}
      </main>

      {/* 4. Global Modals */}
      <SafetyAlertModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onPatientCreated={(newId) => {
          setSelectedPatient(newId);
          setCurrentTab('summary');
        }}
      />

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          isOpen={!!editingPatient}
          onClose={() => setEditingPatient(null)}
          onPatientUpdated={() => setEditingPatient(null)}
        />
      )}

      <ActiveEncounterModal
        isOpen={isEncounterModalOpen}
        onClose={() => setIsEncounterModalOpen(false)}
      />

      <ClinicalTestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ClinicalProvider>
      <AppContent />
    </ClinicalProvider>
  );
}
