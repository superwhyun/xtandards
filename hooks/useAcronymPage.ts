import { useState, useEffect, useCallback } from "react"
import { getStandardData, saveStandardData } from "@/lib/standardData"
import { Standard, Meeting } from "@/types/standard"
import { useAuth } from "./useAuth"

export function useAcronymPage(acronym: string) {
  const { auth, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editMeetingOpen, setEditMeetingOpen] = useState(false)
  const [standard, setStandard] = useState<Standard | null>(null)
  const [activeMeetingId, setActiveMeetingId] = useState<string>("")
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    // 표준문서 데이터 로드
    if (acronym) {
      const standardData = getStandardData(acronym)
      if (standardData) {
        setStandard(standardData)
        if (standardData.meetings.length > 0) {
          setActiveMeetingId(standardData.meetings[0].id)
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
      const target = e.target as Element
      if (target.closest('.custom-scrollbar')) {
        if (e.touches.length === 1) {
          e.preventDefault()
        }
      }
    }
    const preventMouseBack = (e: MouseEvent) => {
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
          // 서버에서 메모를 불러오는 함수가 필요하다면 여기에 구현
        }
        loadMemos()
      }
    }
  }, [standard?.acronym, activeMeetingId])

  const updateStandard = async (updatedStandard: Standard) => {
    setStandard(updatedStandard)
    saveStandardData(updatedStandard)
    
    // 서버에도 전체 표준문서 데이터 저장
    try {
      console.log(`API 호출: PUT /api/standards/${updatedStandard.acronym}`)
      const response = await fetch(`/api/standards/${updatedStandard.acronym}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStandard),
      })
      
      if (!response.ok) {
        console.error('서버 저장 실패:', response.statusText)
      }
    } catch (error) {
      console.error('서버 저장 오류:', error)
    }
  }

  // 회의 수정 핸들러
  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
  }

  return {
    auth,
    settingsOpen, setSettingsOpen,
    editMeetingOpen, setEditMeetingOpen,
    standard, setStandard,
    activeMeetingId, setActiveMeetingId,
    editingMeeting, setEditingMeeting,
    handleLogout: logout,
    updateStandard,
    handleEditMeeting
  }
}