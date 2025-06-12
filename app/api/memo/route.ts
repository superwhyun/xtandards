import { NextRequest, NextResponse } from 'next/server'
import { MeetingDb } from '@/lib/database/operations'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 메모 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const meetingId = searchParams.get('meetingId')
    
    if (!acronym || !meetingId) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }
    
    // SQLite DB에서 메모 조회
    const db = new MeetingDb(acronym, meetingId)
    const memos = db.getAllMemos(meetingId)
    db.close()
    
    return NextResponse.json({ memos })
    
  } catch (error) {
    console.error('메모 조회 오류:', error)
    return NextResponse.json({ error: '메모 조회 실패' }, { status: 500 })
  }
}

// 메모 업데이트
export async function POST(request: NextRequest) {
  try {
    const { acronym, meetingId, proposalId, memo } = await request.json()
    
    if (!acronym || !meetingId || !proposalId) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }
    
    // SQLite DB 업데이트
    const db = new MeetingDb(acronym, meetingId)
    
    const memoData = {
      meetingId: meetingId,
      documentId: proposalId,
      memo: memo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    db.saveMemo(memoData)
    db.close()
    
    return NextResponse.json({ 
      message: '메모가 저장되었습니다'
    })
    
  } catch (error) {
    console.error('메모 저장 오류:', error)
    return NextResponse.json({ error: '메모 저장 실패' }, { status: 500 })
  }
}

// %%%%%LAST%%%%%