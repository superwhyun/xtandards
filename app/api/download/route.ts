import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const fileName = searchParams.get('name')

    if (!filePath) {
      return NextResponse.json(
        { error: '파일 경로가 필요합니다' },
        { status: 400 }
      )
    }

    // 절대 경로 생성
    const absolutePath = path.join(process.cwd(), filePath)

    // 파일 존재 확인
    if (!existsSync(absolutePath)) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 파일 읽기
    const fileBuffer = await readFile(absolutePath)
    
    // MIME 타입 결정
    const ext = path.extname(absolutePath).toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    }
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream'
    const downloadFileName = fileName || path.basename(absolutePath)

    // 응답 헤더 설정
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Content-Disposition', `attachment; filename="${downloadFileName}"`)
    
    return response

  } catch (error) {
    console.error('파일 다운로드 오류:', error)
    return NextResponse.json(
      { error: '파일 다운로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}