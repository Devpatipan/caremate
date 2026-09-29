import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePatients, Patient } from './patients';
import { useAuth } from './auth';

const KEY = 'caremate.currentPatientId';

type PatientContextValue = {
  patients: Patient[];
  currentPatient: Patient | null;
  currentPatientId: string | null;
  setCurrentPatient: (id: string) => void;
  isLoading: boolean;
};

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { data: patients = [], isLoading } = usePatients(!!session);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // โหลดค่าที่เคยเลือกไว้
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setCurrentId(v);
    });
  }, []);

  // ตั้งค่าเริ่มต้น / แก้ค่าที่ไม่ตรงกับรายชื่อจริง
  useEffect(() => {
    if (isLoading) return;
    if (patients.length === 0) {
      setCurrentId(null);
      return;
    }
    if (!currentId || !patients.some((p) => p.id === currentId)) {
      setCurrentId(patients[0].id);
    }
  }, [isLoading, patients, currentId]);

  const setCurrentPatient = useCallback((id: string) => {
    setCurrentId(id);
    AsyncStorage.setItem(KEY, id);
  }, []);

  const currentPatient = useMemo(
    () => patients.find((p) => p.id === currentId) ?? null,
    [patients, currentId]
  );

  const value = useMemo<PatientContextValue>(
    () => ({ patients, currentPatient, currentPatientId: currentId, setCurrentPatient, isLoading }),
    [patients, currentPatient, currentId, setCurrentPatient, isLoading]
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function useCurrentPatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('useCurrentPatient must be used inside <PatientProvider>');
  return ctx;
}

/** ตัวย่อชื่อผู้ป่วย (ไว้โชว์ในวงกลม avatar) */
export function patientInitial(name?: string | null): string {
  if (!name) return '?';
  const clean = name.replace(/^(นาย|นาง|นางสาว|เด็กชาย|เด็กหญิง|คุณ)\s*/,'').trim();
  return (clean[0] ?? name[0] ?? '?').toUpperCase();
}
