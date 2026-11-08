import {
  initialCaregiversPending,
  initialUserProductsPending,
  initialAccounts,
  initialFoodBatches,
  initialImportCheckItems,
  initialModules,
} from "./adminData";
import type {
  AccountItem,
  CaregiverPending,
  UserProductPending,
  FoodBatch,
  NutrientCheckItem,
  PlatformModule,
} from "./types";

interface AdminState {
  caregivers: CaregiverPending[];
  userProducts: UserProductPending[];
  accounts: AccountItem[];
  batches: FoodBatch[];
  checkItems: NutrientCheckItem[];
  columnMapping: Record<string, string>;
  modules: PlatformModule[];
  notificationsActive: boolean;
  currentUser: string;
}

const state: AdminState = {
  caregivers: [...initialCaregiversPending],
  userProducts: [...initialUserProductsPending],
  accounts: [...initialAccounts],
  batches: [...initialFoodBatches],
  checkItems: [...initialImportCheckItems],
  columnMapping: {
    Food: "aliment",
    "Protein (g)": "protéines",
    "Fe (mg)": "fer",
    "Ca (mg)": "calcium",
  },
  modules: [...initialModules],
  notificationsActive: true,
  currentUser: "Équipe TSOTSA",
};

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((cb) => cb());
}

export const adminStore = {
  getState: (): AdminState => ({ ...state }),
  subscribe: (cb: () => void): (() => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  setCurrentUser: (user: string): void => {
    state.currentUser = user;
    notify();
  },
  approveCaregiver: (id: string): void => {
    state.caregivers = state.caregivers.filter((c) => c.id !== id);
    notify();
  },
  rejectCaregiver: (id: string): void => {
    state.caregivers = state.caregivers.filter((c) => c.id !== id);
    notify();
  },
  approveUserProduct: (id: string): void => {
    state.userProducts = state.userProducts.filter((p) => p.id !== id);
    notify();
  },
  addAccount: (account: Omit<AccountItem, "id">): AccountItem => {
    const newItem: AccountItem = {
      ...account,
      id: `acc-${Date.now()}`,
    };
    state.accounts = [newItem, ...state.accounts];
    notify();
    return newItem;
  },
  updateColumnMapping: (sourceCol: string, targetCol: string): void => {
    state.columnMapping = { ...state.columnMapping, [sourceCol]: targetCol };
    notify();
  },
  fixCheckItem: (index: number, fixedItem: Partial<NutrientCheckItem>): void => {
    const updated = [...state.checkItems];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fixedItem };
      state.checkItems = updated;
      notify();
    }
  },
  addManualFoodBatch: (nom: string, sourceRef: string): FoodBatch => {
    const newBatch: FoodBatch = {
      id: `lot-${Date.now()}`,
      lotNumber: `Lot ${state.batches.length + 1}`,
      source: `Saisie manuelle · ${nom} (${sourceRef})`,
      submittedBy: state.currentUser,
      lineCount: "1",
      status: "pending_review",
      statusLabel: "À valider (2ᵉ relecture)",
    };
    state.batches = [newBatch, ...state.batches];
    notify();
    return newBatch;
  },
  addImportedFoodBatch: (
    name: string,
    sourceRef: string,
    submitter = "Fidel"
  ): FoodBatch => {
    const newBatch: FoodBatch = {
      id: `lot-${Date.now()}`,
      lotNumber: `Lot ${state.batches.length + 1}`,
      source: `Import fichier · ${name} (${sourceRef})`,
      submittedBy: submitter,
      lineCount: "3",
      status: "pending_review",
      statusLabel: "À valider (2ᵉ relecture)",
    };
    state.batches = [newBatch, ...state.batches];
    notify();
    return newBatch;
  },
  validateBatch: (
    batchId: string,
    reviewer: string
  ): { success: boolean; error?: string } => {
    const batch = state.batches.find((b) => b.id === batchId);
    if (!batch) return { success: false, error: "Lot introuvable" };
    if (batch.submittedBy.trim().toLowerCase() === reviewer.trim().toLowerCase()) {
      return {
        success: false,
        error: "Interdiction de valider son propre lot : une 2ᵉ relecture par une autre personne est requise.",
      };
    }
    batch.status = "published";
    batch.statusLabel = "Publié";
    notify();
    return { success: true };
  },
  toggleModule: (moduleId: string): void => {
    state.modules = state.modules.map((m) =>
      m.id === moduleId ? { ...m, active: !m.active } : m
    );
    notify();
  },
  toggleNotifications: (): void => {
    state.notificationsActive = !state.notificationsActive;
    notify();
  },
  reset: (): void => {
    state.caregivers = [...initialCaregiversPending];
    state.userProducts = [...initialUserProductsPending];
    state.accounts = [...initialAccounts];
    state.batches = [...initialFoodBatches];
    state.checkItems = [...initialImportCheckItems];
    state.modules = [...initialModules];
    state.notificationsActive = true;
    state.currentUser = "Équipe TSOTSA";
    notify();
  },
};
