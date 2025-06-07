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

interface Document {
  id: string
  name: string
  type: "previous" | "proposal" | "revision" | "result"
  uploadDate: string
  filePath: string
  status?: "accepted" | "review" | "rejected" | "pending"
}

interface StandardData {
  acronym: string
  title: string
  meetings: Meeting[]
  documents: { [meetingId: string]: Document[] }
}

// 특정 표준문서 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { acronym: string } }
) {
  try {
    const { acronym } = params
    const standardDir = path.join(process.cwd(), 'data', acronym)
    const meetingsFile = path.join(standardDir, 'meetings.json')
    const documentsFile = path.join(standardDir, 'documents.json')

    // 표준문서 디렉토리가 없으면 생성
    if (!existsSync(standardDir)) {
      await mkdir(standardDir, { recursive: true })
      
      // 기본 파일들 생성
      const emptyMeetings: Meeting[] = []
      const emptyDocuments = {}
      
      await writeFile(meetingsFile, JSON.stringify(emptyMeetings, null, 2))
      await writeFile(documentsFile, JSON.stringify(emptyDocuments, null, 2))
      
      return NextResponse.json({
        acronym,
        title: `${acronym} 표준문서`,
        meetings: [],
        documents: {}
      })
    }

    // 회의 데이터 로드
    let meetings: Meeting[] = []
    if (existsSync(meetingsFile)) {
      const meetingsData = await readFile(meetingsFile, 'utf8')
      meetings = JSON.parse(meetingsData)
    }

    // 문서 데이터 로드
    let documents = {}
    if (existsSync(documentsFile)) {
      const documentsData = await readFile(documentsFile, 'utf8')
      documents = JSON.parse(documentsData)
    }

    return NextResponse.json({
      acronym,
      title: `${acronym} 표준문서`,
      meetings,
      documents
    })

  } catch (error) {
    console.error('표준문서 조회 오류:', error)
    return NextResponse.json(
      { error: '표준문서 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}