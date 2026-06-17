import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIMARY_CATEGORIES, getCategory } from "@/lib/categories";
import { useStore } from "@/lib/store";
import { makeI18n } from "@/lib/i18n";
import type { Task, CategoryKey, RepeatKind } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaultDate?: string;
}

export function TaskDialog({ open, onOpenChange, task, defaultDate }: Props) {
  const { addTask, updateTask, state } = useStore();
  const i = makeI18n(state.language);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [category, setCategory] = useState<CategoryKey>("study");
  const [repeat, setRepeat] = useState<RepeatKind>("none");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDate(task.date);
      setStartTime(task.startTime);
      setEndTime(task.endTime);
      setCategory(task.category);
      setRepeat(task.repeat);
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
      setStartTime("09:00");
      setEndTime("10:00");
      setCategory("study");
      setRepeat("none");
    }
  }, [open, task, defaultDate]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(i.t("task.requiredTitle"));
      return;
    }
    const meta = getCategory(category);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime,
      endTime,
      category,
      color: meta.color,
      repeat,
    };
    if (task) {
      updateTask(task.id, payload);
      toast.success(i.t("task.updated"));
    } else {
      addTask(payload);
      toast.success(i.t("task.created"));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {task ? i.t("task.edit") : i.t("task.new")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">{i.t("task.titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={i.t("task.titlePlaceholder")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">{i.t("task.descLabel")}</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={i.t("task.descPlaceholder")}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">{i.t("task.date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start">{i.t("task.start")}</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">{i.t("task.end")}</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{i.t("task.category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      <span className="flex items-center gap-2">
                        <span>{c.emoji}</span>
                        {i.t(c.labelKey)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{i.t("task.repeat")}</Label>
              <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{i.t("task.repeat.none")}</SelectItem>
                  <SelectItem value="daily">{i.t("task.repeat.daily")}</SelectItem>
                  <SelectItem value="weekly">{i.t("task.repeat.weekly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {i.t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            {i.t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}