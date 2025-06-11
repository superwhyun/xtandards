import { Standard } from "@/types/standard"

export const getStandardData = async (acronym: string): Promise<Standard | null> => {
  try {
    console.log(`API 호출: GET /api/standards/${acronym}`)
    const response = await fetch(`/api/standards/${acronym}`)
    if (!response.ok) {
      return null
    }
    
    const standardData = await response.json()
    
    if (standardData) {
      // meetings가 배열이 아닌 경우 (숫자인 경우) 빈 배열로 초기화
      const meetings = Array.isArray(standardData.meetings) ? standardData.meetings : []
      
      // 회의 데이터가 없으면 빈 배열로 초기화, memos 필드도 확인
      return {
        ...standardData,
        meetings: meetings.map((meeting: any) => ({
          ...meeting,
          memos: meeting.memos || {}
        }))
      }
    }
    
    return null
  } catch (error) {
    console.error('표준문서 데이터 로드 오류:', error)
    return null
  }
}

export const saveStandardData = async (standard: Standard) => {
  // 이 함수는 더 이상 사용되지 않음 - 개별 API 엔드포인트 사용
  // 레거시 코드 호환성을 위해 빈 함수로 유지
}