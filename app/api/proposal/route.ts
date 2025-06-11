import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const acronym = formData.get('acronym') as string
    const meetingId = formData.get('meetingId') as string
    const type = formData.get('type') as string

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

    // 업로드 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'data', acronym, meetingId)
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

    // standards.json 업데이트
    if (!existsSync(STANDARDS_FILE)) {
      return NextResponse.json({ error: '표준문서 데이터를 찾을 수 없습니다' }, { status: 404 })
    }

    const data = readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)

    // 해당 표준문서 찾기
    const standardIndex = standards.standards.findIndex((s: any) => s.acronym === acronym)
    if (standardIndex === -1) {
      return NextResponse.json({ error: '표준문서를 찾을 수 없습니다' }, { status: 404 })
    }

    const standard = standards.standards[standardIndex]

    // 해당 회의 찾기
    const meetingIndex = standard.meetings.findIndex((m: any) => m.id === meetingId)
    if (meetingIndex === -1) {
      return NextResponse.json({ error: '회의를 찾을 수 없습니다' }, { status: 404 })
    }

    const meeting = standard.meetings[meetingIndex]

    // 새 기고서 문서 생성
    const newDocument = {
      id: `doc-${timestamp}`,
      name: file.name,
      type: "proposal",
      uploadDate: new Date().toISOString(),
      connections: [],
      status: 'pending',
      filePath: path.relative(process.cwd(), filePath),
      uploader: 'user' // TODO: 실제 사용자 정보 사용
    }

    // 회의에 기고서 추가
    if (!Array.isArray(meeting.proposals)) {
      meeting.proposals = []
    }
    meeting.proposals.push(newDocument)
    meeting.updatedAt = new Date().toISOString()

    // 표준문서 업데이트
    standard.meetings[meetingIndex] = meeting
    standard.updatedAt = new Date().toISOString()
    standards.standards[standardIndex] = standard

    // 파일에 저장
    writeFileSync(STANDARDS_FILE, JSON.stringify(standards, null, 2))

    return NextResponse.json({
      message: '기고서가 업로드되었습니다',
      document: newDocument
    })

  } catch (error) {
    console.error('기고서 업로드 오류:', error)
    return NextResponse.json({ error: '업로드 실패' }, { status: 500 })
  }
}