"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { remindersService } from "@/services/remindersService";
import { calendarService } from "@/services/calendarService";
import { ReminderItem, ReminderType } from "@/types/reminders";
import { EventItem } from "@/types/events";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  Bell,
  Plus,
  CheckCircle2,
  Square,
  Clock,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  Shirt,
  Train,
  CheckSquare,
} from "lucide-react";

export default function RemindersPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter tabs: All, Today, Upcoming, Completed
  const [tab, setTab] = useState<"all" | "today" | "upcoming" | "completed">("all");

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<ReminderType>("custom");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [eventId, setEventId] = useState<string>("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rList, evList] = await Promise.all([
        remindersService.getReminders(),
        calendarService.getEvents(),
      ]);
      setReminders(rList);
      setEvents(evList);
    } catch (err: any) {
      toastError("Load Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleComplete = async (id: string) => {
    const updated = await remindersService.toggleComplete(id);
    if (updated) {
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  };

  const handleDelete = async (id: string) => {
    await remindersService.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    success("Reminder Removed", "The reminder has been deleted.");
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("09:00");
    setType("custom");
    setPriority("Medium");
    setEventId("");
    setIsModalOpen(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedEvent = events.find((ev) => ev.id === eventId);

    if (editingId) {
      const existing = reminders.find((r) => r.id === editingId);
      if (existing) {
        const updated: ReminderItem = {
          ...existing,
          title: title.trim(),
          date,
          time,
          type,
          priority,
          eventId: eventId || undefined,
          eventTitle: matchedEvent?.title || undefined,
        };
        await remindersService.updateReminder(updated);
        setReminders((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        success("Reminder Updated", "Changes saved.");
      }
    } else {
      const created = await remindersService.createReminder({
        title: title.trim(),
        date,
        time,
        type,
        priority,
        eventId: eventId || undefined,
        eventTitle: matchedEvent?.title || undefined,
      });
      setReminders((prev) => [...prev, created]);
      success("Reminder Created", `Reminder scheduled for ${date} at ${time}.`);
    }

    setIsModalOpen(false);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const filtered = reminders.filter((r) => {
    if (tab === "today") return r.date === todayStr && !r.isCompleted;
    if (tab === "upcoming") return r.date >= todayStr && !r.isCompleted;
    if (tab === "completed") return r.isCompleted;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              OP AI Reminders & Timeline
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
              Smart Alerts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Intelligent preparation timelines connected with your schedule and digital wardrobe.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Reminder
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        {[
          { id: "all", label: `All Reminders (${reminders.length})` },
          {
            id: "today",
            label: `Today (${reminders.filter((r) => r.date === todayStr && !r.isCompleted).length})`,
          },
          {
            id: "upcoming",
            label: `Upcoming (${reminders.filter((r) => r.date >= todayStr && !r.isCompleted).length})`,
          },
          {
            id: "completed",
            label: `Completed (${reminders.filter((r) => r.isCompleted).length})`,
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tab === t.id
                ? "bg-[var(--primary)] text-white shadow-md"
                : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] border border-[var(--border)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No reminders in this view</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            OP AI automatically generates helpful preparation timelines when you create calendar events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rem) => {
            return (
              <div
                key={rem.id}
                className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  rem.isCompleted
                    ? "bg-green-500/5 border-green-500/20 text-[var(--text-muted)]"
                    : "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] hover:border-[var(--primary)]"
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(rem.id)}
                    className="cursor-pointer flex-shrink-0"
                  >
                    {rem.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--primary)]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold truncate ${
                          rem.isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {rem.title}
                      </span>
                      {rem.autoGenerated && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[var(--primary-soft)] text-[var(--primary)]">
                          OP AI Timeline
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rem.date}
                      </span>
                      <span className="flex items-center gap-1 font-mono font-bold text-[var(--primary)]">
                        <Clock className="w-3.5 h-3.5" />
                        {rem.time}
                      </span>
                      {rem.eventTitle && (
                        <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                          For: {rem.eventTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(rem.id)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Reminder" : "Create New Reminder"}
        size="md"
      >
        <form onSubmit={handleSaveReminder} className="space-y-4">
          <Input
            label="Reminder Description *"
            placeholder="e.g. Iron navy shirt, Departure alert, Pack laptop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Time *"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Link to Scheduled Event (Optional)
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            >
              <option value="">-- No linked event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date} at {ev.time})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
