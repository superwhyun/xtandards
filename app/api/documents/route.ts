import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Document {
  id: string
  name: string
  type: "previous" | "proposal" | "revision" | "result"
  uploadDate: string
  filePath: string
  status?: "accepted" | "review" | "rejected" | "pending"
  meetingId: string
  proposalId?: string
}

// 문서 정보 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    const { acronym, document } = await request.json()

    if (!acronym || !document) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const standardDir = path.join(process.cwd(), 'data', acronym)
    const documentsFile = path.join(standardDir, 'documents.json')

    // 디렉토리 생성
    if (!existsSync(standardDir)) {
      await mkdir(standardDir, { recursive: true })
    }

    // 기존 문서 목록 로드
    let documents: Document[] = []
    if (existsSync(documentsFile)) {
      const data = await readFile(documentsFile, 'utf8')
      documents = JSON.parse(data)
    }

    // 기존 문서 찾기 (업데이트) 또는 새로 추가
    const existingIndex = documents.findIndex(d => d.id === document.id)
    if (existingIndex !== -1) {
      documents[existingIndex] = { ...documents[existingIndex], ...document }
    } else {
      documents.push(document)
    }

    // 파일 저장
    await writeFile(documentsFile, JSON.stringify(documents, null, 2))

    return NextResponse.json({
      success: true,
      document: documents[existingIndex !== -1 ? existingIndex : documents.length - 1]
    })

  } catch (error) {
    console.error('문서 저장 오류:', error)
    return NextResponse.json(
      { error: '문서 저장 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 문서 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const meetingId = searchParams.get('meetingId')

    if (!acronym) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const documentsFile = path.join(process.cwd(), 'data', acronym, 'documents.json')

    if (!existsSync(documentsFile)) {
      return NextResponse.json({ documents: [] })
    }

    const data = await readFile(documentsFile, 'utf8')
    let documents: Document[] = JSON.parse(data)

    // 특정 회의의 문서만 필터링
    if (meetingId) {
      documents = documents.filter(d => d.meetingId === meetingId)
    }

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('문서 조회 오류:', error)
    return NextResponse.json(
      { error: '문서 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 문서 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const documentId = searchParams.get('documentId')

    if (!acronym || !documentId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const documentsFile = path.join(process.cwd(), 'data', acronym, 'documents.json')

    if (!existsSync(documentsFile)) {
      return NextResponse.json(
        { error: '문서 파일을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const data = await readFile(documentsFile, 'utf8')
    let documents: Document[] = JSON.parse(data)

    // 해당 문서 제거
    documents = documents.filter(d => d.id !== documentId)

    // 파일 저장
    await writeFile(documentsFile, JSON.stringify(documents, null, 2))

    return NextResponse.json({
      success: true,
      message: '문서가 삭제되었습니다'
    })

  } catch (error) {
    console.error('문서 삭제 오류:', error)
    return NextResponse.json(
      { error: '문서 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}