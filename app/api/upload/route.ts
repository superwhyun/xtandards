import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const STANDARDS_FILE = path.join(process.cwd(), 'data', 'standards.json')

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
    const proposalId = formData.get('proposalId') as string | null
    const extractedTitle = formData.get('extractedTitle') as string | null

    if (!file || !acronym || !meetingId || !type) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // meetingId로 회의 타이틀 찾기
    if (!existsSync(STANDARDS_FILE)) {
      return NextResponse.json(
        { error: '표준문서 데이터를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const data = readFileSync(STANDARDS_FILE, 'utf8')
    const standards = JSON.parse(data)
    const standard = standards.standards.find((s: any) => s.acronym === acronym)
    
    if (!standard) {
      return NextResponse.json(
        { error: '표준문서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const meeting = standard.meetings.find((m: any) => m.id === meetingId)
    if (!meeting) {
      return NextResponse.json(
        { error: '회의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const meetingTitle = meeting.title
    const safeMeetingId = sanitizeForPath(meetingId)

    // 파일 확장자 검증
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
    const fileExtension = path.extname(file.name).toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 저장 디렉토리 생성 (타이틀 기반)
    const timestamp = Date.now() // timestamp 변수 추가
    let uploadDir: string;
    let fileName: string;
    
    if (type === 'result' || type === 'result-revision') {
      // Output Document는 OD 폴더에
      uploadDir = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'OD')
      fileName = type === 'result' ? `output_${timestamp}_${file.name}` : `output_rev_${timestamp}_${file.name}`
    } else if (type === 'base') {
      // Base Document는 루트에 (실제로는 저장하지 않지만 호환성을 위해)
      uploadDir = path.join(process.cwd(), 'data', acronym, safeMeetingId)
      fileName = `base_${timestamp}_${file.name}`
    } else {
      // 기고서와 수정본은 C 폴더에
      uploadDir = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'C')
      fileName = type === 'proposal' ? `${timestamp}_${file.name}` : `${type}_${timestamp}_${file.name}`
    }
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    const filePath = path.join(uploadDir, fileName)

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

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

    // 상대 경로 생성 (다운로드용)
    const folderName = (type === 'result' || type === 'result-revision') ? 'OD' : (type === 'base' ? '' : 'C')
    const relativePath = folderName ? path.join('data', acronym, safeMeetingId, folderName, fileName) : path.join('data', acronym, safeMeetingId, fileName)

    // 새 문서 정보 추가
    const newDocument = {
      id: `doc-${Date.now()}`,
      name: extractedTitle && extractedTitle.trim() ? extractedTitle.trim() : file.name, // 추출된 제목 우선 사용
      fileName: file.name, // 원본 파일명 별도 저장
      type: type,
      uploadDate: new Date().toISOString(),
      connections: [],
      status: 'pending',
      filePath: relativePath
    }

    // 타입별로 적절한 위치에 추가
    switch (type) {
      case 'base':
        meetingData.previousDocument = newDocument
        break
      case 'proposal':
        meetingData.proposals.push(newDocument)
        break
      case 'revision':
        if (proposalId) {
          if (!meetingData.revisions[proposalId]) {
            meetingData.revisions[proposalId] = []
          }
          meetingData.revisions[proposalId].push(newDocument)
        }
        break
      case 'result':
        meetingData.resultDocument = newDocument
        break
      case 'result-revision':
        meetingData.resultRevisions.push(newDocument)
        break
    }

    meetingData.updatedAt = new Date().toISOString()

    // meeting.json 저장
    await writeFile(meetingJsonPath, JSON.stringify(meetingData, null, 2))

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: file.name,
      originalName: extractedTitle && extractedTitle.trim() ? extractedTitle.trim() : file.name, // 추출된 제목 우선 반환
      extractedTitle: extractedTitle || '',
      size: file.size,
      type: fileExtension
    })

  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}