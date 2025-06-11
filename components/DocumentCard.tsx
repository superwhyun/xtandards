import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

import { Document } from "@/types/standard"

interface DocumentCardProps {
  document: Document;
  showConnections?: boolean;
  variant?: "default" | "small";
  onDownload?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isLatest?: boolean;
  revisionIndex?: number; // 수정본 인덱스
}

export default function DocumentCard({
  document,
  showConnections = false,
  onDownload,
  onDelete,
  canDelete = true,
  isLatest = false,
  revisionIndex,
}: DocumentCardProps) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "previous":
        return { label: "Base Document", color: "bg-slate-100 text-slate-700", icon: "📄" };
      case "proposal":
        return { label: "기고서", color: "bg-blue-100 text-blue-700", icon: "📝" };
      case "revision":
        return { label: "수정본", color: "bg-amber-100 text-amber-700", icon: "🔄" };
      case "result":
        return { label: "Output Document", color: "bg-green-100 text-green-700", icon: "✅" };
      default:
        return { label: "문서", color: "bg-gray-100 text-gray-700", icon: "📄" };
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "review":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeLabel = (type: string, revisionIndex?: number) => {
    switch (type) {
      case "previous":
        return "B";
      case "proposal":
        return "C";
      case "revision":
        return `R${(revisionIndex || 0) + 1}`;
      case "result":
        return "OD";
      default:
        return "";
    }
  };

  // Chair가 업로드한 문서인지 확인
  const isChairUpload = document.uploader === 'chair';

  const typeInfo = getTypeInfo(document.type);
  const baseHeight = "h-12"; // 높이를 더 줄임
  const typeLabel = getTypeLabel(document.type, revisionIndex);

  return (
    <Card
      className={cn(
        "w-full transition-all duration-300 hover:shadow-lg border-2 border-gray-300 shadow-md flex relative",
        baseHeight,
        document.status === "rejected" && "opacity-60",
        isLatest ? "bg-yellow-50 border-yellow-300" : 
        isChairUpload ? "bg-gray-100 border-gray-400" : "bg-white" // Chair 업로드는 회색 배경
      )}
    >
      {/* 타입 라벨 - 왼쪽 중앙 */}
      {typeLabel && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-bold text-gray-400 select-none pointer-events-none w-8 flex items-center justify-center">
          {typeLabel}
        </div>
      )}
      
      <CardHeader className="pb-1 px-3 pt-3 flex-1">
        <div className="flex items-center h-full">
          {/* 파일명 - 왼쪽에 배치, 타입 라벨 공간 확보 */}
          <div className="flex-1 min-w-0 pr-8 pl-10">
            <CardTitle
              className="font-semibold leading-tight text-sm truncate" 
              title={document.fileName || document.name}
            >
              {document.fileName || document.name}
            </CardTitle>
            
            {/* 업로더와 날짜 정보 */}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>
                {new Date(document.uploadDate).toLocaleDateString("ko-KR")}
              </span>
              {document.uploader && (
                <>
                  <span>•</span>
                  <span>by {document.uploader}</span>
                </>
              )}
            </div>
          </div>
          
          {/* 버튼들 - 오른쪽에 배치 */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-6 w-6 p-0 hover:bg-blue-100"
                title="다운로드"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={!canDelete}
                className={cn(
                  "h-6 w-6 p-0",
                  canDelete ? "hover:bg-red-100" : "opacity-50 cursor-not-allowed"
                )}
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}