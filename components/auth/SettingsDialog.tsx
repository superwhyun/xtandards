"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Save, Eye, EyeOff } from "lucide-react"

interface SettingsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const [chairPassword, setChairPassword] = useState("")
  const [contributorPassword, setContributorPassword] = useState("")
  const [showChairPassword, setShowChairPassword] = useState(false)
  const [showContributorPassword, setShowContributorPassword] = useState(false)
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const loadPasswords = async () => {
    if (!isOpen) return
    
    try {
      setLoading(true)
      console.log('API 호출: GET /api/auth/settings')
      const response = await fetch('/api/auth/settings')
      if (response.ok) {
        const data = await response.json()
        setChairPassword(data.chairPassword || 'chair')
        setContributorPassword(data.contributorPassword || 'cont')
      }
    } catch (error) {
      console.error('비밀번호 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!chairPassword || !contributorPassword) {
      return
    }

    try {
      setLoading(true)
      console.log('API 호출: PUT /api/auth/settings')
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chairPassword, contributorPassword })
      })

      if (response.ok) {
        setSuccess("비밀번호가 성공적으로 변경되었습니다")
        setTimeout(() => {
          setSuccess("")
          onOpenChange(false)
        }, 1500)
      } else {
        setSuccess("비밀번호 변경에 실패했습니다")
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      setSuccess("비밀번호 변경 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 다이얼로그가 열릴 때 비밀번호 로드
  useEffect(() => {
    if (isOpen) {
      loadPasswords()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            시스템 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">비밀번호 관리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chairPassword">Chair 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="chairPassword"
                    type={showChairPassword ? "text" : "password"}
                    value={chairPassword}
                    onChange={(e) => setChairPassword(e.target.value)}
                    placeholder="Chair 비밀번호"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowChairPassword(!showChairPassword)}
                  >
                    {showChairPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contributorPassword">Contributor 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="contributorPassword"
                    type={showContributorPassword ? "text" : "password"}
                    value={contributorPassword}
                    onChange={(e) => setContributorPassword(e.target.value)}
                    placeholder="Contributor 비밀번호"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowContributorPassword(!showContributorPassword)}
                  >
                    {showContributorPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {success && (
                <div className="text-green-600 text-sm font-medium">
                  {success}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2" disabled={!chairPassword || !contributorPassword || loading}>
              <Save className="h-4 w-4" />
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
