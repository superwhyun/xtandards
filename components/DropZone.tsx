import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DropZoneProps {
  onDrop: (files: FileList) => void;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "small";
  hidden?: boolean; // Accept 상태일 때 숨김 처리용
}

export default function DropZone({
  onDrop,
  className,
  children,
  variant = "default",
  hidden = false,
}: DropZoneProps) {
  const { t } = useLanguage()
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop]
  );

  const baseHeight = "h-44"; // DocumentCard와 동일한 높이

  if (hidden) {
    return null; // Accept 상태일 때 컴포넌트 자체를 숨김
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group",
        "w-48 mx-auto", // 고정 크기
        baseHeight,
        isDragOver
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105"
          : "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-gray-400 hover:shadow-md",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="h-full flex flex-col items-center justify-center p-4">
        {children || (
          <>
            <div
              className={cn(
                "rounded-full p-3 mb-2 transition-colors",
                isDragOver ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"
              )}
            >
              <Upload
                className="h-6 w-6 transition-colors"
                style={{
                  color: isDragOver ? "#2563eb" : "#6b7280"
                }}
              />
            </div>
            <p
              className="text-center font-medium transition-colors text-sm"
              style={{
                color: isDragOver ? "#2563eb" : "#4b5563"
              }}
            >
              {t('document.dragDropFiles')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}