import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 회의 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const meetingId = searchParams.get('meetingId')
    
    if (!acronym || !meetingId) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }
    
    // 회의 폴더 경로
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingDir = path.join(process.cwd(), 'data', acronym, safeMeetingId)
    const meetingJsonPath = path.join(meetingDir, 'meeting.json')
    
    // 회의 존재 확인
    if (!fs.existsSync(meetingJsonPath)) {
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 회의 데이터 읽기
    const meetingData = fs.readFileSync(meetingJsonPath, 'utf8')
    const meeting = JSON.parse(meetingData)
    
    // 완료된 회의는 삭제 불가
    if (meeting.isCompleted) {
      return NextResponse.json({ error: '완료된 회의는 삭제할 수 없습니다' }, { status: 400 })
    }
    
    // 회의 폴더 전체 삭제
    if (fs.existsSync(meetingDir)) {
      fs.rmSync(meetingDir, { recursive: true, force: true })
    }
    
    return NextResponse.json({ message: '회의가 삭제되었습니다' })
    
  } catch (error) {
    console.error('회의 삭제 오류:', error)
    return NextResponse.json({ error: '회의 삭제 실패' }, { status: 500 })
  }
}
// %%%%%LAST%%%%%