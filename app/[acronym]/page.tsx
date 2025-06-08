"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Upload, CheckCircle, ArrowRight, Plus, Calendar, Download, Home, LogOut, Settings, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import DropZone from "@/components/DropZone"
import DocumentCard from "@/components/DocumentCard"
import ConnectionLine from "@/components/ConnectionLine"
import StatusSelector from "@/components/StatusSelector"
import NewMeetingDialog from "@/components/NewMeetingDialog"
import EditMeetingDialog from "@/components/EditMeetingDialog"
import MeetingTab from "@/components/MeetingTab"
import LoginScreen, { UserRole, AuthState } from "@/components/auth/LoginScreen"
import SettingsDialog from "@/components/auth/SettingsDialog"
import { useMeetingHandlers } from "@/hooks/useMeetingHandlers"
import MemoSection from "@/components/MemoSection"

import { Document, Meeting } from "@/types/standard"

interface Standard {
  acronym: string
  title: string
  meetings: Meeting[]
}

// 서버에서 메모 로드 함수
const loadMemosFromServer = async (acronym: string, meetingDate: string): Promise<{ [key: string]: string }> => {
  try {
    const response = await fetch(`/api/memo?acronym=${acronym}&meetingDate=${meetingDate}`)
    if (response.ok) {
      const result = await response.json()
      return result.memos || {}
    }
  } catch (error) {
    console.error('메모 로드 오류:', error)
  }
  return {}
}

import { getStandardData, saveStandardData } from "@/lib/standardData"

// 페이지 컴포넌트 정의
function AcronymPage() {
  const params = useParams()
  const acronym = params.acronym as string
  
  // 인증 상태 관리
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editMeetingOpen, setEditMeetingOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  
  // 상태 및 핸들러 함수 복구
  const [standard, setStandard] = useState<Standard | null>(null)
  const [activeMeetingId, setActiveMeetingId] = useState<string>("")
  const [expandedMemos, setExpandedMemos] = useState<{ [key: string]: boolean }>({}) // 메모 확장 상태

  const handleLogin = (role: UserRole, password: string, username?: string): boolean => {
    const chairPassword = localStorage.getItem('chairPassword') || 'chair'
    const contributorPassword = localStorage.getItem('contributorPassword') || 'cont'
    
    const isValid = (role === 'chair' && password === chairPassword) || 
                   (role === 'contributor' && password === contributorPassword)
    
    if (isValid) {
      const authState = {
        isAuthenticated: true,
        role,
        user: username || role
      }
      setAuth(authState)
      // 인증 정보를 localStorage에 저장
      localStorage.setItem('authState', JSON.stringify(authState))
      return true
    }
    return false
  }

  const handleLogout = () => {
    const authState = {
      isAuthenticated: false,
      role: null,
      user: null
    }
    setAuth(authState)
    // localStorage에서 인증 정보 삭제
    localStorage.removeItem('authState')
  }

  useEffect(() => {
    // 저장된 인증 정보 복원
    const savedAuth = localStorage.getItem('authState')
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth)
        setAuth(parsedAuth)
      } catch (error) {
        console.error('인증 정보 복원 실패:', error)
      }
    }

    if (acronym) {
      const standardData = getStandardData(acronym)
      if (standardData) {
        setStandard(standardData)
        // activeMeetingId가 설정되지 않았거나, 설정된 미팅이 더 이상 존재하지 않을 때만 마지막 미팅으로 설정
        if (standardData.meetings.length > 0 && 
            (!activeMeetingId || !standardData.meetings.find(m => m.id === activeMeetingId))) {
          setActiveMeetingId(standardData.meetings[standardData.meetings.length - 1].id)
        }
      } else {
        // 표준문서가 없으면 새로 생성
        const newStandard: Standard = {
          acronym: acronym,
          title: `${acronym} 표준문서`,
          meetings: []
        }
        setStandard(newStandard)
        saveStandardData(newStandard)
      }
    }
    
    // 터치패드 스와이프로 인한 뒤로가기 방지
    const preventSwipeBack = (e: TouchEvent) => {
      // 가로 스크롤 컨테이너 내에서의 터치는 기본 동작 방지
      const target = e.target as Element
      if (target.closest('.custom-scrollbar')) {
        if (e.touches.length === 1) {
          e.preventDefault()
        }
      }
    }
    
    const preventMouseBack = (e: MouseEvent) => {
      // 마우스 뒤로가기 버튼 방지
      if (e.button === 3 || e.button === 4) {
        e.preventDefault()
      }
    }
    
    document.addEventListener('touchstart', preventSwipeBack, { passive: false })
    document.addEventListener('mousedown', preventMouseBack)
    
    return () => {
      document.removeEventListener('touchstart', preventSwipeBack)
      document.removeEventListener('mousedown', preventMouseBack)
    }
  }, [acronym])

  // 활성 회의 변경 시 서버에서 메모 로드
  useEffect(() => {
    if (standard && activeMeetingId) {
      const meeting = standard.meetings.find(m => m.id === activeMeetingId)
      if (meeting) {
        const loadMemos = async () => {
          const serverMemos = await loadMemosFromServer(standard.acronym, meeting.date)
          
          // 서버에서 가져온 메모가 있으면 로컬 상태 업데이트
          if (Object.keys(serverMemos).length > 0) {
            const updatedStandard = {
              ...standard,
              meetings: standard.meetings.map(m => {
                if (m.id === activeMeetingId) {
                  return {
                    ...m,
                    memos: { ...m.memos, ...serverMemos }
                  }
                }
                return m
              })
            }
            setStandard(updatedStandard)
            saveStandardData(updatedStandard)
          }
        }
        
        loadMemos()
      }
    }
  }, [standard?.acronym, activeMeetingId])

  const updateStandard = (updatedStandard: Standard) => {
    setStandard(updatedStandard)
    saveStandardData(updatedStandard)
  }

