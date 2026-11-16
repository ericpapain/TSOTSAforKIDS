import { useState, useEffect } from "react";
import { caregiverStore, type CaregiverState } from "./caregiverStore";

export function useCaregiverStore(): CaregiverState & {
  reassignPatient: (personId: string, toDoctorId: string, reason?: string) => boolean;
  addPatient: (data: Partial<import("./types").FollowedPerson> & { name: string; age: string; gender: "F" | "M" }) => import("./types").FollowedPerson;
  setSuperCaregiver: (isSuper: boolean) => void;
  setCurrentDoctor: (doctorId: string) => void;
  reset: () => void;
} {
  const [state, setState] = useState<CaregiverState>(caregiverStore.getState());

  useEffect(() => {
    const unsub = caregiverStore.subscribe(() => {
      setState(caregiverStore.getState());
    });
    return unsub;
  }, []);

  return {
    ...state,
    reassignPatient: caregiverStore.reassignPatient,
    addPatient: caregiverStore.addPatient,
    setSuperCaregiver: caregiverStore.setSuperCaregiver,
    setCurrentDoctor: caregiverStore.setCurrentDoctor,
    reset: caregiverStore.reset,
  };
}

