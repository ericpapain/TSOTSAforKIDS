import type { ReactNode } from "react";

export type UserRole =
  | "parent"
  | "field_agent"
  | "caregiver"
  | "super_caregiver"
  | "admin"
  | "user"; // Backwards-compatibility alias for parent

export type AccountStatus = "pending" | "active" | "refused" | "suspended" | "deleted";

export type SpaceTheme =
  | "user"
  | "caregiver"
  | "admin"
  | "field_agent"
  | "super_caregiver"
  | "primary"
  | "care";

export type SpaceType = SpaceTheme;

export interface NavItem {
  key?: string;
  label: string;
  path: string;
  icon?: string;
  iconName?: string;
  badge?: number | string;
  requiredPermission?: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status?: AccountStatus;
  permissions?: string[];
  region_id?: string;
  locality?: string;
  orgName?: string;
  organization_id?: string;
  specialty?: string;
  orderNumber?: string;
  isVerifiedCaregiver?: boolean;
  preferred_locale?: "fr" | "en";
  viewAsCaregiverId?: string | null;
  viewAsCaregiverName?: string | null;
}

export interface ZScorePoint {
  date: string;
  zScore: number;
  label?: string;
  color?: string;
}

export interface ColumnDef<T> {
  key?: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
}

export type DataTableColumn<T> = ColumnDef<T>;
