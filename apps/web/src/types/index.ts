import type { ReactNode } from "react";

export type UserRole = "user" | "caregiver" | "admin";

export type SpaceTheme = "user" | "caregiver" | "admin" | "primary" | "care";
export type SpaceType = SpaceTheme;

export interface NavItem {
  key?: string;
  label: string;
  path: string;
  icon?: string;
  iconName?: string;
  badge?: number | string;
}

export interface UserSession {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
  fullName?: string;
  role: UserRole;
  orgName?: string;
  isVerifiedCaregiver?: boolean;
}

export interface ZScorePoint {
  date: string;
  zScore: number;
  label?: string;
}

export interface ColumnDef<T> {
  key?: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
}

export type DataTableColumn<T> = ColumnDef<T>;
