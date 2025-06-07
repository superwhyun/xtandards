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
  onMemoClick?: () => void;
  canDelete?: boolean;
  isLatest?: boolean;
}

export default function DocumentCard({
  document,
  showConnections = false,
  onDownload,
  onDelete,
  onMemoClick,
  canDelete = true,
  isLatest = false,
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

  const typeInfo = getTypeInfo(document.type);
  const baseHeight = "h-44"; // 모든 카드 크기 동일하게

  return (
    <Card
      className={cn(
        "w-48 transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-gray-300 shadow-md flex flex-col",
        baseHeight,
        document.status === "rejected" && "opacity-60",
        isLatest ? "bg-yellow-50 border-yellow-300" : "bg-white" // 최종 수정본 배경색 구분
      )}
    >
      <CardHeader className="pb-1 px-3 pt-3 flex-1">
        <div className="flex flex-col h-full">
          {/* 파일명 - 최대한 공간 활용 */}
          <div className="flex-1 min-h-0">
            <CardTitle
              className="font-semibold leading-tight text-sm mb-2" 
              title={document.name}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3, // 3줄까지 표시
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-all',
                lineHeight: '1.3'
              }}
            >
              {document.name}
            </CardTitle>
          </div>
          
          {/* 버튼들과 날짜를 하단에 고정 */}
          <div className="mt-auto">
            {/* 버튼들 */}
            <div className="flex gap-1 mb-2">
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
              {onMemoClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMemoClick}
                  className="h-6 w-6 p-0 hover:bg-yellow-100"
                  title="메모"
                >
                  <FileText className="h-3 w-3" />
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
            
            {/* 날짜 */}
            <p className="text-xs text-gray-500">
              {new Date(document.uploadDate).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}