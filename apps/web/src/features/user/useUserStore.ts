import { useState, useEffect, useMemo } from "react";
import { userStore, type UserState } from "./userStore";
import type { ChildMember } from "./types";

export function useUserStore() {
  const [state, setState] = useState<UserState>(userStore.getState());

  useEffect(() => {
    return userStore.subscribe(() => {
      setState(userStore.getState());
    });
  }, []);

  const activeChild = useMemo<ChildMember | undefined>(() => {
    return state.children.find((c) => c.id === state.activeChildId) ?? state.children[0];
  }, [state.children, state.activeChildId]);

  return {
    ...state,
    activeChild,
    setActiveChild: userStore.setActiveChild,
    addChild: userStore.addChild,
    updateChild: userStore.updateChild,
    inviteSecondParent: userStore.inviteSecondParent,
    addIntake: userStore.addIntake,
    addCustomProduct: userStore.addCustomProduct,
    updateSettings: userStore.updateSettings,
    reset: userStore.reset,
  };
}
