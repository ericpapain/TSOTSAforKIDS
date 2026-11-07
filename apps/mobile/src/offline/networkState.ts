/**
 * Network state tracking and listener for offline/online transitions.
 */

import { syncPendingIntakes } from "./syncService";

let currentIsOnline = true;
type NetworkListener = (isOnline: boolean) => void;
const listeners = new Set<NetworkListener>();

export function isOnline(): boolean {
  return currentIsOnline;
}

export function setOnlineState(online: boolean): void {
  if (currentIsOnline === online) return;
  currentIsOnline = online;
  listeners.forEach((listener) => {
    try {
      listener(online);
    } catch {
      // ignore listener errors
    }
  });

  // Automatically trigger synchronization when returning online
  if (online) {
    syncPendingIntakes().catch(() => {});
  }
}

export function subscribeNetworkState(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

