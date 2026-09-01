"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { calendarService } from "@/services/calendarService";
import { remindersService } from "@/services/remindersService";
import { wardrobeService } from "@/services/wardrobeService";
import { EventItem, EventCategory, EventPriority } from "@/types/events";
import { WardrobeItem } from "@/types/wardrobe";
import { ReminderItem } from "@/types/reminders";
import { ReadinessEngine } from "@/lib/readinessEngine";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/googleCalendar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Train,
  ChevronRight,
  Filter,
  Shirt,
  CalendarCheck,
  ExternalLink,
  Download,
} from "lucide-react";

export default function CalendarPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters: All, Today, Upcoming, Past
  const [filterTab, setFilterTab] = useState<"all" | "today" | "upcoming" | "past">("all");

  // Create Event Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [originLocation, setOriginLocation] = useState("Tambaram");
  const [type, setType] = useState<EventCategory>("Presentation");
  const [priority, setPriority] = useState<EventPriority>("High");
  const [notes, setNotes] = useState("");
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [evList, wList, rList] = await Promise.all([
        calendarService.getEvents(),
        wardrobeService.getItems(),
        remindersService.getReminders(),
      ]);
      setEvents(evList);
      setWardrobe(wList);
      setReminders(rList);
    } catch (err: any) {
      toastError("Load Error", err.message || "Failed to load calendar events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      toastError("Missing Fields", "Please provide a title, date, and time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await calendarService.createEvent({
        title: title.trim(),
        date,
        time,
        location: location.trim() || "Main Venue",
        originLocation: originLocation.trim() || "Tambaram",
        type,
        priority,
        notes: notes.trim(),
      });

      success("Event Created", `"${title}" added with auto-generated preparation timeline.`);
      setIsCreateOpen(false);

      if (syncToGoogleCalendar) {
        const gcalUrl = getGoogleCalendarUrl(created);
        window.open(gcalUrl, "_blank", "noopener,noreferrer");
      }

      // Reset form
      setTitle("");
      setLocation("");
      setNotes("");
      loadData();
    } catch (err: any) {
      toastError("Creation Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredEvents = events.filter((e) => {
    if (filterTab === "today") return e.date === todayStr;
    if (filterTab === "upcoming") return e.date >= todayStr;
    if (filterTab === "past") return e.date < todayStr;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Schedule &amp; Event Preparation
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
              Google Calendar Ready
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Personal calendar intelligence connecting outfits, smart transit departure, and Google Calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        {[
          { id: "all", label: `All Events (${events.length})` },
          {
            id: "today",
            label: `Today (${events.filter((e) => e.date === todayStr).length})`,
          },
          {
            id: "upcoming",
            label: `Upcoming (${events.filter((e) => e.date >= todayStr).length})`,
          },
          {
            id: "past",
            label: `Past (${events.filter((e) => e.date < todayStr).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterTab === tab.id
                ? "bg-[var(--primary)] text-white shadow-md"
                : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] border border-[var(--border)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4"
            >
              <div className="w-1/2 h-5 rounded-full bg-[var(--surface-soft)]" />
              <div className="w-3/4 h-4 rounded-full bg-[var(--surface-soft)]" />
              <div className="w-full h-24 rounded-2xl bg-[var(--surface-soft)]" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            No events found in this view
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Create a scheduled event to let OP AI recommend matching outfits, transit departure times, and preparation timelines.
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create an Event
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const readiness = ReadinessEngine.calculateEventReadiness(ev, wardrobe, reminders);
            const isToday = ev.date === todayStr;

            return (
              <div
                key={ev.id}
                className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] shadow-[var(--shadow-card)] hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Header Badge */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ev.type === "Wedding"
                          ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                          : ev.type === "Presentation"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : ev.type === "Job Interview"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20"
                      }`}
                    >
                      {ev.type}
                    </span>

                    {/* Readiness Status Tag */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        readiness.status === "READY"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : readiness.status === "ALMOST READY"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      }`}
                    >
                      {readiness.status === "READY" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {readiness.score}% {readiness.status}
                    </span>
                  </div>

                  <div>
                    <Link href={`/calendar/${ev.id}`}>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                        {ev.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-1.5">
                      <span className="flex items-center gap-1 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        {ev.date} at {ev.time}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 font-bold text-[10px]">
                          TODAY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>

                  {/* Planned Outfit or Notes Preview */}
                  <div className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-primary)]">
                      <span className="flex items-center gap-1">
                        <Shirt className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Outfit Planned
                      </span>
                      <span className="text-[var(--text-muted)] font-normal">
                        {ev.plannedOutfit?.topItemName ? "Configured" : "Auto-Suggested"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      {ev.plannedOutfit?.topItemName || ev.dressCode || "Navy Formal / Smart Casual"}
                    </p>
                  </div>
                </div>

                {/* Card Actions: Google Calendar & Details */}
                <div className="pt-4 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <a
                    href={getGoogleCalendarUrl(ev)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--surface-soft)] hover:bg-[var(--primary-soft)] text-[var(--text-secondary)] hover:text-[var(--primary)] border border-[var(--border)] text-[11px] font-bold transition-all"
                    title="Add to Google Calendar"
                  >
                    <span>Google Cal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Link
                    href={`/calendar/${ev.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    <span>Details &amp; Transit</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Scheduled Event"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title *"
            placeholder="e.g. College Presentation, Wedding Reception, TCS Interview"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Destination Venue / Location *"
              placeholder="e.g. Main Auditorium, Nungambakkam Hall"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <Input
              label="Starting Departure Origin"
              placeholder="e.g. Tambaram, Guindy, Home"
              value={originLocation}
              onChange={(e) => setOriginLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Occasion / Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventCategory)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <option value="Presentation">Presentation</option>
                <option value="Wedding">Wedding</option>
                <option value="Job Interview">Job Interview</option>
                <option value="Meeting">Meeting</option>
                <option value="Dinner">Dinner</option>
                <option value="Date">Date</option>
                <option value="Party">Party</option>
                <option value="Travel">Travel</option>
                <option value="Casual Outing">Casual Outing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as EventPriority)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <Input
            label="Dress Code / Special Notes"
            placeholder="e.g. Bring laptop, strictly formal attire required"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Google Calendar Sync Checkbox */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Sync to Google Calendar upon creation
              </span>
            </div>
            <input
              type="checkbox"
              checked={syncToGoogleCalendar}
              onChange={(e) => setSyncToGoogleCalendar(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save &amp; Generate Timeline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
