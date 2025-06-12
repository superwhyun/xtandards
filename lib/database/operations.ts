import Database from 'better-sqlite3'
import { getOrCreateDatabase } from './connection'

// Meeting 관련 타입 정의
export interface Meeting {
  id: string
  title: string
  startDate: string
  endDate: string
  description?: string
  isCompleted: boolean
  previousDocument?: any
  resultDocument?: any
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  meetingId: string
  name: string
  fileName: string
  abstract?: string
  type: 'proposal' | 'revision' | 'result' | 'result-revision' | 'base'
  parentId?: string
  uploadDate: string
  status: 'pending' | 'accepted' | 'rejected' | 'review'
  filePath: string
  uploader?: string
  connections: string[]
}

export interface Memo {
  id?: number
  meetingId: string
  documentId: string
  memo: string
  createdAt: string
  updatedAt: string
}

// Meeting CRUD 작업
export class MeetingDb {
  private db: Database.Database
  
  constructor(acronym: string, meetingId: string) {
    this.db = getOrCreateDatabase(acronym, meetingId)
  }

  // 회의 생성 또는 업데이트
  saveMeeting(meeting: Meeting): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO meetings 
      (id, title, startDate, endDate, description, isCompleted, previousDocument, resultDocument, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      meeting.id,
      meeting.title,
      meeting.startDate,
      meeting.endDate,
      meeting.description || '',
      meeting.isCompleted ? 1 : 0,
      meeting.previousDocument ? JSON.stringify(meeting.previousDocument) : null,
      meeting.resultDocument ? JSON.stringify(meeting.resultDocument) : null,
      meeting.createdAt,
      meeting.updatedAt
    )
  }

  // 회의 조회
  getMeeting(meetingId: string): Meeting | null {
    const stmt = this.db.prepare(`
      SELECT * FROM meetings WHERE id = ?
    `)
    
    const row = stmt.get(meetingId) as any
    if (!row) return null
    
    return {
      id: row.id,
      title: row.title,
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description,
      isCompleted: Boolean(row.isCompleted),
      previousDocument: row.previousDocument ? JSON.parse(row.previousDocument) : null,
      resultDocument: row.resultDocument ? JSON.parse(row.resultDocument) : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }

  // 회의 완료 상태 업데이트
  updateMeetingCompletion(meetingId: string, isCompleted: boolean): void {
    const stmt = this.db.prepare(`
      UPDATE meetings SET isCompleted = ?, updatedAt = ? WHERE id = ?
    `)
    
    stmt.run(isCompleted ? 1 : 0, new Date().toISOString(), meetingId)
  }

  // 문서 추가
  addDocument(document: Document): void {
    const stmt = this.db.prepare(`
      INSERT INTO documents 
      (id, meetingId, name, fileName, abstract, type, parentId, uploadDate, status, filePath, uploader, connections)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      document.id,
      document.meetingId,
      document.name,
      document.fileName,
      document.abstract || '',
      document.type,
      document.parentId || null,
      document.uploadDate,
      document.status,
      document.filePath,
      document.uploader || '',
      JSON.stringify(document.connections || [])
    )
  }

  // 문서 상태 업데이트
  updateDocumentStatus(documentId: string, status: string): void {
    const stmt = this.db.prepare(`
      UPDATE documents SET status = ? WHERE id = ?
    `)
    
    stmt.run(status, documentId)
  }

  // 문서 삭제
  deleteDocument(documentId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM documents WHERE id = ?
    `)
    
    stmt.run(documentId)
  }

  // 특정 타입의 문서들 조회
  getDocumentsByType(meetingId: string, type: string): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE meetingId = ? AND type = ? ORDER BY uploadDate ASC
    `)
    
    const rows = stmt.all(meetingId, type) as any[]
    return rows.map(this.rowToDocument)
  }

  // 특정 부모의 revision들 조회
  getRevisions(parentId: string): Document[] {
    const stmt = this.db.prepare(`
      SELECT * FROM documents WHERE parentId = ? AND type = 'revision' ORDER BY uploadDate ASC
    `)
    
    const rows = stmt.all(parentId) as any[]
    return rows.map(this.rowToDocument)
  }

  // 모든 문서 조회 (타입별로 그룹화)
  getAllDocuments(meetingId: string): {
    proposals: Document[]
    revisions: { [key: string]: Document[] }
    resultDocument: Document | null
    resultRevisions: Document[]
    previousDocument: Document | null
  } {
    const proposals = this.getDocumentsByType(meetingId, 'proposal')
    const resultRevisions = this.getDocumentsByType(meetingId, 'result-revision')
    
    // resultDocument 조회
    const resultStmt = this.db.prepare(`
      SELECT * FROM documents WHERE meetingId = ? AND type = 'result' LIMIT 1
    `)
    const resultRow = resultStmt.get(meetingId) as any
    const resultDocument = resultRow ? this.rowToDocument(resultRow) : null
    
    // previousDocument 조회  
    const prevStmt = this.db.prepare(`
      SELECT * FROM documents WHERE meetingId = ? AND type = 'base' LIMIT 1
    `)
    const prevRow = prevStmt.get(meetingId) as any
    const previousDocument = prevRow ? this.rowToDocument(prevRow) : null
    
    // revisions 그룹화
    const revisions: { [key: string]: Document[] } = {}
    proposals.forEach(proposal => {
      revisions[proposal.id] = this.getRevisions(proposal.id)
    })
    
    return {
      proposals,
      revisions,
      resultDocument,
      resultRevisions,
      previousDocument
    }
  }

  // row를 Document 객체로 변환하는 헬퍼 함수
  private rowToDocument(row: any): Document {
    return {
      id: row.id,
      meetingId: row.meetingId,
      name: row.name,
      fileName: row.fileName,
      abstract: row.abstract,
      type: row.type,
      parentId: row.parentId,
      uploadDate: row.uploadDate,
      status: row.status,
      filePath: row.filePath,
      uploader: row.uploader,
      connections: JSON.parse(row.connections || '[]')
    }
  }

  // 메모 저장 (UPSERT 방식으로 변경)
  saveMemo(memo: Memo): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memos 
      (meetingId, documentId, memo, createdAt, updatedAt)
      VALUES (?, ?, ?, 
        COALESCE((SELECT createdAt FROM memos WHERE meetingId = ? AND documentId = ?), ?),
        ?
      )
    `)
    
    stmt.run(
      memo.meetingId,
      memo.documentId,
      memo.memo,
      memo.meetingId,
      memo.documentId,
      memo.createdAt,
      memo.updatedAt
    )
  }

  // 메모 조회 (모든 메모를 객체 형태로)
  getAllMemos(meetingId: string): { [documentId: string]: string } {
    const stmt = this.db.prepare(`
      SELECT documentId, memo FROM memos WHERE meetingId = ?
    `)
    
    const rows = stmt.all(meetingId) as any[]
    const memos: { [documentId: string]: string } = {}
    
    rows.forEach(row => {
      memos[row.documentId] = row.memo
    })
    
    return memos
  }

  // 메모 삭제
  deleteMemo(documentId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM memos WHERE documentId = ?
    `)
    
    stmt.run(documentId)
  }

  // 모든 회의 조회
  getAllMeetings(): Meeting[] {
    const stmt = this.db.prepare(`
      SELECT * FROM meetings ORDER BY createdAt ASC
    `)
    
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description,
      isCompleted: Boolean(row.isCompleted),
      previousDocument: row.previousDocument ? JSON.parse(row.previousDocument) : null,
      resultDocument: row.resultDocument ? JSON.parse(row.resultDocument) : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))
  }

  // DB 연결 종료
  close(): void {
    this.db.close()
  }
}

// %%%%%LAST%%%%%