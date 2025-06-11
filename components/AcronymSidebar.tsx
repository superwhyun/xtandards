import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Settings, LogOut, CheckCircle, Edit, Trash2, Calendar } from "lucide-react";
import NewMeetingDialog from "@/components/NewMeetingDialog";
import { cn } from "@/lib/utils";
import type { UserRole, AuthState } from "@/components/auth/LoginScreen";
import type { Standard } from "@/types/standard";

interface AcronymSidebarProps {
  standard: Standard;
  auth: AuthState;
  activeMeetingId: string;
  setActiveMeetingId: (id: string) => void;
  handleEditMeeting: any;
  setEditingMeeting: any;
  setEditMeetingOpen: any;
  handleDeleteMeeting: any;
  handleCreateMeeting: any;
  setSettingsOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const AcronymSidebar = ({
  standard,
  auth,
  activeMeetingId,
  setActiveMeetingId,
  handleEditMeeting,
  setEditingMeeting,
  setEditMeetingOpen,
  handleDeleteMeeting,
  handleCreateMeeting,
  setSettingsOpen,
  handleLogout,
}: AcronymSidebarProps) => {
  return (
    <div className="bg-white border-b lg:border-r lg:border-b-0 border-gray-200 lg:w-64 lg:min-h-screen">
      <div className="p-2 lg:p-4">
        {/* 홈으로 버튼 */}
        <div className="flex lg:flex-col gap-2 mb-2 lg:mb-4 overflow-x-auto lg:overflow-x-visible">
          <Link href="/" className="block flex-shrink-0">
            <Button variant="outline" size="sm" className="lg:w-full flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline">홈으로</span>
            </Button>
          </Link>
          <div className="flex gap-2 flex-shrink-0">
            <div className="flex gap-2">
              {auth.role === 'chair' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="lg:flex-1 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden lg:inline">설정</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="lg:flex-1 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 데스크톱 헤더 */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {standard.acronym}
          </h1>
          <p className="text-gray-600 text-sm mt-1">{standard.title}</p>
          <div className="text-xs text-gray-600 mt-2">
            <span className={`font-medium ${auth.role === 'chair' ? 'text-blue-600' : 'text-green-600'}`}>
              {auth.role === 'chair' ? 'Chair' : 'Contributor'}
            </span>
            로 로그인됨
          </div>
        </div>

        {/* 회의 목록 */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <h3 className="font-semibold text-gray-800 mb-2 hidden lg:block flex-shrink-0">회의 목록</h3>
          {/* 회의 탭들 */}
          <div className="flex lg:flex-col gap-2 lg:space-y-2 lg:space-x-0 space-x-2 space-y-0 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-screen">
            {standard.meetings.map((meeting) => (
              <div key={meeting.id} className="relative group flex-shrink-0 lg:flex-shrink">
                <button
                  onClick={() => setActiveMeetingId(meeting.id)}
                  className={cn(
                    "text-left p-3 rounded-lg transition-all duration-200 lg:w-full whitespace-nowrap lg:whitespace-normal",
                    activeMeetingId === meeting.id
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{meeting.title}</p>
                      <p className={cn(
                        "text-xs truncate",
                        activeMeetingId === meeting.id ? "text-blue-100" : "text-gray-500"
                      )}>
                        {meeting.startDate && meeting.endDate ? (
                          meeting.startDate === meeting.endDate ?
                            new Date(meeting.startDate).toLocaleDateString("ko-KR") :
                            `${new Date(meeting.startDate).toLocaleDateString("ko-KR")} ~ ${new Date(meeting.endDate).toLocaleDateString("ko-KR")}`
                        ) : (
                          meeting.date ? new Date(meeting.date).toLocaleDateString("ko-KR") : "날짜 없음"
                        )}
                      </p>
                    </div>
                    {meeting.isCompleted && (
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
                {/* 회의 수정/삭제 버튼 - Chair만 접근 가능 */}
                {auth.role === 'chair' && !meeting.isCompleted && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMeeting(meeting, setEditingMeeting, setEditMeetingOpen);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 text-xs"
                      title="회의 수정"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeeting(meeting.id);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                      title="회의 삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {auth.role === 'chair' && (
              <div className="flex-shrink-0 lg:flex-shrink">
                <NewMeetingDialog onCreateMeeting={handleCreateMeeting} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcronymSidebar;