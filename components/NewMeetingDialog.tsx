import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewMeetingDialogProps {
  onCreateMeeting: (meeting: { startDate: string; endDate: string; title: string; description?: string }) => void;
}

export default function NewMeetingDialog({
  onCreateMeeting,
}: NewMeetingDialogProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    title: "",
    description: "",
  });

  const handleSubmit = () => {
    if (formData.startDate && formData.endDate && formData.title) {
      onCreateMeeting(formData);
      setFormData({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], title: "", description: "" });
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
          {t('standard.newMeeting')} 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialog.newMeetingTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('standard.meetingDate')} (시작)</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('standard.meetingDate')} (종료)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">{t('standard.meetingTitle')}</Label>
            <Input
              id="title"
              placeholder="예: 24.07, Seoul"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('standard.meetingDescription')} (선택)</Label>
            <Textarea
              id="description"
              placeholder={t('standard.meetingDescription')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!formData.startDate || !formData.endDate || !formData.title}>
              {t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}