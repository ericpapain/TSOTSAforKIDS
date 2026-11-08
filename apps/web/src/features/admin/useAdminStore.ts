import { useState, useEffect } from "react";
import { adminStore } from "./adminStore";

export function useAdminStore() {
  const [state, setState] = useState(adminStore.getState());

  useEffect(() => {
    return adminStore.subscribe(() => {
      setState(adminStore.getState());
    });
  }, []);

  return {
    ...state,
    setCurrentUser: adminStore.setCurrentUser,
    approveCaregiver: adminStore.approveCaregiver,
    rejectCaregiver: adminStore.rejectCaregiver,
    approveUserProduct: adminStore.approveUserProduct,
    addAccount: adminStore.addAccount,
    updateColumnMapping: adminStore.updateColumnMapping,
    fixCheckItem: adminStore.fixCheckItem,
    addManualFoodBatch: adminStore.addManualFoodBatch,
    addImportedFoodBatch: adminStore.addImportedFoodBatch,
    validateBatch: adminStore.validateBatch,
    toggleModule: adminStore.toggleModule,
    toggleNotifications: adminStore.toggleNotifications,
    reset: adminStore.reset,
  };
}
