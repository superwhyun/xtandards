import React from "react";
import DocumentCard from "@/components/DocumentCard";
import ConnectionLine from "@/components/ConnectionLine";
import DropZone from "@/components/DropZone";
import StatusSelector from "@/components/StatusSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Upload, CheckCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: "previous" | "proposal" | "revision" | "result";
  uploadDate: string;
  connections: string[];
  status?: "accepted" | "withdrawn" | "rejected" | "pending";
  filePath?: string;
}

interface Meeting {
  id: string;
  date: string;
  title: string;
  description?: string;
  previousDocument?: Document;
  proposals: Document[];
  revisions: { [proposalId: string]: Document[] };
  resultDocument?: Document;
  resultRevisions: Document[];
  isCompleted: boolean;
}

interface MeetingTabProps {
  meeting: Meeting;
  acronym: string;
  onFileUpload: (type: string, proposalId?: string) => void;
  onComplete: () => void;
  onStatusChange: (proposalId: string, status: "accepted" | "withdrawn" | "rejected") => void;
}

export default function MeetingTab({
  meeting,
  acronym,
  onFileUpload,
  onComplete,
  onStatusChange,
}: MeetingTabProps) {
  const handleDownload = (filePath: string, fileName: string) => {
    // 실제 다운로드 로직 필요
    console.log('다운로드:', filePath, fileName);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-12 gap-6 min-h-[500px]">
        {/* Base Document */}
        <div className="col-span-2">
          <div className="sticky top-4">
            <div className="bg-slate-100 rounded-lg p-3 mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                Base Document
              </h3>
            </div>
            {meeting.previousDocument ? (
              <DocumentCard
                document={meeting.previousDocument}
                onDownload={() => handleDownload(meeting.previousDocument!.filePath!, meeting.previousDocument!.name)}
              />
            ) : (
              <div className="space-y-4">
                <Card className="w-48 h-40 border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Base 문서 없음</p>
                    </div>
                  </CardContent>
                </Card>
                {!meeting.isCompleted && (
                  <DropZone onDrop={() => onFileUpload("base")} className="w-48">
                    <div className="text-center">
                      <div className="bg-slate-100 rounded-full p-3 mb-2 mx-auto w-fit">
                        <Upload className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-slate-700 font-medium text-sm">Base 문서 업로드</p>
                    </div>
                  </DropZone>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 기고서 및 수정본 */}
        <div className="col-span-7">
          <div className="bg-blue-100 rounded-lg p-3 mb-4">
            <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              기고서 및 수정본
            </h3>
          </div>
          <div className="space-y-6">
            {meeting.proposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                <div className="flex items-start gap-4 overflow-x-auto pb-2">
                  <DocumentCard
                    document={proposal}
                    showConnections={true}
                    onDownload={() => handleDownload(proposal.filePath!, proposal.name)}
                  />

                  <ConnectionLine fromAccepted={proposal.status === "accepted"} />

                  {meeting.revisions[proposal.id]?.map((revision) => (
                    <div key={revision.id} className="flex items-center gap-4">
                      <DocumentCard
                        document={revision}
                        variant="small"
                        onDownload={() => handleDownload(revision.filePath!, revision.name)}
                      />
                      <ConnectionLine fromAccepted={revision.status === "accepted"} variant="small" />
                    </div>
                  ))}

                  {!meeting.isCompleted && (
                    <DropZone onDrop={() => onFileUpload("revision", proposal.id)} variant="small" />
                  )}

                  {!meeting.isCompleted && (
                    <StatusSelector
                      currentStatus={proposal.status}
                      onStatusChange={(status) => onStatusChange(proposal.id, status)}
                    />
                  )}
                </div>
              </div>
            ))}

            {!meeting.isCompleted && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-dashed border-blue-200">
                <DropZone onDrop={() => onFileUpload("proposal")} className="mx-auto">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-4 mb-3 mx-auto w-fit">
                      <Plus className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-blue-700 font-medium">새 기고서 추가</p>
                    <p className="text-blue-600 text-sm mt-1">파일을 드래그하여 업로드</p>
                  </div>
                </DropZone>
              </div>
            )}
          </div>
        </div>

        {/* Output Document */}
        <div className="col-span-3">
          <div className="sticky top-4">
            <div className="space-y-4">
              {meeting.resultDocument ? (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center gap-4">
                    <DocumentCard
                      document={meeting.resultDocument}
                      showConnections={true}
                      onDownload={() => handleDownload(meeting.resultDocument!.filePath!, meeting.resultDocument!.name)}
                    />

                    {meeting.resultRevisions.map((revision) => (
                      <div key={revision.id} className="flex flex-col items-center gap-2">
                        <ConnectionLine />
                        <DocumentCard
                          document={revision}
                          variant="small"
                          onDownload={() => handleDownload(revision.filePath!, revision.name)}
                        />
                      </div>
                    ))}

                    {!meeting.isCompleted && (
                      <>
                        <ConnectionLine variant="small" />
                        <DropZone onDrop={() => onFileUpload("result-revision")} variant="small" />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                !meeting.isCompleted && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-dashed border-green-200">
                    <DropZone onDrop={() => onFileUpload("result")} className="mx-auto">
                      <div className="text-center">
                        <div className="bg-green-100 rounded-full p-4 mb-3 mx-auto w-fit">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-green-700 font-medium">Output 문서 업로드</p>
                        <p className="text-green-600 text-sm mt-1">최종 결과를 업로드하세요</p>
                      </div>
                    </DropZone>
                  </div>
                )
              )}
            </div>

            {meeting.resultDocument && !meeting.isCompleted && (
              <div className="mt-6">
                <Button
                  onClick={onComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Finalize
                </Button>
              </div>
            )}

            {meeting.isCompleted && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4 text-center shadow-lg">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-semibold">회의 완료됨</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}