/**
 * Domain types for notifications, reminders, schedules and user preferences.
 */

export const INTAKE_CATEGORY_IDENTIFIER = "INTAKE_REMINDER";

export const NOTIF_ACTIONS = {
  GIVE_NOW: "GIVE_NOW",
  SNOOZE: "SNOOZE",
  NOT_GIVEN: "NOT_GIVEN",
} as const;

export type NotificationActionType =
  (typeof NOTIF_ACTIONS)[keyof typeof NOTIF_ACTIONS];

export interface IntakeNotificationPayload {
  person_id: string;
  person_name: string;
  schedule_id?: string;
  schedule_time_id?: string;
  product_name: string;
  quantity: string;
  unit: string;
  time_label: string;
  is_followup?: boolean;
}

export interface ScheduleSlot {
  id: string;
  local_time: string; // "08:00", "12:30", "18:00"
  period_label: string; // "Matin", "Midi", "Soir"
  product_name: string;
  quantity: string;
  unit: string;
  enabled: boolean;
  is_prescribed: boolean;
}

export interface NotificationPreferences {
  reminders_enabled: boolean;
  followup_enabled: boolean;
  caregiver_messages_enabled: boolean;
  evaluations_enabled: boolean;
  push_channel_enabled: boolean;
  sms_fallback_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "21:00"
  quiet_hours_end: string; // "06:00"
}

export interface InAppNotificationItem {
  id: string;
  type:
    | "intake_reminder"
    | "intake_missed"
    | "caregiver_message"
    | "evaluation_update"
    | "intake_confirmed";
  title: string;
  body: string;
  person_name?: string;
  created_at: string;
  read_at: string | null;
  relative_time: string;
  target_route?: string;
}

