"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar, FileText } from "lucide-react"

interface Meeting {
  id: string
  title: string
  startDate: string
  endDate: string
  description?: string
  standardAcronym: string
  standardTitle: string
}

interface AgendaSelectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onGenerateAgenda: (meetingTitle: string) => void
}

const getAllMeetings = async (): Promise<Meeting[]> => {
  try {
    console.log('API 호출: GET /api/standards')
    const response = await fetch('/api/standards')
    if (!response.ok) {
      throw new Error('표준문서 조회 실패')
    }
    const data = await response.json()
    
    const meetings: Meeting[] = []
    data.standards.forEach((standard: any) => {
      if (Array.isArray(standard.meetings)) {
        standard.meetings.forEach((meeting: any) => {
          meetings.push({
            id: meeting.id,
            title: meeting.title,
            startDate: meeting.startDate,
            endDate: meeting.endDate,
            description: meeting.description,
            standardAcronym: standard.acronym,
            standardTitle: standard.title
          })
        })
      }
    })
    
    // 중복 제거 (같은 title을 가진 회의들)
    const uniqueMeetings = meetings.filter((meeting, index, self) => 
      index === self.findIndex(m => m.title === meeting.title)
    )
    
    return uniqueMeetings
  } catch (error) {
    console.error('회의 조회 오류:', error)
    return []
  }
}

export default function AgendaSelectDialog({ isOpen, onOpenChange, onGenerateAgenda }: AgendaSelectDialogProps) {
  const [selectedTitle, setSelectedTitle] = useState<string>("")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(false)
  
  // 다이얼로그가 열릴 때 회의 목록 로드
  useEffect(() => {
    if (isOpen) {
      const loadMeetings = async () => {
        setLoading(true)
        const meetingList = await getAllMeetings()
        setMeetings(meetingList)
        setLoading(false)
      }
      loadMeetings()
    }
  }, [isOpen])
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear().toString().slice(2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${year}.${month}`
  }
  
  const handleGenerate = () => {
    if (selectedTitle) {
      onGenerateAgenda(selectedTitle)
      setSelectedTitle("")
      onOpenChange(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agenda 생성할 회의명 선택</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              회의명을 불러오는 중...
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              생성된 회의가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              <Label>회의명 선택</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                {meetings.map((meeting) => (
                  <div 
                    key={meeting.title} 
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedTitle === meeting.title 
                        ? 'bg-blue-100 border-blue-500 border' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => setSelectedTitle(meeting.title)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={selectedTitle === meeting.title}
                        onChange={() => setSelectedTitle(meeting.title)}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-medium">
                        {meeting.title} ({formatDate(meeting.startDate)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              취소
            </Button>
            <Button 
              onClick={handleGenerate} 
              className="flex-1" 
              disabled={!selectedTitle}
            >
              Agenda 생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// %%%%%LAST%%%%%