import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 특정 회의의 상세 정보 로드
function loadMeetingDetails(acronym: string, meetingId: string) {
  const safeMeetingId = sanitizeForPath(meetingId)
  const meetingFile = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
  
  if (!fs.existsSync(meetingFile)) {
    // meeting.json이 없으면 기본 구조 반환
    return {
      proposals: [],
      revisions: {},
      resultRevisions: [],
      previousDocument: null,
      resultDocument: null,
      memos: {}
    }
  }
  
  try {
    const data = fs.readFileSync(meetingFile, 'utf8')
    const meetingData = JSON.parse(data)
    return meetingData
  } catch (error) {
    console.error(`회의 데이터 로드 오류 (${acronym}/${safeMeetingId}):`, error)
    return {
      proposals: [],
      revisions: {},
      resultRevisions: [],
      previousDocument: null,
      resultDocument: null,
      memos: {}
    }
  }
}

// 특정 표준문서의 회의 목록 조회 (파일 정보 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { acronym: string } }
) {
  try {
    const { acronym } = await params
    
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    const standard = standards.standards.find((s: any) => s.acronym === acronym)
    if (!standard) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 각 회의에 상세 정보 추가
    const meetingsWithDetails = standard.meetings.map((meeting: any) => {
      const meetingDetails = loadMeetingDetails(acronym, meeting.id)
      return {
        ...meetingDetails,  // meeting.json 데이터 먼저
        ...meeting,         // standards.json 데이터 나중 (메타데이터만 덮어쓰기)
        // meeting.json의 proposals 데이터가 우선되도록 명시적으로 설정
        proposals: meetingDetails.proposals || [],
        revisions: meetingDetails.revisions || {},
        memos: meetingDetails.memos || {}
      }
    })
    
    return NextResponse.json({
      acronym: standard.acronym,
      title: standard.title,
      meetings: meetingsWithDetails
    })
    
  } catch (error) {
    console.error('회의 조회 오류:', error)
    return NextResponse.json({ error: '회의 조회 실패' }, { status: 500 })
  }
}