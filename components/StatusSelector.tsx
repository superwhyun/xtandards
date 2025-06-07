import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: "accepted" | "review" | "rejected") => void;
}

export default function StatusSelector({
  currentStatus,
  onStatusChange,
}: StatusSelectorProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "accepted":
        return "text-green-600";
      case "review":
        return "text-yellow-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className={`w-24 h-8 text-xs ${getStatusColor(currentStatus)}`}>
        <SelectValue placeholder="상태" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="accepted" className="text-green-600">✓ Accept</SelectItem>
        <SelectItem value="review" className="text-yellow-600">⏸ Review</SelectItem>
        <SelectItem value="rejected" className="text-red-600">✗ Reject</SelectItem>
      </SelectContent>
    </Select>
  );
}

// %%%%%LAST%%%%%