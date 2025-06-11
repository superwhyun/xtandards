import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
    
    // meeting.json 업데이트
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    
    if (!fs.existsSync(meetingJsonPath)) {
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const meetingData = JSON.parse(fs.readFileSync(meetingJsonPath, 'utf8'))
    meetingData.isCompleted = isCompleted
    meetingData.updatedAt = new Date().toISOString()
    
    fs.writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))
    
    return NextResponse.json({ 
      message: '회의 상태가 업데이트되었습니다',
      isCompleted
    })
    
  } catch (error) {
    console.error('회의 상태 업데이트 오류:', error)
    return NextResponse.json({ error: '회의 상태 업데이트 실패' }, { status: 500 })
  }
}