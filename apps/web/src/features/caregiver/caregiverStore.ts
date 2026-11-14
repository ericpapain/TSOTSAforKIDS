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
  addPatient: (data: Partial<FollowedPerson> & { name: string; age: string; gender: "F" | "M" }): FollowedPerson => {
    const nextNum = state.persons.length + 15;
    const code = data.code || `#C-${String(nextNum).padStart(3, "0")}`;
    const id = data.id || code.replace("#", "");
    const doctor = state.doctors.find((d) => d.id === state.currentDoctorId) || state.doctors[0];

    const pb = data.pb ?? 120;
    const zScore = data.zScore ?? -2.1;
    let status = data.status;
    let statusColor = data.statusColor;

    if (!status) {
      if (pb < 115 || zScore <= -3) {
        status = "MAS";
        statusColor = "#C93C3C";
      } else if (pb < 125 || zScore <= -2) {
        status = "MAM";
        statusColor = "#B7791F";
      } else {
        status = "Normal";
        statusColor = "#0F7B5F";
      }
    }

    const newPerson: FollowedPerson = {
      id,
      code,
      name: data.name.trim(),
      age: data.age.trim(),
      gender: data.gender,
      region: data.region || "Centre",
      facility: data.facility || doctor?.facility || "CMA de démo",
      status,
      statusColor: statusColor || "#B7791F",
      lastEvaluation: data.lastEvaluation || new Date().toLocaleDateString("fr-FR"),
      pb,
      zScore,
      assignedDoctorId: data.assignedDoctorId || doctor?.id,
      assignedDoctorName: data.assignedDoctorName || doctor?.name,
      transferHistory: [],
    };

    state.persons = [newPerson, ...state.persons];

    state.doctors = state.doctors.map((doc) => {
      const count = state.persons.filter((p) => p.assignedDoctorId === doc.id).length;
      return { ...doc, patientCount: count };
    });

    persistAndNotify();
    return newPerson;
  },
  reset: (): void => {
    state.persons = initialFollowedPersons;
    state.doctors = initialCaregiverDoctors;
    state.isSuperCaregiver = true;
    state.currentDoctorId = "doc-felicite";
    persistAndNotify();
  },
};

