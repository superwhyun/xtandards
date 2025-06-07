import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 메모 저장
export async function POST(request: NextRequest) {
  try {
    const { acronym, meetingDate, proposalId, proposalName, memo } = await request.json()

    if (!acronym || !meetingDate || !proposalId || !proposalName) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // C 폴더 경로
    const cDir = path.join(process.cwd(), 'data', acronym, meetingDate, 'C')
    if (!existsSync(cDir)) {
      await mkdir(cDir, { recursive: true })
    }

    // 메모 파일 경로 (기고서 이름 기반)
    const baseName = path.parse(proposalName).name
    const memoFilePath = path.join(cDir, `${baseName}.json`)

    // 메모 데이터 구조
    const memoData = {
      proposalId,
      proposalName,
      memo: memo || '',
      lastUpdated: new Date().toISOString()
    }

    // 메모 파일 저장
    await writeFile(memoFilePath, JSON.stringify(memoData, null, 2))

    return NextResponse.json({
      success: true,
      message: '메모가 저장되었습니다'
    })

  } catch (error) {
    console.error('메모 저장 오류:', error)
    return NextResponse.json(
      { error: '메모 저장 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 메모 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const meetingDate = searchParams.get('meetingDate')

    if (!acronym || !meetingDate) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // C 폴더 경로
    const cDir = path.join(process.cwd(), 'data', acronym, meetingDate, 'C')
    
    if (!existsSync(cDir)) {
      return NextResponse.json({ memos: {} })
    }

    // C 폴더에서 .json 파일들 찾기
    const fs = require('fs')
    const files = fs.readdirSync(cDir).filter((file: string) => file.endsWith('.json'))
    
    const memos: { [key: string]: string } = {}
    
    for (const file of files) {
      try {
        const filePath = path.join(cDir, file)
        const memoContent = await readFile(filePath, 'utf8')
        const memoData = JSON.parse(memoContent)
        memos[memoData.proposalId] = memoData.memo
      } catch (error) {
        console.error(`메모 파일 읽기 오류 (${file}):`, error)
      }
    }

    return NextResponse.json({ memos })

  } catch (error) {
    console.error('메모 조회 오류:', error)
    return NextResponse.json(
      { error: '메모 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}