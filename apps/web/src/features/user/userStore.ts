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
      const children = parsed.children && Array.isArray(parsed.children) ? parsed.children : [];
      return {
        children,
        activeChildId: parsed.activeChildId || (children.length > 0 ? children[0].id : ""),
        intakes: parsed.intakes && Array.isArray(parsed.intakes) ? parsed.intakes : [],
        customProducts: parsed.customProducts || [],
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
      };
    }
  } catch {
    // fallback to clean state on storage failure
  }
  return {
    children: [],
    activeChildId: "",
    intakes: [],
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
      doctorId: child.doctorId,
      doctorName: child.doctorName || "En cours d'attribution",
      doctorFacility: child.doctorFacility || "Centre de santé",
      doctorReports: child.doctorReports || [],
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
    } else if (state.children.length === 0) {
      state.activeChildId = "";
    }
    persistAndNotify();
  },
  setChildren: (children: ChildMember[]): void => {
    state.children = children;
    if (!state.children.some((c) => c.id === state.activeChildId)) {
      state.activeChildId = state.children.length > 0 ? state.children[0].id : "";
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
  clear: (): void => {
    state.children = [];
    state.activeChildId = "";
    state.intakes = [];
    state.customProducts = [];
    state.settings = defaultSettings;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    listeners.forEach((cb) => cb());
  },
  reset: (): void => {
    state.children = [];
    state.activeChildId = "";
    state.intakes = [];
    state.customProducts = [];
    state.settings = defaultSettings;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    persistAndNotify();
  },
};