const { handleEditMeeting, handleSaveMeeting, handleFileUpload } = useMeetingHandlers(standard, setStandard, updateStandard, auth.user || undefined)

  // 메모 토글 핸들러
  const handleMemoToggle = useCallback((proposalId: string) => {
    setExpandedMemos(prev => ({
      ...prev,
      [proposalId]: !prev[proposalId]
    }))
  }, [])

  // 메모 업데이트 핸들러
  const handleMemoUpdate = useCallback(async (meetingId: string, proposalId: string, memo: string) => {
    if (!standard) return

    console.log('메모 업데이트:', { meetingId, proposalId, memo }) // 디버깅용

    // 해당 proposal 찾기
    const meeting = standard.meetings.find(m => m.id === meetingId)
    const proposal = meeting?.proposals.find(p => p.id === proposalId)
    
    if (!proposal) {
      console.error('해당 기고서를 찾을 수 없습니다')
      return
    }

    try {
      // 서버에 메모 저장
      const response = await fetch('/api/memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acronym: standard.acronym,
          meetingDate: meeting.date, // meetingId 대신 meetingDate 사용
          proposalId,
          proposalName: proposal.name,
          memo
        })
      })

      if (!response.ok) {
        const result = await response.json()
        console.error('메모 저장 실패:', result.error)
        return
      }

      // 로컬 상태 업데이트 (UI 반영용)
      const updatedStandard = {
        ...standard,
        meetings: standard.meetings.map((meeting) => {
          if (meeting.id === meetingId) {
            return {
              ...meeting,
              memos: {
                ...meeting.memos,
                [proposalId]: memo
              }
            }
          }
          return meeting
        }),
      }
      
      setStandard(updatedStandard)
      saveStandardData(updatedStandard) // localStorage에도 저장 (백업용)
      console.log('메모 저장 완료:', updatedStandard) // 디버깅용
      
    } catch (error) {
      console.error('메모 저장 오류:', error)
    }
  }, [standard])

  // 파일 삭제 핸들러
  const handleFileDelete = useCallback(async (documentId: string, meetingId: string, type: string, proposalId?: string, filePath?: string) => {
    if (!standard) return

    // 실제 파일 삭제 API 호출
    if (filePath) {
      try {
        const response = await fetch(`/api/delete?path=${encodeURIComponent(filePath)}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const result = await response.json();
          alert(`파일 삭제 실패: ${result.error}`);
          return;
        }
      } catch (error) {
        console.error('파일 삭제 오류:', error);
        alert('파일 삭제 중 오류가 발생했습니다');
        return;
      }
    }

    const updatedStandard = { ...standard }
    const meetingIndex = updatedStandard.meetings.findIndex(m => m.id === meetingId)
    
    if (meetingIndex !== -1) {
      const meeting = updatedStandard.meetings[meetingIndex]
      
      switch (type) {
        case 'base':
          meeting.previousDocument = undefined
          break
        case 'proposal':
          meeting.proposals = meeting.proposals.filter(p => p.id !== documentId)
          // 해당 proposal의 revision도 모두 삭제
          if (proposalId) {
            delete meeting.revisions[proposalId]
          }
          break
        case 'revision':
          if (proposalId && meeting.revisions[proposalId]) {
            meeting.revisions[proposalId] = meeting.revisions[proposalId].filter(r => r.id !== documentId)
            if (meeting.revisions[proposalId].length === 0) {
              delete meeting.revisions[proposalId]
            }
          }
          break
        case 'result':
          meeting.resultDocument = undefined
          break
        case 'result-revision':
          meeting.resultRevisions = meeting.resultRevisions.filter(r => r.id !== documentId)
          break
      }
      
      updateStandard(updatedStandard)
    }
  }, [standard])
  const handleStatusChange = useCallback((meetingId: string, proposalId: string, status: "accepted" | "review" | "rejected") => {
    if (!standard) return
    
    const updatedStandard = {
      ...standard,
      meetings: standard.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          return {
            ...meeting,
            proposals: meeting.proposals.map((proposal) =>
              proposal.id === proposalId ? { ...proposal, status } : proposal
            ),
            revisions: Object.fromEntries(
              Object.entries(meeting.revisions).map(([propId, revs]) => [
                propId,
                propId === proposalId
                  ? (Array.isArray(revs) ? revs.map((rev: any) => ({ ...rev, status })) : revs)
                  : revs
              ])
            )
          }
        }
        return meeting
      }),
    }
    updateStandard(updatedStandard)
  }, [standard])

  // 회의 완료/되돌리기 핸들러
  const handleMeetingToggle = useCallback((meetingId: string) => {
    if (!standard) return
    
    const meetings = [...standard.meetings]
    const meetingIndex = meetings.findIndex((m) => m.id === meetingId)
    if (meetingIndex !== -1) {
      meetings[meetingIndex] = {
        ...meetings[meetingIndex],
        isCompleted: !meetings[meetingIndex].isCompleted,
      }
      updateStandard({ ...standard, meetings })
    }
  }, [standard])

  // 회의 삭제 핸들러
  const handleDeleteMeeting = useCallback(async (meetingId: string) => {
    if (!standard) return
    
    const meetingToDelete = standard.meetings.find(m => m.id === meetingId);
    if (!meetingToDelete || meetingToDelete.isCompleted) {
      alert('완료된 회의는 삭제할 수 없습니다');
      return;
    }

    if (!confirm('정말 이 회의를 삭제하시겠습니까? 모든 업로드된 파일도 함께 삭제됩니다.')) {
      return;
    }

    // 관련 파일들 삭제 (날짜 기반 폴더의 모든 파일)
    const filesToDelete: string[] = [];
    const meetingDate = meetingToDelete.date;
    
    // C 폴더와 OD 폴더의 모든 파일들을 삭제 대상에 추가
    try {
      // 실제로는 전체 날짜 폴더를 삭제하는 것이 더 효율적이지만
      // 현재 구조에서는 개별 파일 삭제로 처리
      if (meetingToDelete.previousDocument?.filePath) {
        filesToDelete.push(meetingToDelete.previousDocument.filePath);
      }
      
      meetingToDelete.proposals.forEach(proposal => {
        if (proposal.filePath) filesToDelete.push(proposal.filePath);
      });
      
      Object.values(meetingToDelete.revisions).forEach(revisions => {
        revisions.forEach(revision => {
          if (revision.filePath) filesToDelete.push(revision.filePath);
        });
      });
      
      if (meetingToDelete.resultDocument?.filePath) {
        filesToDelete.push(meetingToDelete.resultDocument.filePath);
      }
      
      meetingToDelete.resultRevisions.forEach(revision => {
        if (revision.filePath) filesToDelete.push(revision.filePath);
      });

      // 메모 파일들도 삭제 (C 폴더의 .json 파일들)
      meetingToDelete.proposals.forEach(proposal => {
        const baseName = proposal.name.split('.')[0];
        const memoPath = `data/${standard.acronym}/${meetingDate}/C/${baseName}.json`;
        filesToDelete.push(memoPath);
      });
    } catch (error) {
      console.error('파일 목록 구성 오류:', error);
    }

    // 파일들 순차적으로 삭제
    for (const filePath of filesToDelete) {
      try {
        await fetch(`/api/delete?path=${encodeURIComponent(filePath)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('파일 삭제 오류:', error);
      }
    }

    // 회의 데이터에서 제거
    const updatedStandard = {
      ...standard,
      meetings: standard.meetings.filter(m => m.id !== meetingId)
    };
    
    updateStandard(updatedStandard);
    
    // 활성 회의 변경
    if (activeMeetingId === meetingId) {
      const remainingMeetings = updatedStandard.meetings;
      if (remainingMeetings.length > 0) {
        setActiveMeetingId(remainingMeetings[remainingMeetings.length - 1].id);
      } else {
        setActiveMeetingId('');
      }
    }
  }, [standard, activeMeetingId])

  // 새 회의 추가 핸들러
  const handleCreateMeeting = useCallback((meeting: { date: string; title: string; description?: string }) => {
    if (!standard) return
    
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      date: meeting.date,
      title: meeting.title,
      description: meeting.description,
      proposals: [],
      revisions: {},
      resultRevisions: [],
      isCompleted: false,
      memos: {} // 메모 필드 초기화
    }

    // 이전 회의가 있고 완료된 경우, 마지막 회의의 Output Document를 Base Document로 설정
    const completedMeetings = standard.meetings.filter(m => m.isCompleted);
    if (completedMeetings.length > 0) {
      const lastCompletedMeeting = completedMeetings[completedMeetings.length - 1];
      if (lastCompletedMeeting.resultDocument) {
        // Output Document의 마지막 revision이 있으면 그걸 사용, 없으면 기본 resultDocument 사용
        const lastRevision = lastCompletedMeeting.resultRevisions.length > 0 
          ? lastCompletedMeeting.resultRevisions[lastCompletedMeeting.resultRevisions.length - 1]
          : lastCompletedMeeting.resultDocument;
        
        newMeeting.previousDocument = {
          ...lastRevision,
          id: `base-${Date.now()}`,
          type: "previous"
        };
      }
    }
    
    const updatedStandard = {
      ...standard,
      meetings: [...standard.meetings, newMeeting]
    }
    updateStandard(updatedStandard)
    setActiveMeetingId(newMeeting.id)
  }, [standard])

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (!standard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-2">로딩 중...</h1>
          <p className="text-gray-500">표준문서 데이터를 불러오고 있습니다.</p>
        </div>
      </div>
    )
  }


