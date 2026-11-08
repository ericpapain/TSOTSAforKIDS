import React, { type HTMLAttributes, type ReactNode } from "react";

export type NoticeVariant = "warning" | "danger" | "info" | "success";

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: NoticeVariant;
  title?: string;
  children: ReactNode;
  testID?: string;
}

const variantStyles: Record<NoticeVariant, string> = {
  warning: "bg-warning-50 text-warning-900 border-none",
  danger: "bg-danger-50 text-danger border-none",
  info: "bg-primary-50 text-primary border-none",
  success: "bg-[#EBF7F2] text-[#0F7B5F] border border-[#C2E7D9]",
};

export function Notice({
  variant = "warning",
  title,
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
      {title && <span className="font-bold block mb-1">{title}</span>}
      {children}
    </div>
  );
}
