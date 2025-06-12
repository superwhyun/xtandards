import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { MeetingDb } from '@/lib/database/operations'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 파일 삭제 및 meeting.json 업데이트
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const meetingId = decodeURIComponent(searchParams.get('meetingId') || '')
    const documentId = searchParams.get('documentId')
    const type = searchParams.get('type')
    const proposalId = searchParams.get('proposalId')
    const filePath = searchParams.get('filePath')
    
    console.log('삭제 파라미터 확인:', { acronym, meetingId, documentId, type })
    
    if (!acronym || !meetingId || !documentId || !type) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // 실제 파일 삭제
    if (filePath) {
      const fullFilePath = path.join(process.cwd(), filePath)
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath)
      }
    }

    // meeting.json 업데이트
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, meetingId, 'meeting.json')
    if (!fs.existsSync(meetingJsonPath)) {
      return NextResponse.json({ error: '회의 데이터를 찾을 수 없습니다' }, { status: 404 })
    }

    const meetingData = JSON.parse(fs.readFileSync(meetingJsonPath, 'utf8'))

    // 타입별로 삭제 처리
    switch (type) {
      case 'base':
        meetingData.previousDocument = null
        break
      case 'proposal':
        meetingData.proposals = meetingData.proposals.filter((p: any) => p.id !== documentId)
        // 해당 proposal의 revision도 모두 삭제
        if (proposalId) {
          meetingData.revisions = meetingData.revisions?.filter((r: any) => r.proposalId !== proposalId) || []
        }
        break
      case 'revision':
        meetingData.revisions = meetingData.revisions?.filter((r: any) => r.id !== documentId) || []
        break
      case 'output':
        meetingData.outputDocuments = meetingData.outputDocuments?.filter((o: any) => o.id !== documentId) || []
        break
      default:
        return NextResponse.json({ error: '유효하지 않은 파일 타입입니다' }, { status: 400 })
    }

    // 업데이트된 데이터 저장
    fs.writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))
    
    return NextResponse.json({ message: '파일이 삭제되었습니다' })
    
  } catch (error) {
    console.error('파일 삭제 오류:', error)
    return NextResponse.json({ error: '파일 삭제 실패' }, { status: 500 })
  }
}
