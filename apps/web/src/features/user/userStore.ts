import type {
  ChildMember,
  CustomUserProduct,
  IntakeRecord,
  UserSettings,
} from "./types";

const STORAGE_KEY = "tsotsa.user_store";

export interface UserState {
  children: ChildMember[];
  activeChildId: string;
  intakes: IntakeRecord[];
  customProducts: CustomUserProduct[];
  settings: UserSettings;
}

const defaultChildren: ChildMember[] = [
  {
    id: "child-amina",
    code: "#A-014",
    firstName: "Amina",
    birthDate: "2024-05-10",
    sex: "F",
    relation: "mother",
    weightKg: 8.4,
    heightCm: 72,
    muacMm: 120,
    edema: "none",
    status: "MAS",
    facilityName: "CMA de démo",
    doctorId: "doc-felicite",
    doctorName: "Prof. Félicité Ngeufack",
    doctorFacility: "CMA de démo",
    doctorReports: [
      {
        id: "rep-amina-1",
        date: "29/10/2026",
        doctorName: "Prof. Félicité Ngeufack",
        facility: "CMA de démo",
        title: "Protocole de rattrapage nutritionnel MAM",
        targetWeightKg: 9.2,
        prescription: "1 portion de bouillie enrichie à l'arachide le matin + 1 sachet de Plumpy'Nut le soir",
        observations: "Bonne reprise pondérale (+150g en 7j). Poursuivre l'apport protéino-énergétique et surveillance du PB.",
      },
    ],
    lastIntakeTime: "12:30",
    hasConsent: true,
  },
  {
    id: "child-hamadou",
    code: "#H-007",
    firstName: "Hamadou",
    birthDate: "2022-09-15",
    sex: "M",
    relation: "father",
    weightKg: 14.2,
    heightCm: 98,
    muacMm: 145,
    edema: "none",
    status: "normal",
    facilityName: "Hôpital de District",
    doctorId: "doc-felicite",
    doctorName: "Prof. Félicité Ngeufack",
    doctorFacility: "CMA de démo",
    doctorReports: [
      {
        id: "rep-hamadou-1",
        date: "15/10/2026",
        doctorName: "Prof. Félicité Ngeufack",
        facility: "CMA de démo",
        title: "Suivi de croissance standard",
        targetWeightKg: 15.0,
        prescription: "Régime diversifié enrichi aux légumineuses locales.",
        observations: "Courbe OMS harmonieuse, croissance normale.",
      },
    ],
    lastIntakeTime: "08:00",
    hasConsent: true,
  },
];

const defaultIntakes: IntakeRecord[] = [
  {
    id: "intake-1",
    childId: "child-amina",
    childName: "Amina",
    foodName: "Bouillie enrichie à l'arachide",
    quantity: 1,
    unit: "portion",
    time: "12:30",
    date: "Aujourd'hui",
    consumption: "all",
    status: "given",
  },
  {
    id: "intake-2",
    childId: "child-amina",
    childName: "Amina",
    foodName: "Plumpy'Nut",
    quantity: 1,
    unit: "sachet",
    time: "08:00",
    date: "Aujourd'hui",
    consumption: "all",
    status: "given",
  },
  {
    id: "intake-3",
    childId: "child-hamadou",
    childName: "Hamadou",
    foodName: "Gari digari fortifié",
    quantity: 1,
    unit: "portion",
    time: "08:15",
    date: "Aujourd'hui",
    consumption: "all",
    status: "given",
  },
];

const defaultSettings: UserSettings = {
  remindersActive: true,
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
  preferredChannel: "web",
};

function loadInitialState(): UserState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserState>;
      return {
        children: parsed.children && parsed.children.length > 0 ? parsed.children : defaultChildren,
        activeChildId: parsed.activeChildId || "child-amina",
        intakes: parsed.intakes || defaultIntakes,
        customProducts: parsed.customProducts || [],
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
      };
    }
  } catch {
    // fallback to defaults on storage failure
  }
  return {
    children: defaultChildren,
    activeChildId: "child-amina",
    intakes: defaultIntakes,
    customProducts: [],
    settings: defaultSettings,
  };
}

