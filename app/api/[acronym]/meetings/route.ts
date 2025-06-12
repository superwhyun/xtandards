import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { MeetingDb } from '@/lib/database/operations'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 특정 표준문서의 회의 목록 조회 (파일 정보 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { acronym: string } }
) {
  try {
    const { acronym } = await params
    
    // 표준문서 폴더 확인
    const standardDir = path.join(process.cwd(), 'data', acronym)
    if (!fs.existsSync(standardDir)) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 미팅 목록 수집
    const meetings: any[] = []
    const meetingDirs = fs.readdirSync(standardDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    for (const meetingId of meetingDirs) {
      const meetingDbPath = path.join(standardDir, meetingId, 'meeting.db')
      if (fs.existsSync(meetingDbPath)) {
        try {
          const db = new MeetingDb(acronym, meetingId)
          
          // DB에서 모든 회의 조회 (실제 회의 ID로 조회)
          const allMeetings = db.getAllMeetings()
          
          for (const meeting of allMeetings) {
            const documents = db.getAllDocuments(meeting.id)
            const memos = db.getAllMemos(meeting.id)
            
            const meetingWithDocuments = {
              ...meeting,
              proposals: documents.proposals,
              revisions: documents.revisions,
              resultDocument: documents.resultDocument,
              resultRevisions: documents.resultRevisions,
              previousDocument: documents.previousDocument,
              memos: memos
            }
            
            meetings.push(meetingWithDocuments)
          }
          
          db.close()
        } catch (error) {
          console.error(`미팅 데이터 읽기 오류 (${meetingId}):`, error)
        }
      }
    }
    
    // 미팅을 생성일 기준으로 정렬
    meetings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    // 표준문서 기본 정보 가져오기
    const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')
    let standardInfo = { acronym, title: acronym }
    
    if (fs.existsSync(STANDARDS_FILE)) {
      try {
        const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
        const standards = JSON.parse(data)
        const standard = standards.standards.find((s: any) => s.acronym === acronym)
        if (standard) {
          standardInfo = { acronym: standard.acronym, title: standard.title }
        }
      } catch (error) {
        console.error('표준문서 기본 정보 읽기 오류:', error)
      }
    }
    
    return NextResponse.json({
      ...standardInfo,
      meetings
    })
    
  } catch (error) {
    console.error('회의 조회 오류:', error)
    return NextResponse.json({ error: '회의 조회 실패' }, { status: 500 })
  }
}