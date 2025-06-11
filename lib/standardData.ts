import { Standard } from "@/types/standard"

export const getStandardData = async (acronym: string): Promise<Standard | null> => {
  try {
    const response = await fetch('/api/standards')
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    const foundStandard = data.standards.find((s: any) => s.acronym === acronym)
    
    if (foundStandard) {
      // meetings가 배열이 아닌 경우 (숫자인 경우) 빈 배열로 초기화
      const meetings = Array.isArray(foundStandard.meetings) ? foundStandard.meetings : []
      
      // 회의 데이터가 없으면 빈 배열로 초기화, memos 필드도 확인
      return {
        ...foundStandard,
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
  // 서버 API로 저장하는 로직은 별도 API 엔드포인트가 필요함
  // 현재는 각 기능별 API를 사용 (회의 생성, 메모 저장 등)
  console.log('saveStandardData는 더 이상 사용되지 않습니다. 개별 API를 사용하세요.')
}