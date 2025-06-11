import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 표준문서 목록 조회
export async function GET() {
  try {
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ standards: [] })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    return NextResponse.json(standards)
  } catch (error) {
    console.error('표준문서 조회 오류:', error)
    return NextResponse.json({ error: '표준문서 조회 실패' }, { status: 500 })
  }
}

// 새 표준문서 생성
export async function POST(request: NextRequest) {
  try {
    const { acronym, title } = await request.json()
    
    if (!acronym || !title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }
    
    // 기존 데이터 읽기
    let standards = { standards: [] }
    if (fs.existsSync(STANDARDS_FILE)) {
      const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
      standards = JSON.parse(data)
    }
    
    // 중복 체크
    const exists = standards.standards.some((s: any) => s.acronym === acronym)
    if (exists) {
      return NextResponse.json({ error: '이미 존재하는 표준문서입니다' }, { status: 409 })
    }
    
    // 새 표준문서 추가
    const newStandard = {
      acronym,
      title,
      meetings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    standards.standards.push(newStandard)
    
    // 파일에 저장
    fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))
    
    // 표준문서별 디렉토리 생성
    const standardDir = path.join(process.cwd(), 'data', acronym)
    if (!fs.existsSync(standardDir)) {
      fs.mkdirSync(standardDir, { recursive: true })
    }
    
    return NextResponse.json({ 
      message: '표준문서가 생성되었습니다',
      standard: newStandard
    })
    
  } catch (error) {
    console.error('표준문서 생성 오류:', error)
    return NextResponse.json({ error: '표준문서 생성 실패' }, { status: 500 })
  }
}

// %%%%%LAST%%%%%