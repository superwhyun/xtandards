import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const acronym = formData.get('acronym') as string
    const meetingId = formData.get('meetingId') as string
    const type = formData.get('type') as string
    const extractedTitle = formData.get('extractedTitle') as string
    const extractedAbstract = formData.get('extractedAbstract') as string

    if (!file || !acronym || !meetingId || !type) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
    const fileExtension = path.extname(file.name).toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 업로드 디렉토리 생성 (C 폴더에 저장)
    const safeMeetingId = sanitizeForPath(meetingId)
    const uploadDir = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'C')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 파일명 중복 방지 (타임스탬프 추가)
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const filePath = path.join(uploadDir, fileName)

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 새 기고서 문서 생성
    const newDocument = {
      id: `doc-${timestamp}`,
      name: extractedTitle && extractedTitle.trim() ? extractedTitle.trim() : file.name, // 추출된 제목 우선 사용
      fileName: file.name, // 원본 파일명 별도 저장
      abstract: extractedAbstract && extractedAbstract.trim() ? extractedAbstract.trim() : '', // 추출된 Abstract
      type: "proposal",
      uploadDate: new Date().toISOString(),
      connections: [],
      status: 'pending',
      filePath: path.relative(process.cwd(), filePath),
      uploader: 'user' // TODO: 실제 사용자 정보 사용
    }

    // meeting.json 업데이트
    const meetingJsonPath = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    let meetingData: any = {}
    
    if (existsSync(meetingJsonPath)) {
      const data = readFileSync(meetingJsonPath, 'utf8')
      meetingData = JSON.parse(data)
    } else {
      // 기본 meeting.json 구조 생성
      meetingData = {
        proposals: [],
        revisions: {},
        resultRevisions: [],
        previousDocument: null,
        resultDocument: null,
        memos: {}
      }
    }

    // 새 기고서를 meeting.json에 추가
    if (!Array.isArray(meetingData.proposals)) {
      meetingData.proposals = []
    }
    meetingData.proposals.push(newDocument)
    meetingData.updatedAt = new Date().toISOString()

    // meeting.json 저장
    writeFileSync(meetingJsonPath, JSON.stringify(meetingData, null, 2))

    return NextResponse.json({
      message: '기고서가 업로드되었습니다',
      document: newDocument
    })

  } catch (error) {
    console.error('기고서 업로드 오류:', error)
    return NextResponse.json({ error: '업로드 실패' }, { status: 500 })
  }
}