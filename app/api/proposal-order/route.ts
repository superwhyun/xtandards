import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// 기고서 순서 변경
export async function PUT(request: NextRequest) {
  try {
    const { acronym, meetingId, proposals } = await request.json()
    
    if (!acronym || !meetingId || !Array.isArray(proposals)) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }
    
    // meeting.json 업데이트
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    
    if (!fs.existsSync(meetingJsonPath)) {
      return NextResponse.json({ error: '회의 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const meetingData = JSON.parse(fs.readFileSync(meetingJsonPath, 'utf8'))
    
    // 기고서 순서 업데이트
    meetingData.proposals = proposals
    meetingData.updatedAt = new Date().toISOString()
    
    // meeting.json 저장
    fs.writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))
    
    return NextResponse.json({ 
      message: '기고서 순서가 변경되었습니다'
    })
    
  } catch (error) {
    console.error('순서 변경 오류:', error)
    return NextResponse.json({ error: '순서 변경 실패' }, { status: 500 })
  }
}

// %%%%%LAST%%%%%