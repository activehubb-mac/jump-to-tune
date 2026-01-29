import * as React from "react";
import { cn } from "@/lib/utils";

interface CardHoverOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHoverOverlay({ 
  children, 
  className,
  ...props 
}: CardHoverOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-[#1a1a1a]/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
