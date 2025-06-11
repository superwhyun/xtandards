import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

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
    
    // 기존 데이터 읽기
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    // 표준문서 찾기
    const standardIndex = standards.standards.findIndex((s: any) => s.acronym === acronym)
    if (standardIndex === -1) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const standard = standards.standards[standardIndex]
    
    // 회의 찾기
    const meetingIndex = standard.meetings.findIndex((m: any) => m.id === meetingId)
    if (meetingIndex === -1) {
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const meeting = standard.meetings[meetingIndex]
    
    // 완료된 회의는 삭제 불가
    if (meeting.isCompleted) {
      return NextResponse.json({ error: '완료된 회의는 삭제할 수 없습니다' }, { status: 400 })
    }
    
    // 회의 폴더 삭제 (meetingId 기반)
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingDir = path.join(process.cwd(), 'data', acronym, safeMeetingId)
    if (fs.existsSync(meetingDir)) {
      fs.rmSync(meetingDir, { recursive: true, force: true })
    }
    
    // 회의 데이터 삭제
    standard.meetings.splice(meetingIndex, 1)
    standard.updatedAt = new Date().toISOString()
    
    // 파일에 저장
    fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))
    
    return NextResponse.json({ message: '회의가 삭제되었습니다' })
    
  } catch (error) {
    console.error('회의 삭제 오류:', error)
    return NextResponse.json({ error: '회의 삭제 실패' }, { status: 500 })
  }
}
// %%%%%LAST%%%%%