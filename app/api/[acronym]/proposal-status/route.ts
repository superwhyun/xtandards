import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

    // meeting.json 파일 경로
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingFile = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    
    if (!fs.existsSync(meetingFile)) {
      return NextResponse.json({ error: '회의 데이터를 찾을 수 없습니다' }, { status: 404 })
    }

    // meeting.json 읽기
    const meetingData = JSON.parse(fs.readFileSync(meetingFile, 'utf8'))

    // proposal 상태 업데이트
    if (meetingData.proposals) {
      meetingData.proposals = meetingData.proposals.map((proposal: any) => {
        if (proposal.id === proposalId) {
          return { ...proposal, status }
        }
        return proposal
      })
    }

    // revision들의 상태도 업데이트
    if (meetingData.revisions && meetingData.revisions[proposalId]) {
      meetingData.revisions[proposalId] = meetingData.revisions[proposalId].map((revision: any) => ({
        ...revision,
        status
      }))
    }

    // meeting.json 저장
    fs.writeFileSync(meetingFile, JSON.stringify(meetingData, null, 2))

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