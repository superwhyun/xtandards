import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const acronym = formData.get('acronym') as string
    const meetingDate = formData.get('meetingDate') as string  // meetingId 대신 meetingDate 사용
    const type = formData.get('type') as string
    const proposalId = formData.get('proposalId') as string | null

    if (!file || !acronym || !meetingDate || !type) {
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

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 저장 디렉토리 생성 (날짜 기반)
    const timestamp = Date.now() // timestamp 변수 추가
    let uploadDir: string;
    let fileName: string;
    
    if (type === 'result' || type === 'result-revision') {
      // Output Document는 OD 폴더에
      uploadDir = path.join(process.cwd(), 'data', acronym, meetingDate, 'OD')
      fileName = type === 'result' ? `output_${timestamp}_${file.name}` : `output_rev_${timestamp}_${file.name}`
    } else if (type === 'base') {
      // Base Document는 루트에 (실제로는 저장하지 않지만 호환성을 위해)
      uploadDir = path.join(process.cwd(), 'data', acronym, meetingDate)
      fileName = `base_${timestamp}_${file.name}`
    } else {
      // 기고서와 수정본은 C 폴더에
      uploadDir = path.join(process.cwd(), 'data', acronym, meetingDate, 'C')
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

    // 상대 경로 반환 (다운로드용)
    const folderName = (type === 'result' || type === 'result-revision') ? 'OD' : (type === 'base' ? '' : 'C')
    const relativePath = folderName ? path.join('data', acronym, meetingDate, folderName, fileName) : path.join('data', acronym, meetingDate, fileName)

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: file.name,
      originalName: file.name,
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