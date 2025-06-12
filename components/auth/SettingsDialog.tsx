"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Eye, EyeOff, Languages } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface SettingsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { t, language, changeLanguage } = useLanguage()
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

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      setLoading(true)
      const success = await changeLanguage(newLanguage)
      if (success) {
        setSuccess(t('messages.languageChanged'))
        setTimeout(() => setSuccess(""), 1500)
      } else {
        setSuccess(t('messages.saveError'))
      }
    } catch (error) {
      console.error('언어 변경 오류:', error)
      setSuccess(t('messages.saveError'))
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
        setSuccess(t('messages.passwordChanged'))
        setTimeout(() => {
          setSuccess("")
          onOpenChange(false)
        }, 1500)
      } else {
        setSuccess(t('messages.saveError'))
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      setSuccess(t('messages.saveError'))
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
            {t('dialog.settingsTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t('common.language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">{t('common.language')}</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('dialog.changePassword')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chairPassword">{t('auth.chair')} {t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="chairPassword"
                    type={showChairPassword ? "text" : "password"}
                    value={chairPassword}
                    onChange={(e) => setChairPassword(e.target.value)}
                    placeholder={`${t('auth.chair')} ${t('auth.password')}`}
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
                <Label htmlFor="contributorPassword">{t('auth.contributor')} {t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="contributorPassword"
                    type={showContributorPassword ? "text" : "password"}
                    value={contributorPassword}
                    onChange={(e) => setContributorPassword(e.target.value)}
                    placeholder={`${t('auth.contributor')} ${t('auth.password')}`}
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2" disabled={!chairPassword || !contributorPassword || loading}>
              <Save className="h-4 w-4" />
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
