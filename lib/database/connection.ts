import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

// 파일 경로에서 안전하지 않은 문자들을 교체하는 함수
function sanitizeForPath(str: string): string {
  return str.replace(/[\/\\:*?"<>|]/g, '_')
}

// DB 파일 경로 생성
export function getDbPath(acronym: string, meetingId: string): string {
  const dbDir = path.join(process.cwd(), 'data', acronym, meetingId)
  
  // 디렉토리가 없으면 생성
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  
  return path.join(dbDir, 'meeting.db')
}

// DB 연결 생성 및 스키마 초기화
export function createDatabase(acronym: string, meetingId: string): Database.Database {
  const dbPath = getDbPath(acronym, meetingId)
  const db = new Database(dbPath)
  
  // 스키마 파일 읽기 및 실행
  const schemaPath = path.join(process.cwd(), 'lib', 'database', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  // 스키마 실행 (여러 SQL 문을 분리해서 실행)
  const statements = schema.split(';').filter(stmt => stmt.trim())
  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement + ';')
    }
  }
  
  return db
}

// DB 연결 가져오기 (기존 DB 열기)
export function getDatabase(acronym: string, meetingId: string): Database.Database | null {
  const dbPath = getDbPath(acronym, meetingId)
  
  if (!fs.existsSync(dbPath)) {
    return null
  }
  
  return new Database(dbPath)
}

// DB 연결 가져오기 또는 생성
export function getOrCreateDatabase(acronym: string, meetingId: string): Database.Database {
  const existingDb = getDatabase(acronym, meetingId)
  if (existingDb) {
    return existingDb
  }
  
  return createDatabase(acronym, meetingId)
}

// %%%%%LAST%%%%%