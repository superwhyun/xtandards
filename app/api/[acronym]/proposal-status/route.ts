import { NextRequest, NextResponse } from 'next/server'
import { MeetingDb } from '@/lib/database/operations'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { acronym: string } }
) {
  try {
    const { acronym } = await params
    const { meetingId, proposalId, status } = await request.json()

    if (!meetingId || !proposalId || !status) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // SQLite DB 업데이트
    const db = new MeetingDb(acronym, meetingId)
    
    // proposal 상태 업데이트
    db.updateDocumentStatus(proposalId, status)
    
    // 해당 proposal의 revision들도 같은 상태로 업데이트
    const revisions = db.getRevisions(proposalId)
    revisions.forEach(revision => {
      db.updateDocumentStatus(revision.id, status)
    })
    
    db.close()

    return NextResponse.json({ 
      success: true, 
      message: '상태가 성공적으로 업데이트되었습니다' 
    })

  } catch (error) {
    console.error('상태 업데이트 오류:', error)
    return NextResponse.json({ error: '상태 업데이트 실패' }, { status: 500 })
  }
}
// %%%%%LAST%%%%%