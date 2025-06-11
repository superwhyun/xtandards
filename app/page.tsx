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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Calendar, Users, Plus, Settings, LogOut, Trash2, Check, Upload as UploadIcon, FileStack, ClipboardList } from "lucide-react"
import LoginScreen, { UserRole, AuthState } from "@/components/auth/LoginScreen"
import SettingsDialog from "@/components/auth/SettingsDialog"
import AgendaSelectDialog from "@/components/AgendaSelectDialog"
import MinutesSelectDialog from "@/components/MinutesSelectDialog"
import DocumentGenerator from "@/components/DocumentGenerator"
import { useAuth } from "@/hooks/useAuth"

interface Standard {
  acronym: string
  title: string
  meetings: number
  lastUpdate: string
}

interface UploadedProposal {
  name: string
  file: File
  extractedTitle: string
}

const getStoredStandards = async (): Promise<Standard[]> => {
  try {
    console.log('API 호출: GET /api/standards')
    const response = await fetch('/api/standards')
    if (!response.ok) {
      console.error('표준문서 조회 실패:', response.status, response.statusText)
      return []
    }
    const data = await response.json()
    
    // API 응답 구조 확인
    if (!data || !Array.isArray(data.standards)) {
      console.error('잘못된 API 응답 구조:', data)
      return []
    }
    
    // API 응답을 Standard 형태로 변환
    return data.standards.map((standard: any) => ({
      acronym: standard.acronym,
      title: standard.title,
      meetings: Array.isArray(standard.meetings) ? standard.meetings.length : 0,
      lastUpdate: standard.updatedAt ? new Date(standard.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }))
  } catch (error) {
    console.error('표준문서 조회 오류:', error)
    return []
  }
}

function MeetingCreateDialog({
  onCreateMeetings,
  isOpen,
  onOpenChange,
}: {
  onCreateMeetings: (meetingData: { date: string; title: string; description?: string }, selectedStandards: string[]) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    title: "",
    description: "",
  })
  const [selectedStandards, setSelectedStandards] = useState<Set<string>>(new Set())
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(false)

  // 다이얼로그가 열릴 때 표준문서 목록 로드
  useEffect(() => {
    if (isOpen) {
      const loadStandards = async () => {
        setLoading(true)
        const standardsData = await getStoredStandards()
        setStandards(standardsData)
        setLoading(false)
      }
      loadStandards()
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (formData.startDate && formData.endDate && formData.title && selectedStandards.size > 0) {
      onCreateMeetings(formData, Array.from(selectedStandards))
      setFormData({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], title: "", description: "" })
      setSelectedStandards(new Set())
      onOpenChange(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>새 회의 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>표준문서 선택</Label>
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                표준문서를 불러오는 중...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {standards.map((standard) => (
                  <div key={standard.acronym} className="flex items-center space-x-2">
                    <Checkbox
                      id={standard.acronym}
                      checked={selectedStandards.has(standard.acronym)}
                      onCheckedChange={(checked) => handleStandardSelect(standard.acronym, checked as boolean)}
                    />
                    <Label htmlFor={standard.acronym} className="text-sm cursor-pointer">
                      {standard.acronym}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            <div className="text-sm text-gray-600">
              선택된 표준문서: {selectedStandards.size}개
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">회의 시작날짜</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">회의 종료날짜</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
              disabled={!formData.startDate || !formData.endDate || !formData.title || selectedStandards.size === 0}
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

export default function Page() {
  const { auth, loading, login, logout } = useAuth()
  const [standards, setStandards] = useState<Standard[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uploadedProposals, setUploadedProposals] = useState<UploadedProposal[]>([])
  const [showMeetingCreateDialog, setShowMeetingCreateDialog] = useState(false)
  const [showAgendaDialog, setShowAgendaDialog] = useState(false)
  const [showMinutesDialog, setShowMinutesDialog] = useState(false)
  const [documentGenerator, setDocumentGenerator] = useState<{
    isOpen: boolean
    type: 'agenda' | 'minutes'
    content: string
    title: string
  }>({
    isOpen: false,
    type: 'agenda',
    content: '',
    title: ''
  })

  // localStorage 대신 서버에서 회의 제목들을 가져오는 함수는 제거
  // AgendaSelectDialog와 MinutesSelectDialog에서 직접 API 호출

  const handleGenerateAgenda = async (meetingTitle: string) => {
    try {
      console.log('API 호출: GET /api/standards')
      const response = await fetch('/api/standards')
      if (!response.ok) {
        alert('표준문서 데이터를 조회할 수 없습니다.')
        return
      }
      
      const data = await response.json()
      const allStandards = data.standards
      
      let agendaContent = `# ${meetingTitle} - 회의 Agenda\n\n`
      agendaContent += `생성일: ${new Date().toLocaleDateString('ko-KR')}\n\n`
      
      // 모든 표준문서에서 해당 회의명과 일치하는 회의들 찾기
      for (const standard of allStandards) {
        if (!Array.isArray(standard.meetings)) continue
        
        const targetMeeting = standard.meetings.find((m: any) => m.title === meetingTitle)
        if (!targetMeeting) continue
        
        // 각 표준문서의 회의 상세 정보 가져오기 (meeting.json 포함)
        console.log(`API 호출: GET /api/${standard.acronym}/meetings`)
        const detailResponse = await fetch(`/api/${standard.acronym}/meetings`)
        if (!detailResponse.ok) continue
        
        const detailData = await detailResponse.json()
        const detailedMeeting = detailData.meetings.find((m: any) => m.title === meetingTitle)
        if (!detailedMeeting) continue
        
        agendaContent += `## ${standard.acronym} - ${standard.title}\n`
        agendaContent += `\n`
        
        // 기존 베이스라인 문서
        if (detailedMeeting.previousDocument) {
          agendaContent += `#### 기존 베이스라인 문서\n`
          agendaContent += `- ${detailedMeeting.previousDocument.name}\n\n`
        }
        
        // 기고서 문서들
        if (detailedMeeting.proposals && detailedMeeting.proposals.length > 0) {
          agendaContent += `#### 기고서 문서들\n`
          detailedMeeting.proposals.forEach((proposal: any, index: number) => {
            agendaContent += `${index + 1}. ${proposal.name}\n`
            // 수정본들도 포함
            if (detailedMeeting.revisions && detailedMeeting.revisions[proposal.id]) {
              detailedMeeting.revisions[proposal.id].forEach((revision: any, revIndex: number) => {
                agendaContent += `   - 수정본 ${revIndex + 1}: ${revision.name}\n`
              })
            }
          })
          agendaContent += `\n`
        } else {
          agendaContent += `#### 기고서 문서들\n`
          agendaContent += `이번 회의에는 기고서가 제출되지 않아 논의되지 않았습니다.\n\n`
        }
        
        agendaContent += `---\n\n`
      }
      
      // Agenda 파일 다운로드
      const blob = new Blob([agendaContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${meetingTitle}_Agenda_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Agenda 생성 오류:', error)
      alert('Agenda 생성 중 오류가 발생했습니다.')
    }
  }

  const handleGenerateMinutes = async (meetingTitle: string) => {
    try {
      console.log('API 호출: GET /api/standards')
      const response = await fetch('/api/standards')
      if (!response.ok) {
        alert('표준문서 데이터를 조회할 수 없습니다.')
        return
      }
      
      const data = await response.json()
      const allStandards = data.standards
      
      let minutesContent = `# ${meetingTitle} - 회의록\n\n`
      minutesContent += `생성일: ${new Date().toLocaleDateString('ko-KR')}\n\n`
      
      // 모든 표준문서에서 해당 회의명과 일치하는 회의들 찾기
      for (const standard of allStandards) {
        if (!Array.isArray(standard.meetings)) continue
        
        const targetMeeting = standard.meetings.find((m: any) => m.title === meetingTitle)
        if (!targetMeeting) continue
        
        // 각 표준문서의 회의 상세 정보 가져오기 (meeting.json 포함)
        console.log(`API 호출: GET /api/${standard.acronym}/meetings`)
        const detailResponse = await fetch(`/api/${standard.acronym}/meetings`)
        if (!detailResponse.ok) continue
        
        const detailData = await detailResponse.json()
        const detailedMeeting = detailData.meetings.find((m: any) => m.title === meetingTitle)
        if (!detailedMeeting) continue
        
        minutesContent += `## ${standard.acronym} - ${standard.title}\n`
        minutesContent += `\n`
        
        // 기존 베이스라인 문서
        if (detailedMeeting.previousDocument) {
          minutesContent += `#### 기존 베이스라인 문서\n`
          minutesContent += `- ${detailedMeeting.previousDocument.name}\n\n`
        }
        
        // 기고서 문서들과 논의 내용
        if (detailedMeeting.proposals && detailedMeeting.proposals.length > 0) {
          minutesContent += `#### 기고서 문서들 및 논의 내용\n`
          detailedMeeting.proposals.forEach((proposal: any, index: number) => {
            minutesContent += `${index + 1}. ${proposal.name}\n`
            
            // 수정본들
            if (detailedMeeting.revisions && detailedMeeting.revisions[proposal.id]) {
              detailedMeeting.revisions[proposal.id].forEach((revision: any, revIndex: number) => {
                minutesContent += `   - 수정본 ${revIndex + 1}: ${revision.name}\n`
              })
            }
            
            // 메모 (논의 내용) - bullet point로 작성
            if (detailedMeeting.memos && detailedMeeting.memos[proposal.id]) {
              minutesContent += `   - 회의 논의 내용:\n\`\`\`\n${detailedMeeting.memos[proposal.id]}\n\`\`\`\n`
            }
            
            minutesContent += `\n`
          })
        } else {
          minutesContent += `#### 기고서 문서들 및 논의 내용\n`
          minutesContent += `이번 회의에는 기고서가 제출되지 않아 논의되지 않았습니다.\n\n`
        }
        
        // Output 문서
        if (detailedMeeting.resultDocument) {
          minutesContent += `#### Output 문서\n`
          minutesContent += `- ${detailedMeeting.resultDocument.name}\n`
          
          // Output 수정본들
          if (detailedMeeting.resultRevisions && detailedMeeting.resultRevisions.length > 0) {
            detailedMeeting.resultRevisions.forEach((revision: any, index: number) => {
              minutesContent += `- 수정본 ${index + 1}: ${revision.name}\n`
            })
          }
          minutesContent += `\n`
        }
        
        minutesContent += `---\n\n`
      }
      
      // 회의록 파일 다운로드
      const blob = new Blob([minutesContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${meetingTitle}_회의록_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('회의록 생성 오류:', error)
      alert('회의록 생성 중 오류가 발생했습니다.')
    }
  }
  // handleLogin과 handleLogout은 useAuth 훅에서 제공되므로 제거

  useEffect(() => {
    const loadStandards = async () => {
      const standardsData = await getStoredStandards()
      setStandards(standardsData)
    }
    loadStandards()
  }, [])  // 인증 관련 코드 제거

  const handleProposalUpload = async (files: FileList) => {
    const newProposals = []
    
    for (const file of Array.from(files)) {
      let extractedTitle = ""
      
      // Word 문서인 경우 Title 추출 시도
      if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const mammoth = await import('mammoth')
          
          // HTML로 변환해서 표 구조 분석
          const result = await mammoth.convertToHtml({ arrayBuffer })
          const html = result.value
          
          // HTML을 파싱해서 표에서 Title 찾기
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const tables = doc.querySelectorAll('table')
          
          for (const table of tables) {
            const rows = table.querySelectorAll('tr')
            for (const row of rows) {
              const cells = row.querySelectorAll('td, th')
              for (let i = 0; i < cells.length - 1; i++) {
                const cellText = cells[i].textContent?.trim().toLowerCase()
                if (cellText === 'title:' || cellText === 'title') {
                  extractedTitle = cells[i + 1].textContent?.trim() || ""
                  break
                }
              }
              if (extractedTitle) break
            }
            if (extractedTitle) break
          }
        } catch (error) {
          console.warn('Title 추출 실패:', file.name, error)
        }
      }
      
      newProposals.push({
        name: file.name,
        file: file,
        extractedTitle: extractedTitle || file.name // Title 추출 실패시 파일명 사용
      })
    }
    
    setUploadedProposals(prev => [...prev, ...newProposals])
  }

  const handleProposalDragToStandard = async (proposalIndex: number, standardAcronym: string) => {
    try {
      const proposal = uploadedProposals[proposalIndex]
      if (!proposal) return

      // 서버에서 표준문서 데이터 가져오기
      console.log('API 호출: GET /api/standards')
      const response = await fetch('/api/standards')
      if (!response.ok) {
        alert('표준문서 정보를 가져올 수 없습니다.')
        return
      }
      
      const data = await response.json()
      const standard = data.standards.find((s: any) => s.acronym === standardAcronym)
      
      if (!standard) {
        alert('표준문서를 찾을 수 없습니다.')
        return
      }

      if (!Array.isArray(standard.meetings) || standard.meetings.length === 0) {
        alert('해당 표준문서에 회의가 없습니다. 먼저 회의를 생성해주세요.')
        return
      }

      // 현재 활성 회의 찾기 (메인 페이지에서는 마지막 회의를 기본으로 사용)
      const targetMeeting = standard.meetings[standard.meetings.length - 1]
      console.log('업로드 대상 회의:', targetMeeting) // 디버깅용
      
      // 파일 업로드 API 호출
      const formData = new FormData()
      formData.append('file', proposal.file)
      formData.append('acronym', standardAcronym)
      formData.append('meetingId', targetMeeting.id)
      formData.append('type', 'proposal')
      formData.append('extractedTitle', proposal.extractedTitle || '')

      console.log('API 호출: POST /api/proposal')
      const uploadResponse = await fetch('/api/proposal', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const result = await uploadResponse.json()
        alert(`업로드 실패: ${result.error}`)
        return
      }

      const result = await uploadResponse.json()

      // 업로드 성공시 업로드된 기고서 목록에서 제거
      setUploadedProposals(prev => prev.filter((_, index) => index !== proposalIndex))
      
      // 표준문서 목록도 즉시 새로고침해서 UI에 반영
      const updatedStandards = await getStoredStandards()
      setStandards(updatedStandards)
      
      alert('기고서가 업로드되었습니다.')

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
    try {
      console.log('API 호출: POST /api/standards')
      const response = await fetch('/api/standards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(standardData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(`표준문서 생성 실패: ${errorData.error}`)
        return
      }
      
      // 성공시 목록 새로고침
      const updatedStandards = await getStoredStandards()
      setStandards(updatedStandards)
      
    } catch (error) {
      console.error('표준문서 생성 오류:', error)
      alert('표준문서 생성 중 오류가 발생했습니다.')
    }
  }

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

  const handleDeleteStandard = async (acronym: string) => {
    if (!confirm(`정말 "${acronym}" 표준문서를 삭제하시겠습니까? 모든 데이터가 삭제됩니다.`)) {
      return
    }

    try {
      console.log(`API 호출: DELETE /api/standards/delete?acronym=${acronym}`)
      const response = await fetch(`/api/standards/delete?acronym=${encodeURIComponent(acronym)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(`삭제 실패: ${errorData.error}`)
        return
      }

      // 성공시 목록 새로고침
      const updatedStandards = await getStoredStandards()
      setStandards(updatedStandards)
      
    } catch (error) {
      console.error('표준문서 삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const handleCreateMeetings = async (meetingData: { startDate: string; endDate: string; title: string; description?: string }, selectedStandardsList: string[]) => {
    try {
      console.log('API 호출: POST /api/meetings')
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          standardAcronyms: selectedStandardsList,
          startDate: meetingData.startDate,
          endDate: meetingData.endDate,
          title: meetingData.title,
          description: meetingData.description
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(`회의 생성 실패: ${errorData.error}`)
        return
      }
      
      const result = await response.json()
      
      // 성공시 목록 새로고침
      const updatedStandards = await getStoredStandards()
      setStandards(updatedStandards)
      
      alert(result.message)
      
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
              {auth.role === 'chair' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowMeetingCreateDialog(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    회의 생성
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAgendaDialog(true)}
                    className="gap-2"
                  >
                    <FileStack className="h-4 w-4" />
                    Agenda 생성
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMinutesDialog(true)}
                    className="gap-2"
                  >
                    <ClipboardList className="h-4 w-4" />
                    회의록 생성
                  </Button>
                </div>
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
                onClick={logout}
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
          
          {Array.isArray(standards) ? standards.map((standard) => (
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
          )) : (
            <div className="text-center py-8 text-gray-500">
              표준문서를 불러오는 중...
            </div>
          )}
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
                      {proposal.extractedTitle && proposal.extractedTitle !== proposal.name ? (
                        <>
                          <p className="text-sm font-medium text-blue-600 break-words" title={proposal.extractedTitle}>
                            {proposal.extractedTitle}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={proposal.name}>
                            {proposal.name}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 truncate" title={proposal.name}>
                          {proposal.name}
                        </p>
                      )}
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
        onCreateMeetings={handleCreateMeetings}
        isOpen={showMeetingCreateDialog}
        onOpenChange={setShowMeetingCreateDialog}
      />

      <AgendaSelectDialog
        isOpen={showAgendaDialog}
        onOpenChange={setShowAgendaDialog}
        onGenerateAgenda={handleGenerateAgenda}
      />

      <MinutesSelectDialog
        isOpen={showMinutesDialog}
        onOpenChange={setShowMinutesDialog}
        onGenerateMinutes={handleGenerateMinutes}
      />
    </div>
  )
}
