import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 회의 생성
export async function POST(request: NextRequest) {
  try {
    const { standardAcronyms, startDate, endDate, title, description } = await request.json()
    
    if (!standardAcronyms || !Array.isArray(standardAcronyms) || standardAcronyms.length === 0) {
      return NextResponse.json({ error: '표준문서를 선택해주세요' }, { status: 400 })
    }
    
    if (!startDate || !endDate || !title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }
    
    // 기존 데이터 읽기
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    // 각 표준문서에 회의 추가
    let createdCount = 0
    
    standardAcronyms.forEach((acronym: string) => {
      const standardIndex = standards.standards.findIndex((s: any) => s.acronym === acronym)
      
      if (standardIndex >= 0) {
        const standard = standards.standards[standardIndex]
        
        // meetings 배열 초기화
        if (!Array.isArray(standard.meetings)) {
          standard.meetings = []
        }
        
        // 중복 ID 체크 및 유니크 ID 생성
        let uniqueId = title
        let counter = 1
        while (standard.meetings.some((m: any) => m.id === uniqueId)) {
          uniqueId = `${title} (${counter})`
          counter++
        }
        
        const newMeeting = {
          id: uniqueId,
          title,
          startDate,
          endDate,
          description: description || '',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        standard.meetings.push(newMeeting)
        standard.updatedAt = new Date().toISOString()
        standards.standards[standardIndex] = standard
        createdCount++
        
        // 회의 폴더 생성
        const meetingDir = path.join(process.cwd(), 'data', acronym, title)
        if (!fs.existsSync(meetingDir)) {
          fs.mkdirSync(meetingDir, { recursive: true })
        }

        // meeting.json 생성
        const meetingJsonPath = path.join(meetingDir, 'meeting.json')
        const meetingData = {
          id: uniqueId,
          title,
          startDate,
          endDate,
          description: description || '',
          isCompleted: false,
          proposals: [],
          revisions: {},
          resultRevisions: [],
          previousDocument: null,
          resultDocument: null,
          memos: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        fs.writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))
      }
    })
    
    // 파일에 저장
    fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))
    
    return NextResponse.json({ 
      message: `${createdCount}개 표준문서에 회의가 생성되었습니다`,
      createdCount
    })
    
  } catch (error) {
    console.error('회의 생성 오류:', error)
    return NextResponse.json({ error: '회의 생성 실패' }, { status: 500 })
  }
}

// 전체 회의명 목록 조회
export async function GET() {
  try {
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ meetingTitles: [] })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    const titles = new Set<string>()
    
    standards.standards.forEach((standard: any) => {
      if (Array.isArray(standard.meetings)) {
        standard.meetings.forEach((meeting: any) => {
          if (meeting.title && meeting.title.trim()) {
            titles.add(meeting.title.trim())
          }
        })
      }
    })
    
    return NextResponse.json({ 
      meetingTitles: Array.from(titles).sort() 
    })
    
  } catch (error) {
    console.error('회의명 조회 오류:', error)
    return NextResponse.json({ error: '회의명 조회 실패' }, { status: 500 })
  }
}