function ConnectionLine({ 
  fromAccepted = true, 
  variant = "default" 
}: { 
  fromAccepted?: boolean
  variant?: "default" | "small"
}) {
  const lineWidth = variant === "small" ? "w-6" : "w-8"
  const lineColor = fromAccepted ? "from-green-400 to-blue-400" : "from-gray-300 to-gray-400"
  const arrowColor = fromAccepted ? "text-blue-500" : "text-gray-400"

  return (
    <div className="flex items-center justify-center px-2">
      <div className={cn("h-0.5 bg-gradient-to-r relative", lineWidth, lineColor)}>
        <ArrowRight className={cn("h-3 w-3 absolute -right-1 -top-1", arrowColor)} />
      </div>
    </div>
  )
}

function StatusSelector({
  currentStatus,
  onStatusChange,
}: {
  currentStatus?: string
  onStatusChange: (status: "accepted" | "review" | "rejected") => void
}) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <p className="text-sm font-medium text-gray-700 mb-2">상태 선택</p>
      <div className="flex flex-col gap-1">
        <Button
          variant={currentStatus === "accepted" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("accepted")}
          className={cn(
            "w-full justify-start",
            currentStatus === "accepted" && "bg-green-500 hover:bg-green-600"
          )}
        >
          ✓ Accept
        </Button>
        <Button
          variant={currentStatus === "review" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("review")}
          className={cn(
            "w-full justify-start",
            currentStatus === "review" && "bg-yellow-500 hover:bg-yellow-600"
          )}
        >
          ⏸ Review
        </Button>
        <Button
          variant={currentStatus === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("rejected")}
          className={cn(
            "w-full justify-start",
            currentStatus === "rejected" && "bg-red-500 hover:bg-red-600"
          )}
        >
          ✗ Reject
        </Button>
      </div>
    </div>
  )
}


