"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Save, X } from "lucide-react"

interface Meeting {
  id: string
  startDate: string
  endDate: string
  title: string
  description?: string
  date?: string // 기존 데이터 호환성용
}

interface EditMeetingDialogProps {
  meeting: Meeting | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (meetingId: string, updatedData: { title: string; startDate: string; endDate: string; description?: string }) => void
}

export default function EditMeetingDialog({ meeting, isOpen, onOpenChange, onSave }: EditMeetingDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    description: ""
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 다이얼로그가 열릴 때 기존 회의 데이터로 폼 초기화
  useEffect(() => {
    if (meeting && isOpen) {
      setFormData({
        title: meeting.title || "",
        startDate: meeting.startDate || meeting.date || "",
        endDate: meeting.endDate || meeting.date || "",
        description: meeting.description || ""
      })
      setErrors({})
    }
  }, [meeting, isOpen])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "회의 제목을 입력해주세요"
    }
    
    if (!formData.startDate.trim()) {
      newErrors.startDate = "회의 시작날짜를 입력해주세요"
    }
    
    if (!formData.endDate.trim()) {
      newErrors.endDate = "회의 종료날짜를 입력해주세요"
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "종료날짜는 시작날짜보다 늦어야 합니다"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!meeting) return
    
    if (validateForm()) {
      onSave(meeting.id, {
        title: formData.title.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim()
      })
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setErrors({})
    onOpenChange(false)
  }

  if (!meeting) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            회의 정보 수정
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingTitle">회의 제목 *</Label>
            <Input
              id="meetingTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="회의 제목을 입력하세요"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingStartDate">회의 시작날짜 *</Label>
            <Input
              id="meetingStartDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={errors.startDate ? "border-red-500" : ""}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingEndDate">회의 종료날짜 *</Label>
            <Input
              id="meetingEndDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={errors.endDate ? "border-red-500" : ""}
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm">{errors.endDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingDescription">회의 설명</Label>
            <Textarea
              id="meetingDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="회의에 대한 추가 설명을 입력하세요 (선택사항)"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1 gap-2">
              <X className="h-4 w-4" />
              취소
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
