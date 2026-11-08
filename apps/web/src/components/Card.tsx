import React, { type HTMLAttributes, type ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  testID?: string;
}

export function Card({
  children,
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
      {children}
    </div>
  );
}

