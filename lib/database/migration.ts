import fs from 'fs'
import path from 'path'
import { MeetingDb } from './operations'

// meeting.json을 SQLite DB로 마이그레이션하는 함수
export function migrateMeetingJsonToDb(acronym: string, meetingId: string): boolean {
  try {
    // 기존 meeting.json 파일 경로
    const safeMeetingId = meetingId.replace(/[\/\\:*?"<>|]/g, '_')
    const jsonPath = path.join(process.cwd(), 'data', acronym, safeMeetingId, 'meeting.json')
    
    if (!fs.existsSync(jsonPath)) {
      console.log(`No meeting.json found for ${acronym}/${meetingId}`)
      return false
    }
    
    // meeting.json 읽기
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    
    // DB 연결
    const db = new MeetingDb(acronym, meetingId)
    
    // 1. 회의 기본 정보 저장
    const meeting = {
      id: jsonData.id,
      title: jsonData.title,
      startDate: jsonData.startDate,
      endDate: jsonData.endDate,
      description: jsonData.description || '',
      isCompleted: Boolean(jsonData.isCompleted),
      previousDocument: jsonData.previousDocument,
      resultDocument: jsonData.resultDocument,
      createdAt: jsonData.createdAt,
      updatedAt: jsonData.updatedAt
    }
    
    db.saveMeeting(meeting)
    
    // 2. 기고서들 저장
    if (jsonData.proposals && Array.isArray(jsonData.proposals)) {
      jsonData.proposals.forEach((proposal: any) => {
        const doc = {
          id: proposal.id,
          meetingId: jsonData.id,
          name: proposal.name,
          fileName: proposal.fileName || proposal.name, // fileName이 없으면 name 사용
          abstract: proposal.abstract || '',
          type: 'proposal' as const,
          parentId: undefined,
          uploadDate: proposal.uploadDate,
          status: proposal.status || 'pending',
          filePath: proposal.filePath,
          uploader: proposal.uploader || '',
          connections: proposal.connections || []
        }
        
        db.addDocument(doc)
      })
    }
    
    // 3. 수정본들 저장
    if (jsonData.revisions && typeof jsonData.revisions === 'object') {
      Object.keys(jsonData.revisions).forEach(proposalId => {
        const revisions = jsonData.revisions[proposalId]
        if (Array.isArray(revisions)) {
          revisions.forEach((revision: any) => {
            const doc = {
              id: revision.id,
              meetingId: jsonData.id,
              name: revision.name,
              fileName: revision.fileName || revision.name, // fileName이 없으면 name 사용
              abstract: revision.abstract || '',
              type: 'revision' as const,
              parentId: proposalId,
              uploadDate: revision.uploadDate,
              status: revision.status || 'pending',
              filePath: revision.filePath,
              uploader: revision.uploader || '',
              connections: revision.connections || []
            }
            
            db.addDocument(doc)
          })
        }
      })
    }
    
    // 4. 결과문서 수정본들 저장
    if (jsonData.resultRevisions && Array.isArray(jsonData.resultRevisions)) {
      jsonData.resultRevisions.forEach((resultRev: any) => {
        const doc = {
          id: resultRev.id,
          meetingId: jsonData.id,
          name: resultRev.name,
          fileName: resultRev.fileName || resultRev.name, // fileName이 없으면 name 사용
          abstract: resultRev.abstract || '',
          type: 'result-revision' as const,
          parentId: undefined,
          uploadDate: resultRev.uploadDate,
          status: resultRev.status || 'pending',
          filePath: resultRev.filePath,
          uploader: resultRev.uploader || '',
          connections: resultRev.connections || []
        }
        
        db.addDocument(doc)
      })
    }
    
    // 5. 메모들 저장
    if (jsonData.memos && typeof jsonData.memos === 'object') {
      Object.keys(jsonData.memos).forEach(documentId => {
        const memoText = jsonData.memos[documentId]
        if (memoText && memoText.trim()) {
          const memo = {
            meetingId: jsonData.id,
            documentId: documentId,
            memo: memoText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          db.saveMemo(memo)
        }
      })
    }
    
    // DB 연결 종료
    db.close()
    
    console.log(`Successfully migrated ${acronym}/${meetingId} from JSON to SQLite`)
    return true
    
  } catch (error) {
    console.error(`Migration failed for ${acronym}/${meetingId}:`, error)
    return false
  }
}

// 전체 데이터를 마이그레이션하는 함수
export function migrateAllMeetings(): void {
  const dataDir = path.join(process.cwd(), 'data')
  
  if (!fs.existsSync(dataDir)) {
    console.log('No data directory found')
    return
  }
  
  let totalMigrated = 0
  let totalFailed = 0
  
  // 모든 표준문서 폴더 순회
  const standardDirs = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name)
  
  for (const acronym of standardDirs) {
    const standardDir = path.join(dataDir, acronym)
    
    // 각 표준문서의 미팅 폴더들 순회
    if (fs.existsSync(standardDir)) {
      const meetingDirs = fs.readdirSync(standardDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
      
      for (const meetingId of meetingDirs) {
        const success = migrateMeetingJsonToDb(acronym, meetingId)
        if (success) {
          totalMigrated++
        } else {
          totalFailed++
        }
      }
    }
  }
  
  console.log(`Migration completed: ${totalMigrated} succeeded, ${totalFailed} failed`)
}

// %%%%%LAST%%%%%