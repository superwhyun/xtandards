export interface Document {
  id: string
  name: string
  fileName?: string // 원본 파일명 (추출된 제목과 구분)
  abstract?: string // 추출된 Abstract
  type: "previous" | "proposal" | "revision" | "result"
  uploadDate: string
  connections: string[]
  status?: "accepted" | "review" | "rejected" | "withdrawn" | "pending"
  filePath?: string
  uploader?: string
}

export interface Meeting {
  id: string
  date: string
  title: string
  description?: string
  previousDocument?: Document
  proposals: Document[]
  revisions: { [proposalId: string]: Document[] }
  resultDocument?: Document
  resultRevisions: Document[]
  isCompleted: boolean
  memos: { [proposalId: string]: string } // 기고서별 메모 추가
}
export interface Standard {
  acronym: string
  title: string
  meetings: Meeting[]
}