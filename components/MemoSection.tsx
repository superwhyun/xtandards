import React, { useEffect, useRef } from "react";
import { Document } from "@/types/standard";

interface MemoSectionProps {
  proposal: Document;
  isExpanded: boolean;
  memo: string;
  onMemoChange: (value: string) => void;
  onMemoBlur: (value: string) => void;
  onMemoToggle: () => void;
}

export default function MemoSection({
  proposal,
  isExpanded,
  memo,
  onMemoChange,
  onMemoBlur,
  onMemoToggle
}: MemoSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const originalValueRef = useRef(memo);
  const currentValueRef = useRef(memo);

  // 메모창이 열릴 때 원래 값 저장하고 포커스
  useEffect(() => {
    if (isExpanded) {
      originalValueRef.current = memo;
      currentValueRef.current = memo;
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isExpanded]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    currentValueRef.current = newValue;
    onMemoChange(newValue);
  };

  const handleBlur = () => {
    // 실제로 변경된 경우에만 저장
    if (currentValueRef.current !== originalValueRef.current) {
      onMemoBlur(currentValueRef.current);
    }
    // 포커스를 잃을 때는 메모창을 닫지 않음
  };

  if (!isExpanded) return null;

  return (
    <div className="mt-4 border-t border-gray-600 pt-4">
      <label className="block text-sm font-medium text-gray-200 mb-2">
        회의 논의 내용 (기고서: {proposal.name})
      </label>
      <textarea
        ref={textareaRef}
        className="w-full p-3 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white min-h-24"
        rows={6}
        placeholder="이 기고서에 대한 회의 논의 내용을 입력하세요..."
        value={memo}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
}