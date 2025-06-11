"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, X } from "lucide-react"

interface DocumentGeneratorProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  documentType: 'agenda' | 'minutes'
  content: string
  title: string
}

export default function DocumentGenerator({
  isOpen,
  onOpenChange,
  documentType,
  content,
  title
}: DocumentGeneratorProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title}_${documentType === 'agenda' ? 'Agenda' : '회의록'}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title}_${documentType === 'agenda' ? 'Agenda' : '회의록'}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {documentType === 'agenda' ? 'Agenda' : '회의록'} - {title}
            <div className="flex gap-2">
              <Button onClick={handleDownload} size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                다운로드
              </Button>
              <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full">
          <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg">
            {content}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
// %%%%%LAST%%%%%