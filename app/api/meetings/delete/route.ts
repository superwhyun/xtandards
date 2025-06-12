import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { MeetingDb } from '@/lib/database/operations'

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
    const meetingDir = path.join(process.cwd(), 'data', acronym, meetingId)
    const meetingDbPath = path.join(meetingDir, 'meeting.db')
    
    // 회의 존재 확인
    if (!fs.existsSync(meetingDbPath)) {
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 회의 데이터 읽기
    const db = new MeetingDb(acronym, meetingId)
    const allMeetings = db.getAllMeetings()
    
    if (allMeetings.length === 0) {
      db.close()
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 첫 번째 회의를 대상으로 (보통 폴더당 하나의 회의)
    const meeting = allMeetings[0]
    
    // 완료된 회의는 삭제 불가
    if (meeting.isCompleted) {
      db.close()
      return NextResponse.json({ error: '완료된 회의는 삭제할 수 없습니다' }, { status: 400 })
    }
    
    db.close()
    
    // 회의 폴더 전체 삭제
    if (fs.existsSync(meetingDir)) {
      fs.rmSync(meetingDir, { recursive: true, force: true })
    }
    
    // standards.json에서 meetingId 제거
    try {
      const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')
      if (fs.existsSync(STANDARDS_FILE)) {
        const standardsData = fs.readFileSync(STANDARDS_FILE, 'utf8')
        const standardsJson = JSON.parse(standardsData)
        
        const standardIndex = standardsJson.standards.findIndex((s: any) => s.acronym === acronym)
        if (standardIndex !== -1 && standardsJson.standards[standardIndex].meetingIds) {
          standardsJson.standards[standardIndex].meetingIds = 
            standardsJson.standards[standardIndex].meetingIds.filter((id: string) => id !== meetingId)
          standardsJson.standards[standardIndex].updatedAt = new Date().toISOString()
          
          fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standardsJson, null, 2))
        }
      }
    } catch (error) {
      console.error(`standards.json 업데이트 오류 (${acronym}):`, error)
    }
    
    return NextResponse.json({ message: '회의가 삭제되었습니다' })
    
  } catch (error) {
    console.error('회의 삭제 오류:', error)
    return NextResponse.json({ error: '회의 삭제 실패' }, { status: 500 })
  }
}
// %%%%%LAST%%%%%