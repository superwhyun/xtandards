import React from "react";
import { cn } from "@/lib/utils";

interface ConnectionLineProps {
  fromAccepted?: boolean;
  variant?: "default" | "small";
}

export default function ConnectionLine({
  fromAccepted = true,
  variant = "default"
}: ConnectionLineProps) {
  const lineWidth = "w-12";
  const lineHeight = "h-1";
  const lineColor = fromAccepted ? "from-green-500 to-blue-500" : "from-gray-400 to-gray-500";

  return (
    <div className="flex items-center justify-center px-4 py-2">
      <div className={cn("bg-gradient-to-r rounded-full", lineWidth, lineHeight, lineColor)}></div>
    </div>
  );
}