import { Check, Clock, Pencil, Trash2, Sparkles } from "lucide-react";
import type { Task } from "@/lib/types";
import { getCategory, SUGGESTIONS } from "@/lib/categories";
import { useStore } from "@/lib/store";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: Props) {
  const { toggleComplete, deleteTask } = useStore();
  const meta = getCategory(task.category);
  const Icon = meta.icon;
  const [openTips, setOpenTips] = useState(false);
  const suggestion = SUGGESTIONS[task.category];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-elegant ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div
        className="absolute inset-y-0 start-0 w-1.5"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      <div className="flex items-start gap-3 ps-3">
        <button
          onClick={() => toggleComplete(task.id)}
          aria-label={task.completed ? "إلغاء الإكمال" : "إكمال"}
          className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-all ${
            task.completed
              ? "border-transparent bg-gradient-primary text-primary-foreground"
              : "border-border hover:border-primary"
          }`}
        >
          {task.completed && <Check className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <h3
              className={`font-display text-base font-bold text-foreground ${
                task.completed ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
              <Clock className="h-3 w-3" />
              {task.startTime} – {task.endTime}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
            >
              {meta.labelAr}
            </span>
            {task.repeat !== "none" && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
                {task.repeat === "daily" ? "يومي" : "أسبوعي"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Popover open={openTips} onOpenChange={setOpenTips}>
            <PopoverTrigger asChild>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                aria-label="اقتراحات"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="font-display text-sm font-bold">{suggestion.titleAr}</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {suggestion.tipsAr.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => onEdit(task)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}