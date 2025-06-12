import { NextRequest, NextResponse } from 'next/server'
import { MeetingDb } from '@/lib/database/operations'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 회의 상태 업데이트 (완료/미완료 토글)
export async function POST(request: NextRequest) {
  try {
    const { acronym, meetingId, isCompleted } = await request.json()
    
    if (!acronym || !meetingId || typeof isCompleted !== 'boolean') {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }
    
    // SQLite DB 업데이트
    const db = new MeetingDb(acronym, meetingId)
    db.updateMeetingCompletion(meetingId, isCompleted)
    db.close()
    
    return NextResponse.json({ 
      message: '회의 상태가 업데이트되었습니다',
      isCompleted
    })
    
  } catch (error) {
    console.error('회의 상태 업데이트 오류:', error)
    return NextResponse.json({ error: '회의 상태 업데이트 실패' }, { status: 500 })
  }
}