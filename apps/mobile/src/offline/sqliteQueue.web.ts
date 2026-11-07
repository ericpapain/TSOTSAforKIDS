/**
 * Web implementation of offline queue (in-memory / localStorage fallback).
 * Avoids native expo-sqlite dependency on web.
 */

import type { OfflineIntake } from "./types";

const STORAGE_KEY = "tsotsa_offline_intakes_web";
let inMemoryQueue: OfflineIntake[] = [];

function loadQueue(): OfflineIntake[] {
  if (typeof localStorage !== "undefined" && localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as OfflineIntake[];
    } catch {
      // fallback
    }
  }
  return inMemoryQueue;
}

function saveQueue(queue: OfflineIntake[]): void {
  inMemoryQueue = [...queue];
  if (typeof localStorage !== "undefined" && localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // fallback
    }
  }
}

export async function getDatabase(): Promise<unknown> {
  return null;
}

export async function enqueueIntake(intake: OfflineIntake): Promise<void> {
  const queue = loadQueue();
  const existingIndex = queue.findIndex((item) => item.id === intake.id);
  if (existingIndex >= 0) {
    queue[existingIndex] = intake;
  } else {
    queue.push(intake);
  }
  saveQueue(queue);
}

export async function getPendingIntakes(): Promise<OfflineIntake[]> {
  const queue = loadQueue();
  return queue.filter((item) => item.status === "pending");
}

export async function getPendingCount(): Promise<number> {
  const queue = loadQueue();
  return queue.filter((item) => item.status === "pending").length;
}

export async function removeIntakes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const queue = loadQueue().filter((item) => !ids.includes(item.id));
  saveQueue(queue);
}

export async function clearQueue(): Promise<void> {
  saveQueue([]);
}
