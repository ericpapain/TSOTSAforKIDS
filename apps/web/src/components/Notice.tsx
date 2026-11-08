import React, { type HTMLAttributes, type ReactNode } from "react";

export type NoticeVariant = "warning" | "danger" | "info";

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: NoticeVariant;
  children: ReactNode;
  testID?: string;
}

const variantStyles: Record<NoticeVariant, string> = {
  warning: "bg-warning-50 text-warning-900 border-none",
  danger: "bg-danger-50 text-danger border-none",
  info: "bg-primary-50 text-primary border-none",
};

export function Notice({
  variant = "warning",
  children,
  testID = "notice-box",
  className = "",
  ...props
}: NoticeProps): React.JSX.Element {
  return (
    <div
      data-testid={testID}
      role="alert"
      className={`rounded-field p-3.5 text-14 leading-relaxed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

