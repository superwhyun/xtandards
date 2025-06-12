import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { MeetingDb } from '@/lib/database/operations'

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
    const extractedAbstract = formData.get('extractedAbstract') as string | null

    console.log('업로드 파라미터 확인:', { acronym, meetingId, type, proposalId })

    if (!file || !acronym || !meetingId || !type) {
      console.log('필수 파라미터 누락:', { file: !!file, acronym, meetingId, type })
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    console.log('파라미터 검증 통과')

    const safeMeetingId = meetingId

    // 파일 확장자 검증
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
    const fileExtension = path.extname(file.name).toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      console.log('지원하지 않는 파일 형식:', fileExtension)
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }

    console.log('파일 확장자 검증 통과:', fileExtension)

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('파일 크기 초과:', file.size)
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    console.log('파일 크기 검증 통과:', file.size)

    // 저장 디렉토리 생성 (타이틀 기반)
    const timestamp = Date.now() // timestamp 변수 추가
    let uploadDir: string;
    let fileName: string;
    
    if (type === 'result' || type === 'result-revision') {
      // Output Document는 OD 폴더에
      uploadDir = path.join(process.cwd(), 'data', acronym, meetingId, 'OD')
      fileName = type === 'result' ? `output_${timestamp}_${file.name}` : `output_rev_${timestamp}_${file.name}`
    } else if (type === 'base') {
      // Base Document는 루트에 (실제로는 저장하지 않지만 호환성을 위해)
      uploadDir = path.join(process.cwd(), 'data', acronym, meetingId)
      fileName = `base_${timestamp}_${file.name}`
    } else {
      // 기고서와 수정본은 C 폴더에
      uploadDir = path.join(process.cwd(), 'data', acronym, meetingId, 'C')
      fileName = type === 'proposal' ? `${timestamp}_${file.name}` : `${type}_${timestamp}_${file.name}`
    }
    
    console.log('업로드 디렉토리 생성:', uploadDir)
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
      console.log('디렉토리 생성 완료:', uploadDir)
    }
    const filePath = path.join(uploadDir, fileName)
    console.log('파일 저장 경로:', filePath)

    // 파일 저장
    console.log('파일 저장 시작...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log('파일 저장 완료')

    // SQLite DB 업데이트
    console.log('MeetingDb 초기화 시도:', { acronym, meetingId })
    const db = new MeetingDb(acronym, meetingId)
    
    // 상대 경로 생성 (다운로드용)
    const folderName = (type === 'result' || type === 'result-revision') ? 'OD' : (type === 'base' ? '' : 'C')
    const relativePath = folderName ? path.join('data', acronym, meetingId, folderName, fileName) : path.join('data', acronym, meetingId, fileName)

    // 새 문서 정보 추가
    const newDocument = {
      id: `doc-${Date.now()}`,
      meetingId: meetingId,
      name: extractedTitle && extractedTitle.trim() ? extractedTitle.trim() : file.name,
      fileName: file.name,
      abstract: extractedAbstract && extractedAbstract.trim() ? extractedAbstract.trim() : '',
      type: type as any,
      parentId: proposalId || undefined,
      uploadDate: new Date().toISOString(),
      status: 'pending' as const,
      filePath: relativePath,
      uploader: '',
      connections: []
    }

    // 문서 추가
    db.addDocument(newDocument)
    db.close()

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
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}