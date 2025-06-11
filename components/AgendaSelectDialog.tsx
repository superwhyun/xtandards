"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar, FileText } from "lucide-react"

interface Meeting {
  id: string
  title: string
  date: string
  description?: string
  standardAcronym: string
  standardTitle: string
}

interface AgendaSelectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onGenerateAgenda: (meetingTitle: string) => void
}

const getAllMeetingTitles = async (): Promise<string[]> => {
  try {
    console.log('API 호출: GET /api/meetings')
    const response = await fetch('/api/meetings')
    if (!response.ok) {
      throw new Error('회의명 조회 실패')
    }
    const data = await response.json()
    console.log('API 응답:', data) // 디버깅용
    return data.meetingTitles || []
  } catch (error) {
    console.error('회의명 조회 오류:', error)
    return []
  }
}

export default function AgendaSelectDialog({ isOpen, onOpenChange, onGenerateAgenda }: AgendaSelectDialogProps) {
  const [selectedTitle, setSelectedTitle] = useState<string>("")
  const [meetingTitles, setMeetingTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  // 다이얼로그가 열릴 때 회의명 목록 로드
  useEffect(() => {
    if (isOpen) {
      const loadMeetingTitles = async () => {
        setLoading(true)
        const titles = await getAllMeetingTitles()
        setMeetingTitles(titles)
        setLoading(false)
      }
      loadMeetingTitles()
    }
  }, [isOpen])
  
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
          ) : meetingTitles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              생성된 회의가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              <Label>회의명 선택</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                {meetingTitles.map((title) => (
                  <div 
                    key={title} 
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedTitle === title 
                        ? 'bg-blue-100 border-blue-500 border' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => setSelectedTitle(title)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={selectedTitle === title}
                        onChange={() => setSelectedTitle(title)}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-medium">{title}</span>
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