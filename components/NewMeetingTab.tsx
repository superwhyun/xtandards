import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Plus, ChevronDown, ChevronRight, FileText, GripVertical } from "lucide-react"
import DropZone from "@/components/DropZone"
import DocumentCard from "@/components/DocumentCard"
import MemoSection from "@/components/MemoSection"
import { Meeting } from "@/types/standard"
import { UserRole } from "@/components/auth/LoginScreen"

interface NewMeetingTabProps {
  meeting: Meeting
  acronym: string
  userRole: UserRole
  onFileUpload: (files: FileList, type: string, proposalId?: string) => void
  onComplete: () => void
  onStatusChange: (proposalId: string, status: "accepted" | "review" | "rejected") => void
  onFileDelete: (documentId: string, type: string, proposalId?: string, filePath?: string) => void
  onMemoToggle: (proposalId: string) => void
  onMemoUpdate: (proposalId: string, memo: string) => void
  onProposalReorder: (reorderedProposals: any[]) => void // 순서 변경 핸들러 추가
  expandedMemos: { [key: string]: boolean }
}

export default function NewMeetingTab({
  meeting,
  acronym,
  userRole,
  onFileUpload,
  onComplete,
  onStatusChange,
  onFileDelete,
  onMemoToggle,
  onMemoUpdate,
  onProposalReorder,
  expandedMemos
}: NewMeetingTabProps) {
  const [localMemos, setLocalMemos] = useState<{ [key: string]: string }>({})
  const [hasInitialized, setHasInitialized] = useState(false)
  const [collapsedProposals, setCollapsedProposals] = useState<{ [key: string]: boolean }>({})
  const [draggedProposal, setDraggedProposal] = useState<any>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // 초기 로드 시 모든 기고서를 접힌 상태로 설정
  useEffect(() => {
    if (meeting.proposals.length > 0 && Object.keys(collapsedProposals).length === 0) {
      const initialCollapsed: { [key: string]: boolean } = {}
      meeting.proposals.forEach(proposal => {
        initialCollapsed[proposal.id] = true // 기본값을 true(접힌 상태)로 설정
      })
      setCollapsedProposals(initialCollapsed)
    }
  }, [meeting.proposals, collapsedProposals])

  // 기고서 접기/펼치기 토글
  const toggleProposalCollapse = (proposalId: string) => {
    setCollapsedProposals(prev => ({
      ...prev,
      [proposalId]: !prev[proposalId]
    }))
  }

  // 컴포넌트 마운트시 기존 메모 로드
  useEffect(() => {
    if (!hasInitialized && meeting.memos) {
      setLocalMemos(meeting.memos)
      setHasInitialized(true)
    }
  }, [meeting.memos, hasInitialized])

  const handleDownload = (filePath: string, fileName: string) => {
    const downloadUrl = `/api/download?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMemoChange = useCallback((proposalId: string, value: string) => {
    setLocalMemos(prev => ({
      ...prev,
      [proposalId]: value
    }))
  }, [])

  const handleMemoBlur = useCallback((proposalId: string, value: string) => {
    onMemoUpdate(proposalId, value)
  }, [onMemoUpdate])

  // 드래그&드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, proposal: any, index: number) => {
    setDraggedProposal({ proposal, index })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // 요소를 완전히 벗어났을 때만 리셋
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedProposal || draggedProposal.index === dropIndex) {
      setDraggedProposal(null)
      return
    }

    const newProposals = [...meeting.proposals]
    const [movedProposal] = newProposals.splice(draggedProposal.index, 1)
    newProposals.splice(dropIndex, 0, movedProposal)

    onProposalReorder(newProposals)
    setDraggedProposal(null)
  }

  const handleDragEnd = () => {
    setDraggedProposal(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Base Document Section */}
      <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 border-l-4 border-l-blue-500">
        <h2 className="text-xl font-mono font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">
          BASE DOCUMENT
        </h2>
        {meeting.previousDocument ? (
          <div className="w-full">
            <DocumentCard 
              document={meeting.previousDocument} 
              onDownload={() => handleDownload(meeting.previousDocument!.filePath!, meeting.previousDocument!.name)}
              onDelete={() => onFileDelete(meeting.previousDocument!.id, "base", undefined, meeting.previousDocument!.filePath)}
              canDelete={true}
            />
          </div>
        ) : (
          !meeting.isCompleted && userRole === 'chair' ? (
            <DropZone onDrop={(files) => onFileUpload(files, "base")} className="w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600">
              <div className="text-center text-gray-300">
                <Upload className="h-4 w-4 mx-auto mb-1" />
                <p className="font-mono text-xs">[ DROP BASE DOCUMENT HERE ]</p>
              </div>
            </DropZone>
          ) : (
            <div className="w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded flex items-center justify-center">
              <p className="text-gray-500 font-mono text-xs">[ NO BASE DOCUMENT ]</p>
            </div>
          )
        )}
      </section>

      {/* Proposals Section */}
      <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 border-l-4 border-l-purple-500">
        <h2 className="text-xl font-mono font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">
          CONTRIBUTIONS
        </h2>
        
        <div className="space-y-6">
          {meeting.proposals.map((proposal, index) => {
            const isCollapsed = collapsedProposals[proposal.id]
            const hasRevisions = meeting.revisions[proposal.id] && meeting.revisions[proposal.id].length > 0
            const isDraggedOver = dragOverIndex === index
            const isDragging = draggedProposal?.index === index
            
            return (
              <div 
                key={proposal.id} 
                className={`bg-gray-800 border border-gray-600 rounded-lg p-4 transition-all duration-200 ${
                  isDraggedOver ? 'border-blue-400 bg-gray-700' : ''
                } ${isDragging ? 'opacity-50' : ''}`}
                draggable={userRole === 'chair'} // Chair만 드래그 가능
                onDragStart={(e) => handleDragStart(e, proposal, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* 기고서 헤더 - 제목, 메모 버튼, 상태, 폴드 버튼 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 드래그 핸들 - Chair만 표시 */}
                    {userRole === 'chair' && (
                      <div className="cursor-move text-gray-500 hover:text-gray-300 flex-shrink-0">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                    
                    <span className="text-sm font-mono text-gray-200 break-words">
                      {proposal.name}
                    </span>
                    
                    {/* 상태 표시 */}
                    <span className={`px-2 py-1 rounded text-xs font-mono font-semibold uppercase flex-shrink-0 ${
                      proposal.status === 'accepted' ? 'bg-green-600 text-white' :
                      proposal.status === 'rejected' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {proposal.status === 'accepted' ? 'ACCEPTED' :
                       proposal.status === 'rejected' ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Status Selector for Chair */}
                    {!meeting.isCompleted && userRole === 'chair' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={proposal.status === "accepted" ? "default" : "outline"}
                          onClick={() => onStatusChange(proposal.id, "accepted")}
                          className="h-6 px-2 text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-green-600 hover:text-white hover:border-green-600"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant={proposal.status === "review" ? "default" : "outline"}
                          onClick={() => onStatusChange(proposal.id, "review")}
                          className="h-6 px-2 text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-yellow-600 hover:text-white hover:border-yellow-600"
                        >
                          ⏸
                        </Button>
                        <Button
                          size="sm"
                          variant={proposal.status === "rejected" ? "default" : "outline"}
                          onClick={() => onStatusChange(proposal.id, "rejected")}
                          className="h-6 px-2 text-xs bg-gray-700 border-gray-600 text-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600"
                        >
                          ✗
                        </Button>
                      </div>
                    )}
                    
                    {/* 메모 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 폴드된 상태에서 메모 버튼을 누르면 언폴드하고 메모 표시
                        if (isCollapsed) {
                          setCollapsedProposals(prev => ({
                            ...prev,
                            [proposal.id]: false
                          }))
                        }
                        onMemoToggle(proposal.id)
                      }}
                      className="h-6 w-6 p-0 hover:bg-yellow-600 bg-gray-700 text-gray-300 hover:text-white flex-shrink-0"
                      title="메모"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    
                    {/* 폴드/언폴드 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProposalCollapse(proposal.id)}
                      className="h-6 w-6 p-0 hover:bg-blue-600 bg-gray-700 text-gray-300 hover:text-white"
                      title={isCollapsed ? "펼치기" : "접기"}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* 애니메이션과 함께 접히는 콘텐츠 */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
                }`}>
                  {/* Revision Chain - Vertical */}
                  <div className="space-y-1 mb-4">
                    {/* Original Proposal */}
                    <div className="w-full">
                      <DocumentCard 
                        document={proposal} 
                        showConnections={true} 
                        onDownload={() => handleDownload(proposal.filePath!, proposal.name)}
                        onDelete={() => onFileDelete(proposal.id, "proposal", proposal.id, proposal.filePath)}
                        canDelete={!meeting.revisions[proposal.id] || meeting.revisions[proposal.id].length === 0}
                      />
                    </div>

                    {/* Revisions */}
                    {meeting.revisions[proposal.id]?.map((revision, index) => {
                      const isLastRevision = index === meeting.revisions[proposal.id].length - 1
                      return (
                        <div key={revision.id} className="pl-8">
                          <DocumentCard 
                            document={revision} 
                            onDownload={() => handleDownload(revision.filePath!, revision.name)}
                            onDelete={() => onFileDelete(revision.id, "revision", proposal.id, revision.filePath)}
                            canDelete={isLastRevision}
                            isLatest={isLastRevision}
                            revisionIndex={index}
                          />
                        </div>
                      )
                    })}

                    {/* Revision Dropzone */}
                    {!meeting.isCompleted && proposal.status !== "accepted" && (
                      <div className="pl-8">
                        <DropZone onDrop={(files) => onFileUpload(files, "revision", proposal.id)} className="w-full h-10 bg-gray-800 border-2 border-dashed border-gray-600">
                          <div className="text-center text-gray-400">
                            <p className="font-mono text-xs">[ DROP REVISION HERE ]</p>
                          </div>
                        </DropZone>
                      </div>
                    )}
                  </div>

                  {/* Memo Section */}
                  <MemoSection
                    proposal={proposal}
                    isExpanded={expandedMemos[proposal.id] || false}
                    memo={localMemos[proposal.id] || ''}
                    onMemoChange={(value) => handleMemoChange(proposal.id, value)}
                    onMemoBlur={(value) => handleMemoBlur(proposal.id, value)}
                    onMemoToggle={() => onMemoToggle(proposal.id)}
                  />
                </div>
              </div>
            )
          })}

          {/* New Proposal Dropzone */}
          {!meeting.isCompleted && (
            <DropZone onDrop={(files) => onFileUpload(files, "proposal")} className="w-full h-12 bg-gray-800 border-2 border-dashed border-purple-500">
              <div className="text-center text-purple-300">
                <Plus className="h-4 w-4 mx-auto mb-1" />
                <p className="font-mono text-xs">+ [ DROP NEW PROPOSAL HERE ]</p>
              </div>
            </DropZone>
          )}
        </div>
      </section>

      {/* Output Document Section */}
      <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 border-l-4 border-l-red-500">
        <h2 className="text-xl font-mono font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">
          OUTPUT DOCUMENT
        </h2>
        
        {meeting.resultDocument ? (
          <div className="space-y-1">
            <div className="w-full">
              <DocumentCard
                document={meeting.resultDocument}
                showConnections={true}
                onDownload={() => handleDownload(meeting.resultDocument!.filePath!, meeting.resultDocument!.name)}
                onDelete={() => onFileDelete(meeting.resultDocument!.id, "result", undefined, meeting.resultDocument!.filePath)}
                canDelete={meeting.resultRevisions.length === 0}
              />
            </div>

            {meeting.resultRevisions.map((revision, index) => {
              const isLastRevision = index === meeting.resultRevisions.length - 1
              return (
                <div key={revision.id} className="pl-8">
                  <DocumentCard 
                    document={revision} 
                    onDownload={() => handleDownload(revision.filePath!, revision.name)}
                    onDelete={() => onFileDelete(revision.id, "result-revision", undefined, revision.filePath)}
                    canDelete={isLastRevision}
                    isLatest={isLastRevision}
                  />
                </div>
              )
            })}

            {/* Output Revision Dropzone */}
            {!meeting.isCompleted && userRole === 'chair' && (
              <div className="pl-8">
                <DropZone onDrop={(files) => onFileUpload(files, "result-revision")} className="w-full h-10 bg-gray-800 border-2 border-dashed border-gray-600">
                  <div className="text-center text-gray-400">
                    <p className="font-mono text-xs">[ DROP OUTPUT REVISION HERE ]</p>
                  </div>
                </DropZone>
              </div>
            )}
          </div>
        ) : (
          !meeting.isCompleted && userRole === 'chair' ? (
            <DropZone onDrop={(files) => onFileUpload(files, "result")} className="w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600">
              <div className="text-center text-gray-300">
                <Upload className="h-4 w-4 mx-auto mb-1" />
                <p className="font-mono text-xs">[ DROP OUTPUT DOCUMENT HERE ]</p>
              </div>
            </DropZone>
          ) : (
            <div className="w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded flex items-center justify-center">
              <p className="text-gray-500 font-mono text-xs">[ NO OUTPUT DOCUMENT ]</p>
            </div>
          )
        )}
        
        {/* Output Document에 반영된 기고서 정보 */}
        {(() => {
          const acceptedProposals = meeting.proposals.filter(p => p.status === 'accepted');
          const rejectedProposals = meeting.proposals.filter(p => p.status === 'rejected');
          const hasDecisions = acceptedProposals.length > 0 || rejectedProposals.length > 0;
          
          return hasDecisions && (
            <div className="space-y-3 mt-4">
              {/* 승인된 기고서들 */}
              {acceptedProposals.length > 0 && (
                <div className="bg-gray-800 border border-green-500 rounded-lg p-3">
                  <h4 className="text-xs font-mono font-medium text-green-400 mb-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ACCEPTED PROPOSALS
                  </h4>
                  <div className="space-y-2">
                    {acceptedProposals.map(proposal => {
                      const revisionCount = meeting.revisions[proposal.id]?.length || 0;
                      const memo = localMemos[proposal.id] || meeting.memos?.[proposal.id] || '';
                      
                      return (
                        <div key={proposal.id} className="bg-gray-700 rounded p-2 border border-green-600">
                          <div className="text-xs font-mono font-medium text-green-300 truncate">{proposal.name}</div>
                          {memo && (
                            <div className="text-xs text-gray-300 mt-1 italic bg-gray-600 p-1 rounded">
                              논의: {memo}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {revisionCount > 0 ? `${revisionCount}번 수정 후 반영` : '최초 제출본 반영'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 거절된 기고서들 */}
              {rejectedProposals.length > 0 && (
                <div className="bg-gray-800 border border-red-500 rounded-lg p-3">
                  <h4 className="text-xs font-mono font-medium text-red-400 mb-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    REJECTED PROPOSALS
                  </h4>
                  <div className="space-y-2">
                    {rejectedProposals.map(proposal => {
                      const revisionCount = meeting.revisions[proposal.id]?.length || 0;
                      const memo = localMemos[proposal.id] || meeting.memos?.[proposal.id] || '';
                      
                      return (
                        <div key={proposal.id} className="bg-gray-700 rounded p-2 border border-red-600">
                          <div className="text-xs font-mono font-medium text-red-300 truncate">{proposal.name}</div>
                          {memo && (
                            <div className="text-xs text-gray-300 mt-1 italic bg-gray-600 p-1 rounded">
                              거절 사유: {memo}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {revisionCount > 0 ? `${revisionCount}번 수정 후 거절` : '최초 제출본 거절'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* 승인된 기고서들 요약 */}
      {/* Meeting Controls */}
      {userRole === 'chair' && (
        <section className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-mono">Meeting Status:</span>
            <Button
              onClick={onComplete}
              variant={meeting.isCompleted ? "secondary" : "default"}
              className="font-mono bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              {meeting.isCompleted ? "Reopen Meeting" : "Finalize Meeting"}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
