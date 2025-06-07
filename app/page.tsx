"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Calendar, Users, Plus, Settings, LogOut } from "lucide-react"
import LoginScreen, { UserRole, AuthState } from "@/components/auth/LoginScreen"
import SettingsDialog from "@/components/auth/SettingsDialog"

interface Standard {
  acronym: string
  title: string
  meetings: number
  lastUpdate: string
}

const getStoredStandards = (): Standard[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('standards')
  if (!stored) return []
  
  try {
    const parsedStandards = JSON.parse(stored)
    // meetings가 배열인 경우 길이로 변환
    return parsedStandards.map((standard: any) => ({
      ...standard,
      meetings: Array.isArray(standard.meetings) ? standard.meetings.length : (standard.meetings || 0)
    }))
  } catch (error) {
    console.error('표준문서 데이터 파싱 오류:', error)
    return []
  }
}

function NewStandardDialog({
  onCreateStandard,
}: {
  onCreateStandard: (standard: { acronym: string; title: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    acronym: "",
    title: "",
  })

  const handleSubmit = () => {
    if (formData.acronym && formData.title) {
      onCreateStandard(formData)
      setFormData({ acronym: "", title: "" })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="flex flex-col items-center justify-center h-48 p-6">
            <div className="bg-blue-100 rounded-full p-4 mb-3">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-blue-700 font-medium text-lg">새 표준문서 등록</p>
            <p className="text-blue-600 text-sm mt-1">새로운 표준안을 추가하세요</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 표준문서 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acronym">표준문서 약어 (Acronym)</Label>
            <Input
              id="acronym"
              placeholder="예: ISO-27001, NIST-CSF"
              value={formData.acronym}
              onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">표준문서 제목</Label>
            <Textarea
              id="title"
              placeholder="예: Information Security Management Systems"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!formData.acronym || !formData.title}>
              등록
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function HomePage() {
  const [standards, setStandards] = useState<Standard[]>([])
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleLogin = (role: UserRole, password: string): boolean => {
    const chairPassword = localStorage.getItem('chairPassword') || 'chair'
    const contributorPassword = localStorage.getItem('contributorPassword') || 'cont'
    
    const isValid = (role === 'chair' && password === chairPassword) || 
                   (role === 'contributor' && password === contributorPassword)
    
    if (isValid) {
      const authState = {
        isAuthenticated: true,
        role,
        user: role
      }
      setAuth(authState)
      // 인증 정보를 localStorage에 저장
      localStorage.setItem('authState', JSON.stringify(authState))
      return true
    }
    return false
  }

  const handleLogout = () => {
    const authState = {
      isAuthenticated: false,
      role: null,
      user: null
    }
    setAuth(authState)
    // localStorage에서 인증 정보 삭제
    localStorage.removeItem('authState')
  }

  useEffect(() => {
    setStandards(getStoredStandards())
    
    // 저장된 인증 정보 복원
    const savedAuth = localStorage.getItem('authState')
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth)
        setAuth(parsedAuth)
      } catch (error) {
        console.error('인증 정보 복원 실패:', error)
      }
    }
  }, [])

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const saveStandards = (newStandards: Standard[]) => {
    setStandards(newStandards)
    localStorage.setItem('standards', JSON.stringify(newStandards))
  }

  const createDataDirectory = async (acronym: string) => {
    try {
      // 표준문서별 데이터 디렉토리 생성
      const dataPath = `/Users/whyun/workspace/Xtandaz/data/${acronym}`
      console.log(`데이터 디렉토리 생성: ${dataPath}`)
      
      // 실제 API 호출이나 서버 요청으로 디렉토리 생성
      // TODO: 서버 API 구현 후 실제 디렉토리 생성 로직 추가
      
      return true
    } catch (error) {
      console.error('디렉토리 생성 실패:', error)
      return false
    }
  }

  const handleCreateStandard = async (standardData: { acronym: string; title: string }) => {
    // 실제 저장된 표준문서 데이터 확인
    const existingStandardData = localStorage.getItem('standards')
    const allStandards = existingStandardData ? JSON.parse(existingStandardData) : []
    
    // 새 표준문서 데이터 생성
    const newStandardData = {
      acronym: standardData.acronym,
      title: standardData.title,
      meetings: [] // 빈 배열로 초기화
    }
    
    // 실제 데이터 저장 (배열 형태)
    const updatedStandardsData = [...allStandards, newStandardData]
    localStorage.setItem('standards', JSON.stringify(updatedStandardsData))
    
    // 메인 페이지 표시용 데이터 (숫자 형태)
    const newStandard: Standard = {
      acronym: standardData.acronym,
      title: standardData.title,
      meetings: 0,
      lastUpdate: new Date().toISOString().split('T')[0],
    }

    // 디렉토리 생성
    const success = await createDataDirectory(standardData.acronym)
    if (success) {
      const updatedStandards = [...standards, newStandard]
      setStandards(updatedStandards)
      console.log('새 표준문서 등록 완료:', newStandard)
    } else {
      console.error('표준문서 등록 실패: 디렉토리 생성 오류')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto p-6">
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                표준문서 관리 시스템
              </h1>
              <p className="text-gray-600 text-lg">드래그 앤 드롭으로 표준문서 개발 과정을 관리하세요</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                <span className={`font-medium ${auth.role === 'chair' ? 'text-blue-600' : 'text-green-600'}`}>
                  {auth.role === 'chair' ? 'Chair' : 'Contributor'}
                </span>
                로 로그인됨
              </div>
              {auth.role === 'chair' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  설정
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auth.role === 'chair' && <NewStandardDialog onCreateStandard={handleCreateStandard} />}
          
          {standards.map((standard) => (
            <Link key={standard.acronym} href={`/${standard.acronym}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-0 shadow-md cursor-pointer h-48">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-bold">{standard.acronym}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{standard.title}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {standard.meetings}개 회의
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {new Date(standard.lastUpdate).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {auth.role === 'chair' && (
        <SettingsDialog isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </div>
  )
}

// %%%%%LAST%%%%%