// 메모 컴포넌트를 별도로 분리

function MeetingTab({
  meeting,
  acronym,
  userRole,
  onFileUpload,
  onComplete,
  onStatusChange,
  onFileDelete,
  onMemoToggle,
  onMemoUpdate,
  expandedMemos,
}: {
  meeting: Meeting
  acronym: string
  userRole: UserRole
  onFileUpload: (files: FileList, type: string, proposalId?: string) => void
  onComplete: () => void
  onStatusChange: (proposalId: string, status: "accepted" | "review" | "rejected") => void
  onFileDelete: (documentId: string, type: string, proposalId?: string, filePath?: string) => void
  onMemoToggle: (proposalId: string) => void
  onMemoUpdate: (proposalId: string, memo: string) => void
  expandedMemos: { [key: string]: boolean }
}) {
  const [localMemos, setLocalMemos] = useState<{ [key: string]: string }>({})
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // 컴포넌트 마운트시 기존 메모 로드 (한 번만)
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
    console.log('메모 저장 (blur):', proposalId, value) // 디버깅용
  }, [onMemoUpdate])

  return (
    <div className="space-y-8">
      {/* 모바일에서는 세로 스택, 데스크톱에서는 가로 그리드 */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6 min-h-[500px]">
        {/* Base Document */}
        <div className="xl:col-span-2">
          <div className="xl:sticky xl:top-4">
            <div className="bg-slate-100 rounded-lg p-3 mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                Base Document
              </h3>
            </div>
            {meeting.previousDocument ? (
              <div className="flex justify-center xl:block">
                <DocumentCard 
                  document={meeting.previousDocument} 
                  onDownload={() => handleDownload(meeting.previousDocument!.filePath!, meeting.previousDocument!.name)}
                  onDelete={() => onFileDelete(meeting.previousDocument!.id, "base", undefined, meeting.previousDocument!.filePath)}
                  canDelete={true}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="w-48 h-40 border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 mx-auto xl:mx-0">
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Base 문서 없음</p>
                    </div>
                  </CardContent>
                </Card>
                {!meeting.isCompleted && userRole === 'chair' && (
                  <div className="flex justify-center xl:block">
                    <DropZone onDrop={(files) => onFileUpload(files, "base")} className="w-48">
                      <div className="text-center">
                        <div className="bg-slate-100 rounded-full p-3 mb-2 mx-auto w-fit">
                          <Upload className="h-6 w-6 text-slate-600" />
                        </div>
                        <p className="text-slate-700 font-medium text-sm">Base 문서 업로드</p>
                      </div>
                    </DropZone>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 기고서 및 수정본 */}
        <div className="xl:col-span-7">
          <div className="bg-blue-100 rounded-lg p-3 mb-4">
            <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              기고서 및 수정본
            </h3>
          </div>
          <div className="space-y-6">
            {meeting.proposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {/* 기고서 */}
                  <div className="flex-shrink-0">
                    <DocumentCard 
                      document={proposal} 
                      showConnections={true} 
                      onDownload={() => handleDownload(proposal.filePath!, proposal.name)}
                      onDelete={() => onFileDelete(proposal.id, "proposal", proposal.id, proposal.filePath)}
                      onMemoClick={() => onMemoToggle(proposal.id)}
                      canDelete={!meeting.revisions[proposal.id] || meeting.revisions[proposal.id].length === 0}
                    />
                  </div>

                  {/* 수정본들 */}
                  {meeting.revisions[proposal.id]?.map((revision, index) => {
                    const isLastRevision = index === meeting.revisions[proposal.id].length - 1
                    return (
                      <div key={revision.id} className="flex-shrink-0">
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

                  {/* 드롭존 - Accept 상태일 때 숨김 */}
                  {!meeting.isCompleted && proposal.status !== "accepted" && (
                    <div className="flex-shrink-0">
                      <DropZone onDrop={(files) => onFileUpload(files, "revision", proposal.id)} />
                    </div>
                  )}

                  {/* 상태선택 (오른쪽 끝) - Chair만 접근 가능 */}
                  {!meeting.isCompleted && userRole === 'chair' && (
                    <div className="flex-shrink-0 ml-4">
                      <StatusSelector
                        currentStatus={proposal.status}
                        onStatusChange={(status) => onStatusChange(proposal.id, status)}
                      />
                    </div>
                  )}
                </div>

                {/* 메모 영역 (새로운 컴포넌트 사용) */}
                <MemoSection
                  proposal={proposal}
                  isExpanded={expandedMemos[proposal.id] || false}
                  memo={localMemos[proposal.id] || ''}
                  onMemoChange={(value) => handleMemoChange(proposal.id, value)}
                  onMemoBlur={(value) => handleMemoBlur(proposal.id, value)}
                />
              </div>
            ))}

            {!meeting.isCompleted && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-dashed border-blue-200">
                <DropZone onDrop={(files) => onFileUpload(files, "proposal")} className="mx-auto">
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
        <div className="xl:col-span-3">
          <div className="xl:sticky xl:top-4">
            <div className="bg-green-100 rounded-lg p-3 mb-4">
              <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                Output Document
              </h3>
            </div>
            <div className="space-y-4">
              {meeting.resultDocument ? (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center gap-4">
                    <DocumentCard
                      document={meeting.resultDocument}
                      showConnections={true}
                      onDownload={() => handleDownload(meeting.resultDocument!.filePath!, meeting.resultDocument!.name)}
                      onDelete={() => onFileDelete(meeting.resultDocument!.id, "result", undefined, meeting.resultDocument!.filePath)}
                      canDelete={meeting.resultRevisions.length === 0}
                    />

                    {meeting.resultRevisions.map((revision, index) => {
                      const isLastRevision = index === meeting.resultRevisions.length - 1
                      return (
                        <div key={revision.id} className="flex flex-col items-center gap-2">
                          <ConnectionLine />
                          <DocumentCard 
                            document={revision} 
                            onDownload={() => handleDownload(revision.filePath!, revision.name)}
                            onDelete={() => onFileDelete(revision.id, "result-revision", undefined, revision.filePath)}
                            canDelete={isLastRevision}
                            isLatest={isLastRevision}
                            revisionIndex={index}
                          />
                        </div>
                      )
                    })}

                    {!meeting.isCompleted && userRole === 'chair' && (
                      <>
                        <ConnectionLine />
                        <DropZone onDrop={(files) => onFileUpload(files, "result-revision")} />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                !meeting.isCompleted && userRole === 'chair' && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-dashed border-green-200">
                    <div className="flex justify-center">
                      <DropZone onDrop={(files) => onFileUpload(files, "result")} className="mx-auto">
                        <div className="text-center">
                          <div className="bg-green-100 rounded-full p-4 mb-3 mx-auto w-fit">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-green-700 font-medium">Output 문서 업로드</p>
                          <p className="text-green-600 text-sm mt-1">최종 결과를 업로드하세요</p>
                        </div>
                      </DropZone>
                    </div>
                  </div>
                )
              )}
              
              {/* 승인된 문서들 목록 */}
              {(() => {
                const acceptedProposals = meeting.proposals.filter(p => p.status === 'accepted');
                
                return acceptedProposals.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-3">승인된 기고서들</h4>
                    <div className="space-y-3">
                      {acceptedProposals.map(proposal => {
                        const revisionCount = meeting.revisions[proposal.id]?.length || 0;
                        const memo = meeting.memos?.[proposal.id] || '';
                        
                        return (
                          <div key={proposal.id} className="bg-white rounded-md p-3 border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-800 truncate">{proposal.name}</span>
                            </div>
                            {memo && (
                              <div className="text-xs text-green-700 mb-1 italic">
                                논의: {memo}
                              </div>
                            )}
                            <div className="text-xs text-green-600">
                              {revisionCount > 0 ? `${revisionCount}번의 수정을 거쳐 최종 반영` : '최초 제출본 반영'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {meeting.resultDocument && userRole === 'chair' && (
              <div className="mt-6">
                <Button
                  onClick={onComplete}
                  className={cn(
                    "w-full shadow-lg hover:shadow-xl transition-all duration-300",
                    meeting.isCompleted 
                      ? "bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  )}
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {meeting.isCompleted ? "완료 취소" : "Finalize"}
                </Button>
              </div>
            )}

            {meeting.isCompleted && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4 text-center shadow-lg">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-semibold">회의 완료됨</p>
                  <p className="text-sm text-green-100 mt-1">위 버튼으로 완료를 취소할 수 있습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex flex-col lg:flex-row">
        {/* 모바일 헤더 */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {standard.acronym}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{standard.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600">
                <span className={`font-medium ${auth.role === 'chair' ? 'text-blue-600' : 'text-green-600'}`}>
                  {auth.role === 'chair' ? 'Chair' : 'Contributor'}
                </span>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  홈
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="w-full lg:w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            {/* 홈으로 버튼 */}
            <div className="flex flex-col gap-2 mb-4">
              <Link href="/" className="block">
                <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  홈으로
                </Button>
              </Link>
              <div className="flex gap-2">
                {auth.role === 'chair' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettingsOpen(true)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    설정
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex-1 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>

            {/* 데스크톱 헤더 */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {standard.acronym}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{standard.title}</p>
              <div className="text-xs text-gray-600 mt-2">
                <span className={`font-medium ${auth.role === 'chair' ? 'text-blue-600' : 'text-green-600'}`}>
                  {auth.role === 'chair' ? 'Chair' : 'Contributor'}
                </span>
                로 로그인됨
              </div>
            </div>

            {/* 회의 탭들 */}
            <div className="space-y-2 max-h-screen lg:max-h-none overflow-y-auto">
              {standard.meetings.map((meeting) => (
                <div key={meeting.id} className="relative group">
                  <button
                    onClick={() => setActiveMeetingId(meeting.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200",
                      activeMeetingId === meeting.id
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{meeting.title}</p>
                        <p className={cn(
                          "text-xs truncate",
                          activeMeetingId === meeting.id ? "text-blue-100" : "text-gray-500"
                        )}>
                          {new Date(meeting.date).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      {meeting.isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {/* 회의 수정/삭제 버튼 - Chair만 접근 가능 */}
                  {auth.role === 'chair' && !meeting.isCompleted && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMeeting(meeting, setEditingMeeting, setEditMeetingOpen);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 text-xs"
                        title="회의 수정"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMeeting(meeting.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                        title="회의 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {auth.role === 'chair' && <NewMeetingDialog onCreateMeeting={handleCreateMeeting} />}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 p-4 lg:p-6 overflow-x-auto">
          {standard.meetings.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-600 mb-2">회의가 없습니다</h2>
                <p className="text-gray-500">새 회의를 추가하여 시작하세요.</p>
              </div>
            </div>
          ) : (
            standard.meetings
              .filter(meeting => meeting.id === activeMeetingId)
              .map((meeting) => (
                <MeetingTab
                  key={meeting.id}
                  meeting={meeting}
                  acronym={standard.acronym}
                  userRole={auth.role!}
                  onFileUpload={(files, type, proposalId) => handleFileUpload(files, meeting.id, type, proposalId)}
                  onComplete={() => handleMeetingToggle(meeting.id)}
                  onStatusChange={(proposalId, status) => handleStatusChange(meeting.id, proposalId, status)}
                  onFileDelete={(documentId, type, proposalId, filePath) => handleFileDelete(documentId, meeting.id, type, proposalId, filePath)}
                  onMemoToggle={handleMemoToggle}
                  onMemoUpdate={(proposalId, memo) => handleMemoUpdate(meeting.id, proposalId, memo)}
                  expandedMemos={expandedMemos}
                />
              ))
          )}
        </div>
      </div>

      {auth.role === 'chair' && (
        <SettingsDialog isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
      )}

      {auth.role === 'chair' && (
        <EditMeetingDialog 
          meeting={editingMeeting}
          isOpen={editMeetingOpen}
          onOpenChange={setEditMeetingOpen}
          onSave={handleSaveMeeting}
        />
      )}
    </div>
  )
}

export default AcronymPage