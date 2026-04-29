"use client";

import { cn } from "@/lib/utils";

export const Logo = ({ className, ...props }: React.ComponentProps<"img">) => {
  return (
    <img
      src="/TBCheck.png"
      alt="logo"
      className={cn("h-7", className)}
      {...props}
    />
  );
};
