import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

// 표준문서 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    
    if (!acronym) {
      return NextResponse.json({ error: '표준문서 약어가 필요합니다' }, { status: 400 })
    }
    
    // 기존 데이터 읽기
    if (!fs.existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }
    
    const data = fs.readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    // 해당 표준문서 찾기
    const standardIndex = standards.standards.findIndex((s: any) => s.acronym === acronym)
    
    if (standardIndex === -1) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }
    
    // 표준문서 제거
    standards.standards.splice(standardIndex, 1)
    
    // 파일에 저장
    fs.writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))
    
    // 표준문서 폴더 삭제
    const standardDir = path.join(process.cwd(), 'data', acronym)
    if (fs.existsSync(standardDir)) {
      fs.rmSync(standardDir, { recursive: true, force: true })
    }
    
    return NextResponse.json({ 
      message: '표준문서가 삭제되었습니다'
    })
    
  } catch (error) {
    console.error('표준문서 삭제 오류:', error)
    return NextResponse.json({ error: '표준문서 삭제 실패' }, { status: 500 })
  }
}

// %%%%%LAST%%%%%