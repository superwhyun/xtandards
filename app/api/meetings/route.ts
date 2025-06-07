import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Meeting {
  id: string
  date: string
  title: string
  description?: string
  isCompleted: boolean
  createdAt: string
}

// 회의 생성
export async function POST(request: NextRequest) {
  try {
    const { acronym, date, title, description } = await request.json()

    if (!acronym || !date || !title) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const standardDir = path.join(process.cwd(), 'data', acronym)
    const meetingsFile = path.join(standardDir, 'meetings.json')

    // 디렉토리 생성
    if (!existsSync(standardDir)) {
      await mkdir(standardDir, { recursive: true })
    }

    // 기존 회의 목록 로드
    let meetings: Meeting[] = []
    if (existsSync(meetingsFile)) {
      const data = await readFile(meetingsFile, 'utf8')
      meetings = JSON.parse(data)
    }

    // 새 회의 생성
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      date,
      title,
      description,
      isCompleted: false,
      createdAt: new Date().toISOString()
    }

    meetings.push(newMeeting)

    // 파일 저장
    await writeFile(meetingsFile, JSON.stringify(meetings, null, 2))

    return NextResponse.json({
      success: true,
      meeting: newMeeting
    })

  } catch (error) {
    console.error('회의 생성 오류:', error)
    return NextResponse.json(
      { error: '회의 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 회의 업데이트 (완료 상태 등)
export async function PUT(request: NextRequest) {
  try {
    const { acronym, meetingId, isCompleted } = await request.json()

    if (!acronym || !meetingId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const meetingsFile = path.join(process.cwd(), 'data', acronym, 'meetings.json')

    if (!existsSync(meetingsFile)) {
      return NextResponse.json(
        { error: '회의 파일을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 회의 목록 로드
    const data = await readFile(meetingsFile, 'utf8')
    let meetings: Meeting[] = JSON.parse(data)

    // 해당 회의 찾기 및 업데이트
    const meetingIndex = meetings.findIndex(m => m.id === meetingId)
    if (meetingIndex === -1) {
      return NextResponse.json(
        { error: '회의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (isCompleted !== undefined) {
      meetings[meetingIndex].isCompleted = isCompleted
    }

    // 파일 저장
    await writeFile(meetingsFile, JSON.stringify(meetings, null, 2))

    return NextResponse.json({
      success: true,
      meeting: meetings[meetingIndex]
    })

  } catch (error) {
    console.error('회의 업데이트 오류:', error)
    return NextResponse.json(
      { error: '회의 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 회의 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acronym = searchParams.get('acronym')
    const meetingId = searchParams.get('meetingId')

    if (!acronym || !meetingId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    const meetingsFile = path.join(process.cwd(), 'data', acronym, 'meetings.json')

    if (!existsSync(meetingsFile)) {
      return NextResponse.json(
        { error: '회의 파일을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 회의 목록 로드
    const data = await readFile(meetingsFile, 'utf8')
    let meetings: Meeting[] = JSON.parse(data)

    // 해당 회의 제거
    meetings = meetings.filter(m => m.id !== meetingId)

    // 파일 저장
    await writeFile(meetingsFile, JSON.stringify(meetings, null, 2))

    return NextResponse.json({
      success: true,
      message: '회의가 삭제되었습니다'
    })

  } catch (error) {
    console.error('회의 삭제 오류:', error)
    return NextResponse.json(
      { error: '회의 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}