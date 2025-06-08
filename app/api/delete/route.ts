import { NextRequest, NextResponse } from 'next/server'
import { unlink, rmdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

async function deleteRecursively(dirPath: string): Promise<void> {
  try {
    const stats = await stat(dirPath)
    
    if (stats.isDirectory()) {
      const { readdir } = await import('fs/promises')
      const entries = await readdir(dirPath)
      
      // 모든 하위 항목 삭제
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry)
        await deleteRecursively(entryPath)
      }
      
      // 빈 디렉토리 삭제
      await rmdir(dirPath)
    } else {
      // 파일 삭제
      await unlink(dirPath)
    }
  } catch (error) {
    console.error(`삭제 실패: ${dirPath}`, error)
    throw error
  }
}

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

    // 보안: data 폴더 외부 경로 접근 금지
    if (!filePath.startsWith('data/') && !filePath.startsWith('./data/')) {
      return NextResponse.json(
        { error: '허용되지 않은 경로입니다' },
        { status: 403 }
      )
    }

    // 절대 경로 생성
    const absolutePath = path.join(process.cwd(), filePath)

    // 파일/폴더 존재 확인
    if (!existsSync(absolutePath)) {
      return NextResponse.json(
        { error: '파일 또는 폴더를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 재귀적으로 삭제 (파일 또는 폴더)
    await deleteRecursively(absolutePath)

    return NextResponse.json({
      success: true,
      message: '파일/폴더가 성공적으로 삭제되었습니다'
    })

  } catch (error) {
    console.error('삭제 오류:', error)
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// %%%%%LAST%%%%%