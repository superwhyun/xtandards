import React from "react";
import { Document } from "@/types/standard";

interface MemoSectionProps {
  proposal: Document;
  isExpanded: boolean;
  memo: string;
  onMemoChange: (value: string) => void;
  onMemoBlur: (value: string) => void;
}

export default function MemoSection({
  proposal,
  isExpanded,
  memo,
  onMemoChange,
  onMemoBlur
}: MemoSectionProps) {
  if (!isExpanded) return null;

  return (
    <div className="memo-slide-container expanding">
      <div className="mt-4 border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메모 (기고서: {proposal.name})
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="이 기고서에 대한 메모를 입력하세요..."
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          onBlur={(e) => onMemoBlur(e.target.value)}
        />
      </div>
    </div>
  );
}