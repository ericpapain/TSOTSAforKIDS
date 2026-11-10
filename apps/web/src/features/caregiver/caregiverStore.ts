import {
  initialFollowedPersons,
  initialCaregiverDoctors,
} from "./caregiverData";
import type { CaregiverDoctor, FollowedPerson } from "./types";

const STORAGE_KEY = "tsotsa.caregiver_store";

export interface CaregiverState {
  persons: FollowedPerson[];
  doctors: CaregiverDoctor[];
  isSuperCaregiver: boolean;
  currentDoctorId: string;
}

function loadState(): CaregiverState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.persons) && Array.isArray(parsed.doctors)) {
        return parsed as CaregiverState;
      }
    }
  } catch {
    // fallback
  }

  return {
    persons: initialFollowedPersons,
    doctors: initialCaregiverDoctors,
    isSuperCaregiver: true,
    currentDoctorId: "doc-felicite",
  };
}

const state: CaregiverState = loadState();
const listeners = new Set<() => void>();

function persistAndNotify(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
  listeners.forEach((cb) => cb());
}

export const caregiverStore = {
  getState: (): CaregiverState => ({ ...state }),
  subscribe: (cb: () => void): (() => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  setSuperCaregiver: (isSuper: boolean): void => {
    state.isSuperCaregiver = isSuper;
    persistAndNotify();
  },
  setCurrentDoctor: (doctorId: string): void => {
    state.currentDoctorId = doctorId;
    persistAndNotify();
  },
  reassignPatient: (personId: string, toDoctorId: string, reason?: string): boolean => {
    const targetDoc = state.doctors.find((d) => d.id === toDoctorId);
    if (!targetDoc) return false;

    const currentPerson = state.persons.find((p) => p.id === personId);
    if (!currentPerson) return false;

    const fromDocName = currentPerson.assignedDoctorName || "Non assigné";
    const transferDate = new Date().toLocaleDateString("fr-FR");

    state.persons = state.persons.map((p) => {
      if (p.id !== personId) return p;
      const history = p.transferHistory || [];
      return {
        ...p,
        assignedDoctorId: targetDoc.id,
        assignedDoctorName: targetDoc.name,
        facility: targetDoc.facility,
        transferHistory: [
          {
            date: transferDate,
            fromDoctor: fromDocName,
            toDoctor: targetDoc.name,
            reassignedBy: "Super Soignant (Médecin-Chef)",
            reason: reason?.trim() || "Réattribution de charge clinique",
          },
          ...history,
        ],
      };
    });

    // Update doctors counts
    state.doctors = state.doctors.map((doc) => {
      const count = state.persons.filter((p) => p.assignedDoctorId === doc.id).length;
      return { ...doc, patientCount: count };
    });

    persistAndNotify();
    return true;
  },
  reset: (): void => {
    state.persons = initialFollowedPersons;
    state.doctors = initialCaregiverDoctors;
    state.isSuperCaregiver = true;
    state.currentDoctorId = "doc-felicite";
    persistAndNotify();
  },
};

