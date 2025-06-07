import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

interface Standard {
  acronym: string
  title: string
  createdAt: string
  lastUpdated: string
}

// 표준문서 목록 조회
export async function GET() {
  try {
    if (!existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ standards: [] })
    }

    const data = await readFile(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    
    return NextResponse.json({ standards })
  } catch (error) {
    console.error('표준문서 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '표준문서 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 새 표준문서 생성
export async function POST(request: NextRequest) {
  try {
    const { acronym, title } = await request.json()

    if (!acronym || !title) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 기존 표준문서 목록 로드
    let standards: Standard[] = []
    if (existsSync(STANDARDS_FILE)) {
      const data = await readFile(STANDARDS_FILE, 'utf8')
      standards = JSON.parse(data)
    }

    // 중복 확인
    if (standards.find(s => s.acronym === acronym)) {
      return NextResponse.json(
        { error: '이미 존재하는 표준문서입니다' },
        { status: 409 }
      )
    }

    // 새 표준문서 추가
    const newStandard: Standard = {
      acronym,
      title,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    standards.push(newStandard)

    // 파일 저장
    await writeFile(STANDARDS_FILE, JSON.stringify(standards, null, 2))

    return NextResponse.json({
      success: true,
      standard: newStandard
    })

  } catch (error) {
    console.error('표준문서 생성 오류:', error)
    return NextResponse.json(
      { error: '표준문서 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}