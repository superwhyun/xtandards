import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface NewMeetingDialogProps {
  onCreateMeeting: (meeting: { date: string; title: string; description?: string }) => void;
}

export default function NewMeetingDialog({
  onCreateMeeting,
}: NewMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    description: "",
  });

  const handleSubmit = () => {
    if (formData.date && formData.title) {
      onCreateMeeting(formData);
      setFormData({ date: "", title: "", description: "" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
        >
          <Plus className="h-6 w-6 mr-2" />
          새 회의 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 회의 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">회의 날짜</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">회의 제목</Label>
            <Input
              id="title"
              placeholder="예: 24.07, Seoul"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="회의 내용 설명..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!formData.date || !formData.title}>
              생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}