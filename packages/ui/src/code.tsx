import { type JSX, type ReactNode } from "react";

export interface CodeProps {
  children: ReactNode;
  className?: string;
}

export function Code({ children, className }: CodeProps): JSX.Element {
  return <code className={className}>{children}</code>;
}
