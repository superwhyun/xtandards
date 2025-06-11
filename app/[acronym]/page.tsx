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
import NewMeetingTab from "@/components/NewMeetingTab"
import LoginScreen, { UserRole, AuthState } from "@/components/auth/LoginScreen"
import SettingsDialog from "@/components/auth/SettingsDialog"
import { useMeetingHandlers } from "@/hooks/useMeetingHandlers"
import { saveStandardData } from "@/lib/standardData"
import { useAuth } from "@/hooks/useAuth"
import MemoSection from "@/components/MemoSection"

import { Document, Meeting } from "@/types/standard"

interface Standard {
  acronym: string
  title: string
  meetings: Meeting[]
}

// 서버에서 메모 로드 함수
const loadMemosFromServer = async (acronym: string, meetingId: string): Promise<{ [key: string]: string }> => {
  try {
    console.log(`API 호출: GET /api/memo?acronym=${acronym}&meetingId=${meetingId}`)
    const response = await fetch(`/api/memo?acronym=${acronym}&meetingId=${meetingId}`)
    if (response.ok) {
      const result = await response.json()
      return result.memos || {}
    }
  } catch (error) {
    console.error('메모 로드 오류:', error)
  }
  return {}
}



// 페이지 컴포넌트 정의
function AcronymPage() {
  const params = useParams()
  const acronym = params.acronym as string
  const { auth, loading, login, logout } = useAuth()
  
  // 다이얼로그 상태 관리
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editMeetingOpen, setEditMeetingOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  
  // 표준문서 및 회의 상태
  const [standard, setStandard] = useState<Standard | null>(null)
  const [activeMeetingId, setActiveMeetingId] = useState<string>("")
  const [expandedMemos, setExpandedMemos] = useState<{ [key: string]: boolean }>({}) // 메모 확장 상태

  // 인증 관련 함수들은 useAuth 훅에서 제공하므로 제거

  useEffect(() => {
    // 표준문서 데이터 로드
    if (acronym) {
      const loadStandardData = async () => {
        try {
          console.log(`API 호출: GET /api/${acronym}/meetings`)
          const response = await fetch(`/api/${acronym}/meetings`)
          if (response.ok) {
            const standardData = await response.json()
            setStandard(standardData)
            
            // activeMeetingId가 설정되지 않았거나, 설정된 미팅이 더 이상 존재하지 않을 때만 마지막 미팅으로 설정
            if (standardData.meetings.length > 0 && 
                (!activeMeetingId || !standardData.meetings.find(m => m.id === activeMeetingId))) {
              setActiveMeetingId(standardData.meetings[standardData.meetings.length - 1].id)
            }
          } else {
            console.error('표준문서 조회 실패:', response.status)
          }
        } catch (error) {
          console.error('표준문서 조회 오류:', error)
        }
      }
      
      loadStandardData()
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
          const serverMemos = await loadMemosFromServer(standard.acronym, meeting.id)
          
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
            // saveStandardData(updatedStandard) - 서버 API 사용
          }
        }
        
        loadMemos()
      }
    }
  }, [standard?.acronym, activeMeetingId])

  const updateStandard = async (updatedStandard: Standard) => {
    setStandard(updatedStandard)
    
    try {
      // 서버에 업데이트된 표준문서 데이터 저장
      console.log(`API 호출: PUT /api/${acronym}`)
      await fetch(`/api/${acronym}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStandard)
      })
    } catch (error) {
      console.error('표준문서 업데이트 오류:', error)
    }
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
      console.log('API 호출: POST /api/memo')
      const response = await fetch('/api/memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acronym: standard.acronym,
          meetingId: meeting.id,
          proposalId,
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
      // saveStandardData(updatedStandard) - 서버 API 사용
      console.log('메모 저장 완료:', updatedStandard) // 디버깅용
      
    } catch (error) {
      console.error('메모 저장 오류:', error)
    }
  }, [standard])

  // 파일 삭제 핸들러
  const handleFileDelete = useCallback(async (documentId: string, meetingId: string, type: string, proposalId?: string, filePath?: string) => {
    if (!standard) return

    try {
      // 파일 삭제 및 meeting.json 업데이트 API 호출
      const params = new URLSearchParams({
        acronym: standard.acronym,
        meetingId,
        documentId,
        type
      })
      
      if (proposalId) params.append('proposalId', proposalId)
      if (filePath) params.append('filePath', filePath)
      
      console.log(`API 호출: DELETE /api/file-delete?${params}`)
      const response = await fetch(`/api/file-delete?${params}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const result = await response.json()
        alert(`파일 삭제 실패: ${result.error}`)
        return
      }

      // 로컬 상태 업데이트
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
        
        setStandard(updatedStandard)
      }
      
    } catch (error) {
      console.error('파일 삭제 오류:', error)
      alert('파일 삭제 중 오류가 발생했습니다')
    }
  }, [standard])
  const handleStatusChange = useCallback(async (meetingId: string, proposalId: string, status: "accepted" | "review" | "rejected") => {
    if (!standard) return
    
    try {
      // 서버에 상태 변경 요청
      console.log(`API 호출: PUT /api/${acronym}/proposal-status`)
      const response = await fetch(`/api/${acronym}/proposal-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          proposalId,
          status
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`상태 변경 실패: ${errorData.error}`)
        return
      }

      // 성공시 로컬 상태 업데이트
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
      setStandard(updatedStandard)
      
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다')
    }
  }, [standard, acronym])

  // 회의 완료/되돌리기 핸들러
  const handleMeetingToggle = useCallback(async (meetingId: string) => {
    if (!standard) return
    
    const meetings = [...standard.meetings]
    const meetingIndex = meetings.findIndex((m) => m.id === meetingId)
    if (meetingIndex !== -1) {
      const newCompletedStatus = !meetings[meetingIndex].isCompleted
      
      // 먼저 로컬 상태 업데이트
      meetings[meetingIndex] = {
        ...meetings[meetingIndex],
        isCompleted: newCompletedStatus,
      }
      const updatedStandard = { ...standard, meetings }
      setStandard(updatedStandard)
      saveStandardData(updatedStandard)
      
      // 서버에 회의 상태 업데이트
      try {
        console.log('API 호출: POST /api/meetings/update')
        const response = await fetch('/api/meetings/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            acronym: standard.acronym,
            meetingId: meetingId,
            isCompleted: newCompletedStatus
          }),
        })
        
        if (!response.ok) {
          console.error('서버 회의 상태 업데이트 실패:', response.statusText)
          // 실패시 로컬 상태 롤백
          const originalMeetings = [...standard.meetings]
          setStandard({ ...standard, meetings: originalMeetings })
          saveStandardData({ ...standard, meetings: originalMeetings })
        }
      } catch (error) {
        console.error('회의 상태 업데이트 오류:', error)
        // 실패시 로컬 상태 롤백
        const originalMeetings = [...standard.meetings]
        setStandard({ ...standard, meetings: originalMeetings })
        saveStandardData({ ...standard, meetings: originalMeetings })
      }
    }
  }, [standard])

  // 기고서 순서 변경 핸들러
  const handleProposalReorder = useCallback(async (meetingId: string, reorderedProposals: any[]) => {
    if (!standard) return

    try {
      // 서버에 순서 변경 요청
      console.log('API 호출: PUT /api/proposal-order')
      const response = await fetch('/api/proposal-order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acronym: standard.acronym,
          meetingId,
          proposals: reorderedProposals
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`순서 변경 실패: ${errorData.error}`)
        return
      }

      // 성공시 로컬 상태 업데이트
      const updatedStandard = {
        ...standard,
        meetings: standard.meetings.map((meeting) => {
          if (meeting.id === meetingId) {
            return {
              ...meeting,
              proposals: reorderedProposals
            }
          }
          return meeting
        }),
      }
      setStandard(updatedStandard)
      
    } catch (error) {
      console.error('순서 변경 오류:', error)
      alert('순서 변경 중 오류가 발생했습니다')
    }
  }, [standard])
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

    try {
      // 서버에 회의 삭제 요청
      console.log(`API 호출: DELETE /api/meetings/delete?acronym=${standard.acronym}&meetingId=${meetingId}`)
      const response = await fetch(`/api/meetings/delete?acronym=${encodeURIComponent(standard.acronym)}&meetingId=${encodeURIComponent(meetingId)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`회의 삭제 실패: ${errorData.error}`)
        return
      }

      // 성공시 로컬 상태 업데이트
      const updatedStandard = {
        ...standard,
        meetings: standard.meetings.filter(m => m.id !== meetingId)
      }
      setStandard(updatedStandard)
      
      // 활성 회의가 삭제된 경우 첫 번째 회의로 변경
      if (activeMeetingId === meetingId) {
        if (updatedStandard.meetings.length > 0) {
          setActiveMeetingId(updatedStandard.meetings[0].id)
        } else {
          setActiveMeetingId(null)
        }
      }

      alert('회의가 삭제되었습니다.')

    } catch (error) {
      console.error('회의 삭제 오류:', error)
      alert('회의 삭제 중 오류가 발생했습니다.')
    }
  }, [standard, activeMeetingId])

  // 새 회의 추가 핸들러
  // 새 회의 추가 핸들러
  const handleCreateMeeting = useCallback(async (meeting: { startDate: string; endDate: string; title: string; description?: string }) => {
    if (!standard) return
    
    try {
      // 서버에 회의 생성 요청
      console.log('API 호출: POST /api/meetings')
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          standardAcronyms: [standard.acronym],
          startDate: meeting.startDate,
          endDate: meeting.endDate,
          title: meeting.title,
          description: meeting.description
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(`회의 생성 실패: ${errorData.error}`)
        return
      }
      
      // 중복 ID 체크 및 유니크 ID 생성
      let uniqueId = meeting.title
      let counter = 1
      while (standard.meetings.some(m => m.id === uniqueId)) {
        uniqueId = `${meeting.title} (${counter})`
        counter++
      }
      
      const newMeeting: Meeting = {
        id: uniqueId,
        startDate: meeting.startDate,
        endDate: meeting.endDate,
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
      
    } catch (error) {
      console.error('회의 생성 오류:', error)
      alert('회의 생성 중 오류가 발생했습니다.')
    }
  }, [standard])

  // 로딩 중이거나 로그인하지 않은 경우 로그인 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={login} />
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
  // Main return for AcronymPage
  return (
    <div className="flex flex-col lg:flex-row bg-gray-950 min-h-screen">
      {/* 모바일 헤더 */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-400 font-mono">
              {standard.acronym}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-mono">{standard.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">
              <span className={`font-medium font-mono ${auth.role === 'chair' ? 'text-blue-400' : 'text-green-400'}`}>
                {auth.role === 'chair' ? '[CHAIR]' : '[CONTRIBUTOR]'}
              </span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 사이드바 - 모바일에서는 상단 수평, 데스크톱에서는 좌측 세로 */}
      <div className="bg-gray-900 border-b lg:border-r lg:border-b-0 border-gray-700 lg:w-64 lg:min-h-screen">
        <div className="p-2 lg:p-4">
          {/* 홈으로 버튼 */}
          <div className="flex lg:flex-col gap-2 mb-2 lg:mb-4 overflow-x-auto lg:overflow-x-visible">
            <Link href="/" className="block flex-shrink-0">
              <Button variant="outline" size="sm" className="lg:w-full flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden lg:inline">홈으로</span>
              </Button>
            </Link>
            <div className="flex gap-2 flex-shrink-0">
              <div className="flex gap-2">
                {auth.role === 'chair' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettingsOpen(true)}
                    className="lg:flex-1 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden lg:inline">설정</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="lg:flex-1 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">로그아웃</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 데스크톱 헤더 */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl font-bold text-blue-400 font-mono">
              {standard.acronym}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-mono">{standard.title}</p>
            <div className="text-xs text-gray-400 mt-2">
              <span className={`font-medium font-mono ${auth.role === 'chair' ? 'text-blue-400' : 'text-green-400'}`}>
                 {auth.role === 'chair' ? 'CHAIR MODE' : 'CONTRIBUTOR MODE'}
              </span>
            </div>
          </div>

          {/* 회의 목록 */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
            <h3 className="font-semibold text-gray-300 mb-2 hidden lg:block flex-shrink-0 font-mono">MEETINGS</h3>
            {/* 회의 탭들 */}
            <div className="flex lg:flex-col gap-2 lg:space-y-2 lg:space-x-0 space-x-2 space-y-0 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-screen">
              {standard.meetings.map((meeting) => (
                <div key={meeting.id} className="relative group flex-shrink-0 lg:flex-shrink">
                  <button
                    onClick={() => setActiveMeetingId(meeting.id)}
                    className={cn(
                      "text-left p-3 rounded border transition-all duration-200 lg:w-full whitespace-nowrap lg:whitespace-normal font-mono",
                      activeMeetingId === meeting.id
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{meeting.title}</p>
                        <p className={cn(
                          "text-xs truncate",
                          activeMeetingId === meeting.id ? "text-purple-200" : "text-gray-500"
                        )}>
                          {meeting.startDate && meeting.endDate ? (
                            meeting.startDate === meeting.endDate ? 
                              new Date(meeting.startDate).toLocaleDateString("ko-KR") :
                              `${new Date(meeting.startDate).toLocaleDateString("ko-KR")} ~ ${new Date(meeting.endDate).toLocaleDateString("ko-KR")}`
                          ) : (
                            meeting.date ? new Date(meeting.date).toLocaleDateString("ko-KR") : "NO_DATE"
                          )}
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
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded p-1 text-xs"
                        title="회의 수정"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMeeting(meeting.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded p-1 text-xs"
                        title="회의 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {auth.role === 'chair' && (
                <div className="flex-shrink-0 lg:flex-shrink">
                  <NewMeetingDialog onCreateMeeting={handleCreateMeeting} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-2 lg:p-6 overflow-x-auto lg:overflow-x-visible bg-gray-950">
        {standard.meetings.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-400 mb-2 font-mono">// NO_MEETINGS_FOUND</h2>
              <p className="text-gray-500 font-mono">새 회의를 추가하여 시작하세요.</p>
            </div>
          </div>
        ) : (
          standard.meetings
            .filter(meeting => meeting.id === activeMeetingId)
            .map((meeting) => (
              <NewMeetingTab
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
                onProposalReorder={(reorderedProposals) => handleProposalReorder(meeting.id, reorderedProposals)}
                expandedMemos={expandedMemos}
              />
            ))
        )}
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
