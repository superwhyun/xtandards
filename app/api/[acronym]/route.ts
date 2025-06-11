import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 특정 표준문서 정보 조회 (미팅 목록 포함)
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
    
    // 표준문서 폴더에서 미팅 목록 수집
    const meetings: any[] = []
    const standardDir = path.join(process.cwd(), 'data', acronym)
    
    if (fs.existsSync(standardDir)) {
      const meetingDirs = fs.readdirSync(standardDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
      
      for (const meetingId of meetingDirs) {
        const meetingJsonPath = path.join(standardDir, meetingId, 'meeting.json')
        if (fs.existsSync(meetingJsonPath)) {
          try {
            const meetingData = fs.readFileSync(meetingJsonPath, 'utf8')
            const meeting = JSON.parse(meetingData)
            meetings.push({
              id: meeting.id,
              title: meeting.title,
              startDate: meeting.startDate,
              endDate: meeting.endDate,
              description: meeting.description,
              isCompleted: meeting.isCompleted,
              createdAt: meeting.createdAt,
              updatedAt: meeting.updatedAt
            })
          } catch (error) {
            console.error(`미팅 데이터 읽기 오류 (${meetingId}):`, error)
          }
        }
      }
    }
    
    // 미팅을 생성일 기준으로 정렬
    meetings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    return NextResponse.json({ 
      standard: {
        ...standard,
        meetings
      }
    })
    
  } catch (error) {
    console.error('표준문서 조회 오류:', error)
    return NextResponse.json({ error: '표준문서 조회 실패' }, { status: 500 })
  }
}

// 표준문서 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { acronym: string } }
) {
  try {
    const { acronym } = await params
    const updatedStandard = await request.json()
    
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    const standardIndex = standards.standards.findIndex((s: any) => s.acronym === acronym)
    if (standardIndex === -1) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 업데이트
    standards.standards[standardIndex] = {
      ...standards.standards[standardIndex],
      ...updatedStandard,
      updatedAt: new Date().toISOString()
    }
    
    fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))
    
    return NextResponse.json({ message: '표준문서가 업데이트되었습니다' })
    
  } catch (error) {
    console.error('표준문서 업데이트 오류:', error)
    return NextResponse.json({ error: '표준문서 업데이트 실패' }, { status: 500 })
  }
}
// %%%%%LAST%%%%%