import { useCallback } from "react";
import { Standard, Meeting, Document } from "@/types/standard";

export function useMeetingHandlers(standard: Standard | null, setStandard: (s: Standard) => void, updateStandard: (s: Standard) => void, currentUser?: string) {
  // 회의 수정 핸들러
  const handleEditMeeting = (meeting: Meeting, setEditingMeeting: (m: Meeting) => void, setEditMeetingOpen: (b: boolean) => void) => {
    setEditingMeeting(meeting);
    setEditMeetingOpen(true);
  };

  // 회의 저장 핸들러
  const handleSaveMeeting = (meetingId: string, updatedData: { title: string; date: string; description?: string }) => {
    if (!standard) return;
    const updatedMeetings = standard.meetings.map(meeting =>
      meeting.id === meetingId
        ? { ...meeting, ...updatedData }
        : meeting
    );
    const updatedStandard = {
      ...standard,
      meetings: updatedMeetings
    };
    updateStandard(updatedStandard);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback(async (files: FileList, meetingId: string, type: string, proposalId?: string) => {
    console.log('handleFileUpload 호출됨:', { meetingId, type, proposalId })
    if (!standard || files.length === 0) return;
    const file = files[0];
    const meeting = standard.meetings.find(m => m.id === meetingId);
    console.log('meeting 찾기 결과:', { meetingId, meeting: meeting ? meeting.id : 'NOT_FOUND' })
    if (!meeting) return;

    let extractedTitle = "";
    let extractedAbstract = "";
    
    // Word 문서이고 기고서 타입인 경우 Title과 Abstract 추출 시도
    if ((type === 'proposal' || type === 'revision') && 
        (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc'))) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const mammoth = await import('mammoth')
        
        // HTML로 변환해서 표 구조 분석
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = result.value
        
        // HTML을 파싱해서 표에서 Title과 Abstract 찾기
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const tables = doc.querySelectorAll('table')
        
        for (const table of tables) {
          const rows = table.querySelectorAll('tr')
          for (const row of rows) {
            const cells = row.querySelectorAll('td, th')
            for (let i = 0; i < cells.length - 1; i++) {
              const cellText = cells[i].textContent?.trim().toLowerCase()
              if (cellText === 'title:' || cellText === 'title') {
                extractedTitle = cells[i + 1].textContent?.trim() || ""
              } else if (cellText === 'abstract:' || cellText === 'abstract') {
                extractedAbstract = cells[i + 1].textContent?.trim() || ""
              }
              if (extractedTitle && extractedAbstract) break
            }
            if (extractedTitle && extractedAbstract) break
          }
          if (extractedTitle && extractedAbstract) break
        }
      } catch (error) {
        console.warn('Title/Abstract 추출 실패:', file.name, error)
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('acronym', standard.acronym);
    formData.append('meetingId', meetingId);
    formData.append('type', type);
    if (extractedTitle) {
      formData.append('extractedTitle', extractedTitle);
    }
    if (extractedAbstract) {
      formData.append('extractedAbstract', extractedAbstract);
    }
    if (proposalId) {
      formData.append('proposalId', proposalId);
    }

    try {
      console.log('API 호출: POST /api/upload')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        alert(`업로드 실패: ${result.error}`);
        return;
      }
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: result.originalName, // 추출된 제목이 들어옴
        fileName: result.fileName, // 원본 파일명
        type: type as any,
        uploadDate: new Date().toISOString(),
        connections: [],
        status: 'pending',
        filePath: result.filePath,
        uploader: currentUser
      };
      
      // 로컬 상태만 업데이트 (서버는 upload API에서 처리됨)
      const updatedStandard = { ...standard };
      const meetingIndex = updatedStandard.meetings.findIndex(m => m.id === meetingId);
      if (meetingIndex !== -1) {
        const meeting = updatedStandard.meetings[meetingIndex];
        switch (type) {
          case 'base':
            meeting.previousDocument = newDocument;
            break;
          case 'proposal':
            meeting.proposals.push(newDocument);
            break;
          case 'revision':
            if (proposalId) {
              if (!meeting.revisions[proposalId]) {
                meeting.revisions[proposalId] = [];
              }
              meeting.revisions[proposalId].push(newDocument);
            }
            break;
          case 'result':
            meeting.resultDocument = newDocument;
            break;
          case 'result-revision':
            meeting.resultRevisions.push(newDocument);
            break;
        }
        setStandard(updatedStandard);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다');
    }
  }, [standard, updateStandard]);

  return {
    handleEditMeeting,
    handleSaveMeeting,
    handleFileUpload
  };
}