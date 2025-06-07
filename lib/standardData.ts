import { Standard } from "@/types/standard"

export const getStandardData = (acronym: string): Standard | null => {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('standards')
  const standards = stored ? JSON.parse(stored) : []
  const foundStandard = standards.find((s: any) => s.acronym === acronym)

  if (foundStandard) {
    // 회의 데이터가 없으면 빈 배열로 초기화, memos 필드도 확인
    return {
      ...foundStandard,
      meetings: (foundStandard.meetings || []).map((meeting: any) => ({
        ...meeting,
        memos: meeting.memos || {}
      }))
    }
  }

  return null
}

export const saveStandardData = (standard: Standard) => {
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem('standards')
  const standards = stored ? JSON.parse(stored) : []
  const index = standards.findIndex((s: any) => s.acronym === standard.acronym)

  if (index >= 0) {
    standards[index] = standard
  } else {
    standards.push(standard)
  }

  localStorage.setItem('standards', JSON.stringify(standards))
}