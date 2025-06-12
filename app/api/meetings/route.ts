import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { MeetingDb } from '@/lib/database/operations'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|\s]/g, '_')
}

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
    
    // 각 표준문서에 회의 추가
    let createdCount = 0
    const errors: string[] = []
    
    for (const acronym of standardAcronyms) {
      try {
        // 표준문서 폴더 확인
        const standardDir = path.join(process.cwd(), 'data', acronym)
        if (!fs.existsSync(standardDir)) {
          errors.push(`표준문서 폴더가 없습니다: ${acronym}`)
          continue
        }
        
        // 날짜 기반 ID 생성 (YYMM-title 형식)
        const startDateObj = new Date(startDate)
        const yearMonth = startDateObj.getFullYear().toString().slice(2) + 
                         (startDateObj.getMonth() + 1).toString().padStart(2, '0')
        
        // 중복 ID 체크 및 유니크 ID 생성 (처음부터 sanitize)
        let uniqueId = sanitizeForPath(`${yearMonth}-${title}`)
        let counter = 1
        while (fs.existsSync(path.join(standardDir, uniqueId))) {
          uniqueId = sanitizeForPath(`${yearMonth}-${title} (${counter})`)
          counter++
        }
        
        // 회의 폴더 생성 (이미 sanitize된 ID 사용)
        const meetingDir = path.join(standardDir, uniqueId)
        fs.mkdirSync(meetingDir, { recursive: true })

        // SQLite DB 생성 및 회의 데이터 저장
        const db = new MeetingDb(acronym, uniqueId)
        const meetingData = {
          id: uniqueId,
          title,
          startDate,
          endDate,
          description: description || '',
          isCompleted: false,
          previousDocument: null,
          resultDocument: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        db.saveMeeting(meetingData)
        db.close()
        
        // standards.json에 meetingId 추가
        try {
          if (fs.existsSync(STANDARDS_FILE)) {
            const standardsData = fs.readFileSync(STANDARDS_FILE, 'utf8')
            const standardsJson = JSON.parse(standardsData)
            
            const standardIndex = standardsJson.standards.findIndex((s: any) => s.acronym === acronym)
            if (standardIndex !== -1) {
              if (!standardsJson.standards[standardIndex].meetingIds) {
                standardsJson.standards[standardIndex].meetingIds = []
              }
              standardsJson.standards[standardIndex].meetingIds.push(uniqueId)
              standardsJson.standards[standardIndex].updatedAt = new Date().toISOString()
              
              fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standardsJson, null, 2))
            }
          }
        } catch (error) {
          console.error(`standards.json 업데이트 오류 (${acronym}):`, error)
        }
        
        createdCount++
        
      } catch (error) {
        console.error(`회의 생성 오류 (${acronym}):`, error)
        errors.push(`${acronym}: 회의 생성 실패`)
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json({ 
        message: `${createdCount}개 회의 생성 완료, ${errors.length}개 오류`,
        createdCount,
        errors
      }, { status: 207 }) // Multi-Status
    }
    
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
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ meetingTitles: [] })
    }
    
    const titles = new Set<string>()
    
    // 모든 표준문서 폴더 순회
    const standardDirs = fs.readdirSync(dataDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map(dirent => dirent.name)
    
    for (const acronym of standardDirs) {
      const standardDir = path.join(dataDir, acronym)
      
      // 각 표준문서의 미팅 폴더들 순회
      if (fs.existsSync(standardDir)) {
        const meetingDirs = fs.readdirSync(standardDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
        
        for (const meetingId of meetingDirs) {
          const meetingDbPath = path.join(standardDir, meetingId, 'meeting.db')
          if (fs.existsSync(meetingDbPath)) {
            try {
              const db = new MeetingDb(acronym, meetingId)
              const meeting = db.getMeeting(meetingId)
              if (meeting && meeting.title && meeting.title.trim()) {
                titles.add(meeting.title.trim())
              }
              db.close()
            } catch (error) {
              console.error(`미팅 데이터 읽기 오류 (${acronym}/${meetingId}):`, error)
            }
          }
        }
      }
    }
    
    return NextResponse.json({ 
      meetingTitles: Array.from(titles).sort() 
    })
    
  } catch (error) {
    console.error('회의명 조회 오류:', error)
    return NextResponse.json({ error: '회의명 조회 실패' }, { status: 500 })
  }
}