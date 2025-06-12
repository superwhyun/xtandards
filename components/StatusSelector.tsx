import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: "accepted" | "review" | "rejected") => void;
}

export default function StatusSelector({
  currentStatus,
  onStatusChange,
}: StatusSelectorProps) {
  const { t } = useLanguage()
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
        <SelectValue placeholder={t('document.status')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="accepted" className="text-green-600">✓ {t('document.accept')}</SelectItem>
        <SelectItem value="review" className="text-yellow-600">⏸ {t('document.withdraw')}</SelectItem>
        <SelectItem value="rejected" className="text-red-600">✗ {t('document.reject')}</SelectItem>
      </SelectContent>
    </Select>
  );
}

// %%%%%LAST%%%%%