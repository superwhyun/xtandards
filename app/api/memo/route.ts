import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
    
    // meeting.json에서 메모 조회
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    if (!fs.existsSync(meetingJsonPath)) {
      return NextResponse.json({ memos: {} })
    }
    
    const meetingData = JSON.parse(fs.readFileSync(meetingJsonPath, 'utf8'))
    
    return NextResponse.json({ 
      memos: meetingData.memos || {}
    })
    
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
    
    // meeting.json 업데이트
    const safeMeetingId = sanitizeForPath(meetingId)
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    
    if (!fs.existsSync(meetingJsonPath)) {
      return NextResponse.json({ error: '회의 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const meetingData = JSON.parse(fs.readFileSync(meetingJsonPath, 'utf8'))
    
    // 메모 업데이트
    if (!meetingData.memos) {
      meetingData.memos = {}
    }
    
    meetingData.memos[proposalId] = memo
    meetingData.updatedAt = new Date().toISOString()
    
    // meeting.json 저장
    fs.writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))
    
    return NextResponse.json({ 
      message: '메모가 저장되었습니다'
    })
    
  } catch (error) {
    console.error('메모 저장 오류:', error)
    return NextResponse.json({ error: '메모 저장 실패' }, { status: 500 })
  }
}

// %%%%%LAST%%%%%