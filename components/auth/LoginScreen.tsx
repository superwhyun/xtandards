"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users } from "lucide-react"

export type UserRole = "chair" | "contributor"

export interface AuthState {
  isAuthenticated: boolean
  role: UserRole | null
  user: string | null
}

interface LoginScreenProps {
  onLogin: (role: UserRole, password: string) => boolean
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setError("")
    // 기본 비밀번호 설정 (편의를 위해)
    setPassword(role === "chair" ? "chair" : "cont")
  }

  const handleLogin = () => {
    if (!selectedRole || !password) {
      setError("역할과 비밀번호를 모두 입력해주세요")
      return
    }

    const success = onLogin(selectedRole, password)
    if (!success) {
      setError("비밀번호가 올바르지 않습니다")
      setPassword("")
    }
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              표준문서 관리 시스템
            </h1>
            <p className="text-gray-600 text-lg">역할을 선택하여 로그인하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-blue-400"
              onClick={() => handleRoleSelect("chair")}
            >
              <CardHeader className="text-center pb-2">
                <div className="bg-blue-100 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-blue-700">Chair</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">회의 주관자</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• 회의 관리 (추가/수정/삭제)</li>
                  <li>• 문서 상태 관리</li>
                  <li>• 시스템 설정 관리</li>
                  <li>• 모든 기능 접근 가능</li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-green-400"
              onClick={() => handleRoleSelect("contributor")}
            >
              <CardHeader className="text-center pb-2">
                <div className="bg-green-100 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-green-700">Contributor</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">기고자</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• 기고서 업로드</li>
                  <li>• 수정본 업로드</li>
                  <li>• 문서 다운로드</li>
                  <li>• 제한된 기능 접근</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
      <div className="container mx-auto p-6 max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className={`rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center ${
              selectedRole === "chair" ? "bg-blue-100" : "bg-green-100"
            }`}>
              {selectedRole === "chair" ? (
                <Shield className={`h-8 w-8 ${selectedRole === "chair" ? "text-blue-600" : "text-green-600"}`} />
              ) : (
                <Users className={`h-8 w-8 ${selectedRole === "chair" ? "text-blue-600" : "text-green-600"}`} />
              )}
            </div>
            <CardTitle className={`text-xl font-bold ${
              selectedRole === "chair" ? "text-blue-700" : "text-green-700"
            }`}>
              {selectedRole === "chair" ? "Chair" : "Contributor"} 로그인
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="비밀번호를 입력하세요"
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedRole(null)} 
                className="flex-1"
              >
                뒤로
              </Button>
              <Button 
                onClick={handleLogin} 
                className="flex-1"
                disabled={!password}
              >
                로그인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
