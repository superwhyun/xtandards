import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 회의 상태 업데이트 (완료/미완료 토글)
export async function POST(request: NextRequest) {
  try {
    const { acronym, meetingId, isCompleted } = await request.json()
    
    if (!acronym || !meetingId || typeof isCompleted !== 'boolean') {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }
    
    // standards.json 업데이트
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    const standardIndex = standards.standards.findIndex((s: any) => s.acronym === acronym)
    if (standardIndex === -1) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const standard = standards.standards[standardIndex]
    const meetingIndex = standard.meetings.findIndex((m: any) => m.id === meetingId)
    if (meetingIndex === -1) {
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 회의 상태 업데이트
    standard.meetings[meetingIndex].isCompleted = isCompleted
    standard.meetings[meetingIndex].updatedAt = new Date().toISOString()
    standard.updatedAt = new Date().toISOString()
    
    // meeting.json도 업데이트
    const meeting = standard.meetings[meetingIndex]
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, meeting.title, 'meeting.json')
    
    if (fs.existsSync(meetingJsonPath)) {
      const meetingData = JSON.parse(fs.readFileSync(meetingJsonPath, 'utf8'))
      meetingData.isCompleted = isCompleted
      meetingData.updatedAt = new Date().toISOString()
      fs.writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))
    }
    
    // standards.json 저장
    fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))
    
    return NextResponse.json({ 
      message: '회의 상태가 업데이트되었습니다',
      isCompleted
    })
    
  } catch (error) {
    console.error('회의 상태 업데이트 오류:', error)
    return NextResponse.json({ error: '회의 상태 업데이트 실패' }, { status: 500 })
  }
}