/**
 * In-app notification center service.
 * Manages the message list displayed in the notification center (M27).
 */

import { InAppNotificationItem } from "./types";

export const INITIAL_IN_APP_NOTIFICATIONS: InAppNotificationItem[] = [
  {
    id: "notif-1",
    type: "intake_reminder",
    title: "Amina : Repas du midi (12h30)",
    body: "1 sachet de Plumpy'Nut à donner maintenant.",
    person_name: "Amina",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read_at: null,
    relative_time: "Il y a 10 min",
    target_route: "/u-give?person_name=Amina&product_name=Plumpy'Nut",
  },
  {
    id: "notif-2",
    type: "intake_missed",
    title: "Amina : Plumpy'Nut non confirmé à 08h00",
    body: "La prise du matin n'a pas été confirmée. Veuillez vérifier.",
    person_name: "Amina",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read_at: null,
    relative_time: "Hier à 09h00",
    target_route: "/u-history",
  },
  {
    id: "notif-3",
    type: "caregiver_message",
    title: "Dr. Mbarga",
    body: "Très bonne évolution du périmètre brachial. Continuez le protocole.",
    person_name: "Amina",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    read_at: null,
    relative_time: "Il y a 2 jours",
  },
  {
    id: "notif-4",
    type: "evaluation_update",
    title: "Évaluation mise à jour",
    body: "Score d'état nutritionnel mis à jour par le centre de santé.",
    person_name: "Amina",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    read_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    relative_time: "Il y a 3 jours",
  },
  {
    id: "notif-5",
    type: "intake_confirmed",
    title: "Amina : 1 sachet Plumpy'Nut",
    body: "Prise du soir confirmée avec succès.",
    person_name: "Amina",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    read_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    relative_time: "Il y a 4 jours",
    target_route: "/u-history",
  },
];

let memoryNotifications: InAppNotificationItem[] = [...INITIAL_IN_APP_NOTIFICATIONS];

export function getInAppNotifications(): InAppNotificationItem[] {
  return [...memoryNotifications];
}

export function markAsRead(id: string): InAppNotificationItem | null {
  const item = memoryNotifications.find((n) => n.id === id);
  if (item) {
    item.read_at = new Date().toISOString();
    return { ...item };
  }
  return null;
}

export function resetInAppNotifications(): void {
  memoryNotifications = [...INITIAL_IN_APP_NOTIFICATIONS];
}

