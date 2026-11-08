import React, { type HTMLAttributes, type ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  testID?: string;
}

export function Card({
  children,
  title,
  subtitle,
  action,
  testID = "card-container",
  className = "",
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      data-testid={testID}
      className={`bg-white border border-border rounded-card shadow-none p-5 ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-3 mb-4 pb-2 border-b border-border/50">
          <div>
            {title && (
              <h2 className="text-16 font-bold text-text leading-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="text-12 text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
