export interface Document {
  id: string
  name: string
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