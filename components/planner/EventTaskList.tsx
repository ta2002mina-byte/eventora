"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { createTask, deleteTask, toggleTaskComplete } from "@/app/dashboard/events/[id]/planner/actions";
import type { EventTaskPriority, EventTaskRecord } from "@/types/planner";

const priorityVariant: Record<EventTaskPriority, "gray" | "gold" | "danger"> = {
  low: "gray",
  medium: "gold",
  high: "danger",
};

const schema = z.object({
  title: z.string().trim().min(2, "Give the task a title").max(160),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignee: z.string().max(120).optional(),
});

type FormValues = z.infer<typeof schema>;

export function EventTaskList({ eventId, initialTasks }: { eventId: string; initialTasks: EventTaskRecord[] }) {
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState(initialTasks);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => setTasks(initialTasks), [initialTasks]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", dueDate: "", priority: "medium", assignee: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createTask({
      eventId,
      title: values.title,
      dueDate: values.dueDate || "",
      priority: values.priority,
      assignee: values.assignee || "",
    });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't add task", description: result.error });
      return;
    }
    // Optimistic-ish: refetch isn't wired without a router refresh, so
    // append a placeholder row; the server action revalidates the route.
    reset({ title: "", dueDate: "", priority: "medium", assignee: "" });
    toast({ variant: "success", title: "Task added" });
  }

  async function handleToggle(task: EventTaskRecord) {
    setPendingId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_complete: !t.is_complete } : t)));
    const result = await toggleTaskComplete(eventId, task.id, !task.is_complete);
    setPendingId(null);
    if (!result.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_complete: task.is_complete } : t)));
      toast({ variant: "error", title: "Couldn't update task", description: result.error });
    }
  }

  async function handleDelete(taskId: string) {
    setPendingId(taskId);
    const result = await deleteTask(eventId, taskId);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't delete task", description: result.error });
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 rounded-card border border-border p-4 sm:grid-cols-[1fr_auto_auto_auto]"
        noValidate
      >
        <Input placeholder="Add a task…" error={errors.title?.message} {...register("title")} />
        <Input type="date" className="sm:w-40" {...register("dueDate")} />
        <Select
          className="sm:w-32"
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          {...register("priority")}
        />
        <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add your first task above, or generate a checklist with the AI Planner." />
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={task.is_complete}
                  onChange={() => handleToggle(task)}
                  disabled={pendingId === task.id}
                  aria-label={`Mark "${task.title}" ${task.is_complete ? "incomplete" : "complete"}`}
                />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${task.is_complete ? "text-charcoal-400 line-through" : "text-charcoal"}`}>
                  {task.title}
                </p>
                {task.notes && <p className="mt-0.5 text-xs text-charcoal-400">{task.notes}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                  {task.due_date && <span className="text-xs text-charcoal-400">Due {task.due_date}</span>}
                  {task.assignee && <span className="text-xs text-charcoal-400">· {task.assignee}</span>}
                  {task.source === "ai" && (
                    <Badge variant="purple">
                      <Sparkles className="h-3 w-3" /> AI
                    </Badge>
                  )}
                </div>
              </div>
              <button
                aria-label={`Delete task "${task.title}"`}
                onClick={() => handleDelete(task.id)}
                disabled={pendingId === task.id}
                className="rounded-full p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
