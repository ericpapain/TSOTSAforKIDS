/**
 * Constants for the notifications module.
 */

import { NotificationPreferences, ScheduleSlot } from "./types";

export const NOTIFICATION_CHANNELS = {
  REMINDERS: "tsotsa-reminders",
  ALERTS: "tsotsa-alerts",
} as const;

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  reminders_enabled: true,
  followup_enabled: true,
  caregiver_messages_enabled: true,
  evaluations_enabled: true,
  push_channel_enabled: true,
  sms_fallback_enabled: false,
  quiet_hours_enabled: true,
  quiet_hours_start: "21:00",
  quiet_hours_end: "06:00",
};

export const DEFAULT_SCHEDULE_SLOTS: ScheduleSlot[] = [
  {
    id: "slot-morning",
    local_time: "08:00",
    period_label: "Matin",
    product_name: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    enabled: true,
    is_prescribed: true,
  },
  {
    id: "slot-noon",
    local_time: "12:30",
    period_label: "Midi",
    product_name: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    enabled: true,
    is_prescribed: true,
  },
  {
    id: "slot-evening",
    local_time: "18:00",
    period_label: "Soir",
    product_name: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    enabled: true,
    is_prescribed: true,
  },
];

