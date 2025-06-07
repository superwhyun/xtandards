import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

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

    // 파일 삭제
    await unlink(absolutePath)

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다'
    })

  } catch (error) {
    console.error('파일 삭제 오류:', error)
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// %%%%%LAST%%%%%