"use client"

import { useState } from "react"
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

  const loadPasswords = () => {
    if (typeof window !== 'undefined') {
      const chairPw = localStorage.getItem('chairPassword') || 'chair'
      const contPw = localStorage.getItem('contributorPassword') || 'cont'
      setChairPassword(chairPw)
      setContributorPassword(contPw)
    }
  }

  const handleSave = () => {
    if (!chairPassword || !contributorPassword) {
      return
    }

    localStorage.setItem('chairPassword', chairPassword)
    localStorage.setItem('contributorPassword', contributorPassword)
    setSuccess("비밀번호가 성공적으로 변경되었습니다")
    
    setTimeout(() => {
      setSuccess("")
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} onOpenChangeCapture={loadPasswords}>
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
            <Button onClick={handleSave} className="flex-1 gap-2" disabled={!chairPassword || !contributorPassword}>
              <Save className="h-4 w-4" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