const state: UserState = loadInitialState();
const listeners = new Set<() => void>();

function persistAndNotify(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage write errors
  }
  listeners.forEach((cb) => cb());
}

export const userStore = {
  getState: (): UserState => ({ ...state }),
  subscribe: (cb: () => void): (() => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  setActiveChild: (childId: string): void => {
    state.activeChildId = childId;
    persistAndNotify();
  },
  addChild: (child: Partial<ChildMember> & Omit<ChildMember, "id" | "code" | "hasConsent">): ChildMember => {
    const nextNum = state.children.length + 1;
    const initialLetter = child.firstName.charAt(0).toUpperCase() || "E";
    const newChild: ChildMember = {
      ...child,
      id: child.id || `child-${Date.now()}`,
      code: child.code || `#${initialLetter}-${String(nextNum).padStart(3, "0")}`,
      hasConsent: true,
      validationStatus: child.validationStatus || "pending",
      doctorId: child.doctorId || "doc-felicite",
      doctorName: child.doctorName || "Prof. Félicité Ngeufack",
      doctorFacility: child.doctorFacility || "CMA de démo",
      doctorReports: child.doctorReports || [
        {
          id: `rep-${Date.now()}`,
          date: "10/11/2026",
          doctorName: child.doctorName || "Prof. Félicité Ngeufack",
          facility: child.doctorFacility || "CMA de démo",
          title: "Attribution automatique du médecin référent familial",
          targetWeightKg: Math.round(((child.weightKg || 8) * 1.1) * 10) / 10,
          prescription: "Poursuivre l'alimentation diversifiée avec équivalents nutritionnels locaux.",
          observations: "Dossier rattaché à la patientèle du Prof. Félicité Ngeufack suite au consentement parental.",
        },
      ],
    };
    state.children = [newChild, ...state.children];
    state.activeChildId = newChild.id;
    persistAndNotify();
    return newChild;
  },
  deleteChild: (childId: string): void => {
    state.children = state.children.filter((c) => c.id !== childId);
    if (state.activeChildId === childId && state.children.length > 0) {
      state.activeChildId = state.children[0].id;
    }
    persistAndNotify();
  },
  setChildren: (children: ChildMember[]): void => {
    state.children = children;
    if (!state.children.some((c) => c.id === state.activeChildId) && state.children.length > 0) {
      state.activeChildId = state.children[0].id;
    }
    persistAndNotify();
  },
  updateChild: (childId: string, updates: Partial<ChildMember>): void => {
    state.children = state.children.map((c) => (c.id === childId ? { ...c, ...updates } : c));
    persistAndNotify();
  },
  inviteSecondParent: (childId: string, phoneOrEmail: string): void => {
    state.children = state.children.map((c) =>
      c.id === childId
        ? {
            ...c,
            secondParentInvite: {
              phoneOrEmail: phoneOrEmail.trim(),
              status: "pending",
              invitedAt: new Date().toISOString(),
            },
          }
        : c
    );
    persistAndNotify();
  },
  addIntake: (intake: Omit<IntakeRecord, "id">): IntakeRecord => {
    const newIntake: IntakeRecord = {
      ...intake,
      id: `intake-${Date.now()}`,
    };
    state.intakes = [newIntake, ...state.intakes];
    // update child last intake time
    state.children = state.children.map((c) =>
      c.id === intake.childId ? { ...c, lastIntakeTime: intake.time } : c
    );
    persistAndNotify();
    return newIntake;
  },
  addCustomProduct: (product: Omit<CustomUserProduct, "id" | "createdAt">): CustomUserProduct => {
    const newProduct: CustomUserProduct = {
      ...product,
      id: `custom-prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    state.customProducts = [newProduct, ...state.customProducts];
    persistAndNotify();
    return newProduct;
  },
  updateSettings: (updates: Partial<UserSettings>): void => {
    state.settings = { ...state.settings, ...updates };
    persistAndNotify();
  },
  reset: (): void => {
    state.children = defaultChildren;
    state.activeChildId = "child-amina";
    state.intakes = defaultIntakes;
    state.customProducts = [];
    state.settings = defaultSettings;
    persistAndNotify();
  },
};

