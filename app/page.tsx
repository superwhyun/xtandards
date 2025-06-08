"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Calendar, Users, Plus, Settings, LogOut, Trash2, Check, Upload as UploadIcon } from "lucide-react"
import LoginScreen, { UserRole, AuthState } from "@/components/auth/LoginScreen"
import SettingsDialog from "@/components/auth/SettingsDialog"

interface Standard {
  acronym: string
  title: string
  meetings: number
  lastUpdate: string
}

interface UploadedProposal {
  name: string
  file: File
}

const getStoredStandards = (): Standard[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('standards')
  if (!stored) return []
  
  try {
    const parsedStandards = JSON.parse(stored)
    // meetings가 배열인 경우 길이로 변환
    return parsedStandards.map((standard: any) => ({
      ...standard,
      meetings: Array.isArray(standard.meetings) ? standard.meetings.length : (standard.meetings || 0)
    }))
  } catch (error) {
    console.error('표준문서 데이터 파싱 오류:', error)
    return []
  }
}

function MeetingCreateDialog({
  selectedStandards,
  onCreateMeetings,
  isOpen,
  onOpenChange,
}: {
  selectedStandards: Set<string>
  onCreateMeetings: (meetingData: { date: string; title: string; description?: string }) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: "",
    description: "",
  })

  const handleSubmit = () => {
    if (formData.date && formData.title && selectedStandards.size > 0) {
      onCreateMeetings(formData)
      setFormData({ date: new Date().toISOString().split('T')[0], title: "", description: "" })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>선택된 표준문서들에 회의 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            선택된 표준문서: {Array.from(selectedStandards).join(', ')} ({selectedStandards.size}개)
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">회의 날짜</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">회의 제목</Label>
            <Input
              id="title"
              placeholder="회의 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="회의에 대한 설명을 입력하세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              disabled={!formData.date || !formData.title || selectedStandards.size === 0}
            >
              회의 생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewStandardDialog({
  onCreateStandard,
}: {
  onCreateStandard: (standard: { acronym: string; title: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    acronym: "",
    title: "",
  })

  const handleSubmit = () => {
    if (formData.acronym && formData.title) {
      onCreateStandard(formData)
      setFormData({ acronym: "", title: "" })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="flex flex-col items-center justify-center h-32 p-4">
            <div className="bg-blue-100 rounded-full p-3 mb-2">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-blue-700 font-medium text-sm">새 표준문서</p>
            <p className="text-blue-600 text-xs mt-1">표준안을 추가하세요</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 표준문서 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acronym">표준문서 약어 (Acronym)</Label>
            <Input
              id="acronym"
              placeholder="예: ISO-27001, NIST-CSF"
              value={formData.acronym}
              onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">표준문서 제목</Label>
            <Textarea
              id="title"
              placeholder="예: Information Security Management Systems"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!formData.acronym || !formData.title}>
              등록
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function HomePage() {
  const [standards, setStandards] = useState<Standard[]>([])
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedStandards, setSelectedStandards] = useState<Set<string>>(new Set())
  const [uploadedProposals, setUploadedProposals] = useState<UploadedProposal[]>([])
  const [showMeetingCreateDialog, setShowMeetingCreateDialog] = useState(false)

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
    setStandards(getStoredStandards())
    
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
  }, [])

  const handleProposalUpload = async (files: FileList) => {
    const newProposals = Array.from(files).map(file => ({
      name: file.name,
      file: file
    }))
    setUploadedProposals(prev => [...prev, ...newProposals])
  }

  const handleProposalDragToStandard = async (proposalIndex: number, standardAcronym: string) => {
    try {
      const proposal = uploadedProposals[proposalIndex]
      if (!proposal) return

      // 해당 표준문서의 마지막 회의 찾기
      const existingStandardData = localStorage.getItem('standards')
      const allStandards = existingStandardData ? JSON.parse(existingStandardData) : []
      const standardIndex = allStandards.findIndex((s: any) => s.acronym === standardAcronym)
      
      if (standardIndex < 0) {
        alert('표준문서를 찾을 수 없습니다.')
        return
      }

      const standard = allStandards[standardIndex]
      if (!Array.isArray(standard.meetings) || standard.meetings.length === 0) {
        alert('해당 표준문서에 회의가 없습니다. 먼저 회의를 생성해주세요.')
        return
      }

      // 마지막 회의 가져오기
      const lastMeeting = standard.meetings[standard.meetings.length - 1]
      
      // 파일 업로드 API 호출
      const formData = new FormData()
      formData.append('file', proposal.file)
      formData.append('acronym', standardAcronym)
      formData.append('meetingDate', lastMeeting.date)
      formData.append('type', 'proposal')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const result = await response.json()
        alert(`업로드 실패: ${result.error}`)
        return
      }

      const result = await response.json()

      // 새 기고서 문서 생성
      const newDocument = {
        id: `doc-${Date.now()}`,
        name: result.originalName,
        type: "proposal",
        uploadDate: new Date().toISOString(),
        connections: [],
        status: 'pending',
        filePath: result.filePath,
        uploader: auth.user || 'unknown'
      }

      // 마지막 회의에 기고서 추가
      lastMeeting.proposals.push(newDocument)
      allStandards[standardIndex] = standard

      // localStorage 업데이트
      localStorage.setItem('standards', JSON.stringify(allStandards))

      // 업로드된 기고서 목록에서 제거
      setUploadedProposals(prev => prev.filter((_, index) => index !== proposalIndex))

    } catch (error) {
      console.error('기고서 추가 오류:', error)
      alert('기고서 추가 중 오류가 발생했습니다.')
    }
  }

  const handleStandardSelect = (acronym: string, checked: boolean) => {
    const newSelected = new Set(selectedStandards)
    if (checked) {
      newSelected.add(acronym)
    } else {
      newSelected.delete(acronym)
    }
    setSelectedStandards(newSelected)
  }

  const handleCreateStandard = async (standardData: { acronym: string; title: string }) => {
    // 실제 저장된 표준문서 데이터 확인
    const existingStandardData = localStorage.getItem('standards')
    const allStandards = existingStandardData ? JSON.parse(existingStandardData) : []
    
    // 새 표준문서 데이터 생성
    const newStandardData = {
      acronym: standardData.acronym,
      title: standardData.title,
      meetings: [] // 빈 배열로 초기화
    }
    
    // 실제 데이터 저장 (배열 형태)
    const updatedStandardsData = [...allStandards, newStandardData]
    localStorage.setItem('standards', JSON.stringify(updatedStandardsData))
    
    // 메인 페이지 표시용 데이터 (숫자 형태)
    const newStandard: Standard = {
      acronym: standardData.acronym,
      title: standardData.title,
      meetings: 0,
      lastUpdate: new Date().toISOString().split('T')[0],
    }

    // 디렉토리 생성
    const success = await createDataDirectory(standardData.acronym)
    if (success) {
      const updatedStandards = [...standards, newStandard]
      setStandards(updatedStandards)
      console.log('새 표준문서 등록 완료:', newStandard)
    } else {
      console.error('표준문서 등록 실패: 디렉토리 생성 오류')
    }
  }

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const saveStandards = (newStandards: Standard[]) => {
    setStandards(newStandards)
    localStorage.setItem('standards', JSON.stringify(newStandards))
  }

  const createDataDirectory = async (acronym: string) => {
    try {
      // 표준문서별 데이터 디렉토리 생성
      const dataPath = `/Users/whyun/workspace/Xtandaz/data/${acronym}`
      console.log(`데이터 디렉토리 생성: ${dataPath}`)
      
      // 실제 API 호출이나 서버 요청으로 디렉토리 생성
      // TODO: 서버 API 구현 후 실제 디렉토리 생성 로직 추가
      
      return true
    } catch (error) {
      console.error('디렉토리 생성 실패:', error)
      return false
    }
  }

  const handleDeleteStandard = async (acronym: string) => {
    if (!confirm(`정말 "${acronym}" 표준문서를 삭제하시겠습니까? 모든 데이터가 삭제됩니다.`)) {
      return
    }

    try {
      // 서버에서 데이터 폴더 삭제
      const response = await fetch(`/api/delete?path=${encodeURIComponent(`data/${acronym}`)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const result = await response.json()
        alert(`삭제 실패: ${result.error}`)
        return
      }

      // localStorage에서 해당 표준문서 삭제
      const existingStandardData = localStorage.getItem('standards')
      if (existingStandardData) {
        const allStandards = JSON.parse(existingStandardData)
        const updatedStandards = allStandards.filter((s: any) => s.acronym !== acronym)
        localStorage.setItem('standards', JSON.stringify(updatedStandards))
      }

      // 화면에서 해당 표준문서 제거
      const updatedStandards = standards.filter(s => s.acronym !== acronym)
      saveStandards(updatedStandards)
      
    } catch (error) {
      console.error('표준문서 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const handleCreateMeetings = async (meetingData: { date: string; title: string; description?: string }) => {
    try {
      // 표준문서 데이터 로드
      const existingStandardData = localStorage.getItem('standards')
      const allStandards = existingStandardData ? JSON.parse(existingStandardData) : []
      
      // 선택된 각 표준문서에 대해 회의 추가
      for (const acronym of selectedStandards) {
        const standardIndex = allStandards.findIndex((s: any) => s.acronym === acronym)
        
        if (standardIndex >= 0) {
          const standard = allStandards[standardIndex]
          
          // meetings가 배열이 아니면 빈 배열로 초기화
          if (!Array.isArray(standard.meetings)) {
            standard.meetings = []
          }
          
          const newMeeting = {
            id: `meeting-${Date.now()}-${acronym}`,
            date: meetingData.date,
            title: meetingData.title,
            description: meetingData.description,
            proposals: [],
            revisions: {},
            resultRevisions: [],
            isCompleted: false,
            memos: {}
          }
          
          // 이전 회의가 있고 완료된 경우, 마지막 회의의 Output Document를 Base Document로 설정
          const completedMeetings = standard.meetings.filter((m: any) => m.isCompleted)
          if (completedMeetings.length > 0) {
            const lastCompletedMeeting = completedMeetings[completedMeetings.length - 1]
            if (lastCompletedMeeting.resultDocument) {
              const lastRevision = lastCompletedMeeting.resultRevisions?.length > 0 
                ? lastCompletedMeeting.resultRevisions[lastCompletedMeeting.resultRevisions.length - 1]
                : lastCompletedMeeting.resultDocument
              
              newMeeting.previousDocument = {
                ...lastRevision,
                id: `base-${Date.now()}-${acronym}`,
                type: "previous"
              }
            }
          }
          
          standard.meetings.push(newMeeting)
          allStandards[standardIndex] = standard
        }
      }
      
      // localStorage 업데이트
      localStorage.setItem('standards', JSON.stringify(allStandards))
      
      // 메인 페이지 상태 업데이트
      setStandards(getStoredStandards())
      setSelectedStandards(new Set())
      
      alert(`${selectedStandards.size}개 표준문서에 회의가 생성되었습니다.`)
      
    } catch (error) {
      console.error('회의 생성 오류:', error)
      alert('회의 생성 중 오류가 발생했습니다.')
    }
  }

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto p-6">
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                표준문서 관리 시스템
              </h1>
              <p className="text-gray-600 text-lg">드래그 앤 드롭으로 표준문서 개발 과정을 관리하세요</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                <span className={`font-medium ${auth.role === 'chair' ? 'text-blue-600' : 'text-green-600'}`}>
                  {auth.role === 'chair' ? 'Chair' : 'Contributor'}
                </span>
                로 로그인됨
              </div>
              {selectedStandards.size > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowMeetingCreateDialog(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  회의 생성 ({selectedStandards.size})
                </Button>
              )}
              {auth.role === 'chair' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  설정
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {auth.role === 'chair' && <NewStandardDialog onCreateStandard={handleCreateStandard} />}
          
          {standards.map((standard) => (
            <div 
              key={standard.acronym} 
              className="relative group"
              onDrop={(e) => {
                e.preventDefault()
                const proposalIndex = parseInt(e.dataTransfer.getData('text/plain'))
                if (!isNaN(proposalIndex)) {
                  handleProposalDragToStandard(proposalIndex, standard.acronym)
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2')
              }}
            >
              {/* 체크박스 - 우측 상단 */}
              <div className="absolute top-2 right-2 z-10">
                <Checkbox
                  checked={selectedStandards.has(standard.acronym)}
                  onCheckedChange={(checked) => handleStandardSelect(standard.acronym, checked as boolean)}
                  className="bg-white border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </div>
              
              <Link href={`/${standard.acronym}`}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-0 shadow-md cursor-pointer h-32">
                  <CardHeader className="pb-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold">{standard.acronym}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{standard.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {standard.meetings}회의
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {new Date(standard.lastUpdate).toLocaleDateString("ko-KR").slice(5)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {/* 삭제 버튼 - Chair만 표시 */}
              {auth.role === 'chair' && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteStandard(standard.acronym)
                  }}
                  className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="표준문서 삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 기고서 업로드 영역 */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">기고서 업로드</h2>
          
          {/* 업로드 드롭존 */}
          <div className="mb-6">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onDrop={(e) => {
                e.preventDefault()
                const files = e.dataTransfer.files
                if (files.length > 0) {
                  handleProposalUpload(files)
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.accept = '.pdf,.doc,.docx,.txt'
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) {
                    handleProposalUpload(files)
                  }
                }
                input.click()
              }}
            >
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">기고서 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-sm text-gray-500 mt-2">PDF, DOC, DOCX, TXT 파일을 지원합니다</p>
            </div>
          </div>

          {/* 업로드된 기고서 목록 */}
          {uploadedProposals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">업로드된 기고서</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedProposals.map((proposal, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', index.toString())
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={proposal.name}>
                          {proposal.name}
                        </p>
                        <p className="text-xs text-gray-500">드래그하여 표준문서에 추가</p>
                      </div>
                      <button
                        onClick={() => setUploadedProposals(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-4">
                💡 팁: 기고서를 위의 표준문서 카드로 드래그하면 해당 표준문서의 마지막 회의에 자동으로 추가됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {auth.role === 'chair' && (
        <SettingsDialog isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
      )}

      <MeetingCreateDialog
        selectedStandards={selectedStandards}
        onCreateMeetings={handleCreateMeetings}
        isOpen={showMeetingCreateDialog}
        onOpenChange={setShowMeetingCreateDialog}
      />
    </div>
  )
}

// %%%%%LAST%%%%%