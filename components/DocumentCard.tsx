import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: "previous" | "proposal" | "revision" | "result";
  uploadDate: string;
  connections: string[];
  status?: "accepted" | "review" | "rejected" | "pending";
  filePath?: string;
}

interface DocumentCardProps {
  document: Document;
  showConnections?: boolean;
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
        "w-48 transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-gray-300 shadow-md",
        baseHeight,
        document.status === "rejected" && "opacity-60",
        isLatest ? "bg-yellow-50 border-yellow-300" : "bg-white" // 최종 수정본 배경색 구분
      )}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <CardTitle
              className="font-semibold leading-tight text-sm" // 한 줄로 표시하되 공간 내에서 최대한 표시
              title={document.name}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-all'
              }}
            >
              {document.name}
            </CardTitle>
          </div>
        </div>
        
        {/* 버튼들 */}
        <div className="flex gap-1 mt-2">
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-6 w-6 p-0 hover:bg-blue-100"
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
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{new Date(document.uploadDate).toLocaleDateString("ko-KR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}