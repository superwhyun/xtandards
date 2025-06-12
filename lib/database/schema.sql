-- SQLite3 Schema for Meeting Database
-- 각 회의별로 독립적인 DB 파일 생성

-- 회의 기본 정보 테이블
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  description TEXT DEFAULT '',
  isCompleted INTEGER DEFAULT 0,
  previousDocument TEXT,  -- JSON string for backward compatibility
  resultDocument TEXT,    -- JSON string for backward compatibility
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 문서 테이블 (기고서, 수정본, 결과문서 등 모든 파일)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  meetingId TEXT NOT NULL,
  name TEXT NOT NULL,
  fileName TEXT NOT NULL,
  abstract TEXT DEFAULT '',
  type TEXT NOT NULL, -- 'proposal', 'revision', 'result', 'result-revision', 'base'
  parentId TEXT,      -- revision의 경우 원본 proposal id
  uploadDate TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'review'
  filePath TEXT NOT NULL,
  uploader TEXT DEFAULT '',
  connections TEXT DEFAULT '[]', -- JSON array for connections
  FOREIGN KEY (meetingId) REFERENCES meetings(id)
);

-- 메모 테이블
CREATE TABLE IF NOT EXISTS memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meetingId TEXT NOT NULL,
  documentId TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (meetingId) REFERENCES meetings(id),
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_documents_meeting_id ON documents(meetingId);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parentId);
CREATE INDEX IF NOT EXISTS idx_memos_document_id ON memos(documentId);
CREATE INDEX IF NOT EXISTS idx_memos_meeting_id ON memos(meetingId);

-- %%%%%LAST%%%%%