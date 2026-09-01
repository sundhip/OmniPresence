"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { calendarService } from "@/services/calendarService";
import { wardrobeService } from "@/services/wardrobeService";
import { remindersService } from "@/services/remindersService";
import { weatherService } from "@/services/weatherService";
import { EventItem, EventCategory, EventPriority, TransitMode } from "@/types/events";
import { WardrobeItem } from "@/types/wardrobe";
import { ReminderItem } from "@/types/reminders";
import { WeatherContext } from "@/types/weather";
import { EventUnderstandingEngine } from "@/lib/eventUnderstandingEngine";
import { TransportationEngine } from "@/lib/transportationEngine";
import { ReadinessEngine } from "@/lib/readinessEngine";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/googleCalendar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Train,
  Car,
  Bus,
  Footprints,
  Shirt,
  CloudSun,
  Bell,
  CheckSquare,
  Square,
  Edit3,
  Trash2,
  Plus,
  Navigation,
  Activity,
  Zap,
  ExternalLink,
  Download,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [editType, setEditType] = useState<EventCategory>("Presentation");
  const [editPriority, setEditPriority] = useState<EventPriority>("High");
  const [editNotes, setEditNotes] = useState("");

  // Select Outfit Modal
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);
  const [selectedTop, setSelectedTop] = useState("");
  const [selectedBottom, setSelectedBottom] = useState("");
  const [selectedShoes, setSelectedShoes] = useState("");

  // New Reminder Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [remTitle, setRemTitle] = useState("");
  const [remTime, setRemTime] = useState("18:00");

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const [ev, wList, rList, wContext] = await Promise.all([
        calendarService.getEventById(eventId),
        wardrobeService.getItems(),
        remindersService.getReminders(),
        weatherService.getWeatherContext().catch(() => null),
      ]);

      if (!ev) {
        toastError("Event Not Found", "The requested event could not be found.");
        router.push("/calendar");
        return;
      }

      setEvent(ev);
      setWardrobe(wList);
      setReminders(rList.filter((r) => r.eventId === eventId));
      setWeather(wContext);

      // Populate edit fields
      setEditTitle(ev.title);
      setEditDate(ev.date);
      setEditTime(ev.time);
      setEditLocation(ev.location);
      setEditOrigin(ev.originLocation || "Tambaram");
      setEditType(ev.type);
      setEditPriority(ev.priority);
      setEditNotes(ev.notes || "");
    } catch (err: any) {
      toastError("Load Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId, user]);

  if (isLoading || !event) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse pb-16">
        <div className="h-8 w-48 bg-[var(--surface-soft)] rounded-full" />
        <div className="h-48 bg-[var(--surface)] border border-[var(--border)] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-[var(--surface)] border border-[var(--border)] rounded-3xl" />
          <div className="h-64 bg-[var(--surface)] border border-[var(--border)] rounded-3xl" />
        </div>
      </div>
    );
  }

  // Derive contextual intelligence
  const eventContext = EventUnderstandingEngine.inferEventContext(event);
  const transitPlan = TransportationEngine.calculateTransitOptions(
    event.originLocation || "Tambaram",
    event.location || "Venue",
    event.time || "10:00",
    eventContext.travelRequirement.bufferMinutes
  );
  const readiness = ReadinessEngine.calculateEventReadiness(event, wardrobe, reminders);

  const handleToggleChecklist = async (factorId: string) => {
    const current = new Set(event.completedChecklist || []);
    if (current.has(factorId)) {
      current.delete(factorId);
    } else {
      current.add(factorId);
    }

    const updated: EventItem = {
      ...event,
      completedChecklist: Array.from(current),
    };

    setEvent(updated);
    await calendarService.updateEvent(updated);
  };

  const handleSelectTransit = async (mode: TransitMode) => {
    const updated: EventItem = {
      ...event,
      selectedTransitMode: mode,
      completedChecklist: Array.from(
        new Set([...(event.completedChecklist || []), "transportation_planned"])
      ),
    };
    setEvent(updated);
    await calendarService.updateEvent(updated);
    success("Transit Selected", `Set ${mode} as primary transit mode for this event.`);
  };

  const handleSaveOutfit = async () => {
    const topItem = wardrobe.find((w) => w.id === selectedTop);
    const bottomItem = wardrobe.find((w) => w.id === selectedBottom);
    const shoesItem = wardrobe.find((w) => w.id === selectedShoes);

    const updated: EventItem = {
      ...event,
      plannedOutfit: {
        topItemId: topItem?.id,
        topItemName: topItem?.name,
        bottomItemId: bottomItem?.id,
        bottomItemName: bottomItem?.name,
        shoesItemId: shoesItem?.id,
        shoesItemName: shoesItem?.name,
      },
      completedChecklist: Array.from(
        new Set([
          ...(event.completedChecklist || []),
          "outfit_selected",
          ...(shoesItem ? ["footwear_selected"] : []),
        ])
      ),
    };

    setEvent(updated);
    await calendarService.updateEvent(updated);
    setIsOutfitModalOpen(false);
    success("Outfit Updated", "Planned outfit saved for this event.");
  };

  const handleToggleReminder = async (remId: string) => {
    await remindersService.toggleComplete(remId);
    setReminders((prev) =>
      prev.map((r) => (r.id === remId ? { ...r, isCompleted: !r.isCompleted } : r))
    );
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    const newRem = await remindersService.createReminder({
      eventId: event.id,
      eventTitle: event.title,
      title: remTitle.trim(),
      date: event.date,
      time: remTime,
      type: "custom",
      priority: event.priority,
    });

    setReminders((prev) => [...prev, newRem]);
    setIsReminderModalOpen(false);
    setRemTitle("");
    success("Reminder Added", `Reminder set for ${remTime}.`);
  };

  const handleUpdateEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EventItem = {
      ...event,
      title: editTitle.trim(),
      date: editDate,
      time: editTime,
      location: editLocation.trim(),
      originLocation: editOrigin.trim(),
      type: editType,
      priority: editPriority,
      notes: editNotes.trim(),
    };

    await calendarService.updateEvent(updated);
    setEvent(updated);
    setIsEditOpen(false);
    success("Event Updated", "Changes saved successfully.");
  };

  const handleDeleteEvent = async () => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      await calendarService.deleteEvent(event.id);
      success("Event Deleted", `"${event.title}" has been removed.`);
      router.push("/calendar");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 text-xs font-bold transition-all shadow-sm"
          >
            <span>Add to Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadIcsFile(event)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            title="Download .ICS for Apple Calendar, Outlook, or Google Calendar"
          >
            Export .ICS
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteEvent}
            className="text-[var(--error)] hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Hero Event Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
                {event.type}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--surface-soft)] text-[var(--text-muted)] border border-[var(--border)]">
                Priority: {event.priority}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--text-secondary)] pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[var(--primary)]" />
                {event.date}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[var(--primary)]" />
                {event.time}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-[var(--primary)]" />
                {event.location}
              </span>
            </div>
          </div>

          {/* READINESS SCORE BADGE */}
          <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex flex-col items-center justify-center min-w-[140px] text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Readiness Score
            </span>
            <div className="text-3xl font-black text-[var(--text-primary)] my-1">
              {readiness.score}%
            </div>
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
              {readiness.status}
            </span>
          </div>
        </div>

        {/* Readiness Summary Note */}
        <div className="p-4 rounded-2xl bg-[var(--primary-soft)]/40 border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">OP AI Readiness Insight:</span> {readiness.summary}
          </div>
        </div>
      </div>

      {/* TWO COLUMN INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. EVENT UNDERSTANDING & DRESS CODE (Feature 15) */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              OP AI Event Understanding
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-2xl bg-[var(--surface-soft)]">
              <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                Inferred Occasion
              </span>
              <span className="font-bold text-[var(--text-primary)]">{eventContext.occasion}</span>
            </div>

            <div className="flex justify-between p-3 rounded-2xl bg-[var(--surface-soft)]">
              <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                Formality Level
              </span>
              <span className="font-bold text-[var(--primary)]">{eventContext.formality}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] space-y-1.5">
              <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px] block">
                Recommended Dress Code
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {eventContext.recommendedDressCode}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] space-y-1.5">
              <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px] block">
                Harmonious Color Palette
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {eventContext.recommendedColorPalette.map((col) => (
                  <span
                    key={col}
                    className="px-2.5 py-1 rounded-xl bg-[var(--surface)] text-[var(--text-primary)] font-bold text-[11px] border border-[var(--border)]"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. WEATHER & FABRIC SUITABILITY */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
            <CloudSun className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Forecast & Weather Intelligence
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-soft)]">
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)]">
                  {weather?.temperature || 28}°C
                </p>
                <p className="text-xs font-bold text-[var(--text-secondary)]">
                  {weather?.condition || "Warm & Humid"} in {weather?.location?.split(",")[0] || "Chennai"}
                </p>
              </div>
              <div className="text-right text-[11px] text-[var(--text-muted)] space-y-0.5">
                <div>Humidity: {weather?.humidity || 65}%</div>
                <div>Precipitation: {weather?.precipitation || "Low (5%)"}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] space-y-1">
              <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px] block">
                Fabric Guidance
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {eventContext.weatherSuitabilityNote}
              </p>
            </div>
          </div>
        </div>

        {/* 3. PLANNED OUTFIT SELECTION */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Planned Outfit</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOutfitModalOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Configure Outfit
            </Button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-bold">Top:</span>
              <span className="font-bold text-[var(--text-primary)]">
                {event.plannedOutfit?.topItemName || "Tailored Black Oxford Shirt"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-bold">Bottom:</span>
              <span className="font-bold text-[var(--text-primary)]">
                {event.plannedOutfit?.bottomItemName || "Italian Wool Charcoal Trousers"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-bold">Footwear:</span>
              <span className="font-bold text-[var(--text-primary)]">
                {event.plannedOutfit?.shoesItemName || "Black Leather Chelsea Boots"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. SMART TRANSPORTATION RECOMMENDATION (Fastest Transit Engine) */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Smart Transportation Options
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              From {transitPlan.origin}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-600">
              <Zap className="w-3.5 h-3.5" />
              <span>Recommended: {transitPlan.recommendedOption.name}</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Fastest option ({transitPlan.recommendedOption.durationMinutes} mins).{" "}
              <strong>Leave by {transitPlan.recommendedDepartureTime}</strong> to arrive on time.
            </p>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {transitPlan.allOptions.map((opt) => {
              const isSelected = event.selectedTransitMode === opt.mode;
              return (
                <div
                  key={opt.mode}
                  onClick={() => handleSelectTransit(opt.mode)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    isSelected
                      ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{opt.name}</span>
                    {opt.isFastest && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-600 font-bold uppercase">
                        Fastest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span>{opt.durationMinutes} mins</span>
                    <span className="text-[var(--text-muted)]">{opt.estimatedCost}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. PREPARATION CHECKLIST & TIMELINE REMINDERS (Feature 16 & 19) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Event Preparation Checklist & Timeline
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Complete checklist items to boost your live Readiness Score.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReminderModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Timeline Reminder
          </Button>
        </div>

        {/* Interactive Readiness Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {readiness.factors.map((f) => {
            return (
              <div
                key={f.id}
                onClick={() => handleToggleChecklist(f.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  f.completed
                    ? "bg-green-500/5 border-green-500/30 text-[var(--text-primary)] font-medium"
                    : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {f.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  )}
                  <span>{f.label}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  +{f.weight}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Connected Event Reminders */}
        {reminders.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              <Bell className="w-4 h-4 text-[var(--primary)]" />
              <span>Event Timeline Reminders ({reminders.length})</span>
            </div>

            <div className="space-y-2">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  onClick={() => handleToggleReminder(rem.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    rem.isCompleted
                      ? "bg-green-500/5 border-green-500/20 text-[var(--text-muted)] line-through"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-primary)] font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {rem.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Square className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                    <span>{rem.title}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[var(--primary)]">
                    {rem.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EDIT EVENT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Event Details"
        size="lg"
      >
        <form onSubmit={handleUpdateEventDetails} className="space-y-4">
          <Input
            label="Event Name *"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
            />
            <Input
              label="Time *"
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Destination / Venue Address"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
            <Input
              label="Starting Location"
              value={editOrigin}
              onChange={(e) => setEditOrigin(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Category
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as EventCategory)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <option value="Presentation">Presentation</option>
                <option value="Wedding">Wedding / Reception</option>
                <option value="Job Interview">Job Interview</option>
                <option value="Work Meeting">Work Meeting</option>
                <option value="Casual Outing">Casual Outing</option>
                <option value="Date">Date / Dinner</option>
                <option value="Formal Gala">Formal Gala</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as EventPriority)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIGURE OUTFIT MODAL */}
      <Modal
        isOpen={isOutfitModalOpen}
        onClose={() => setIsOutfitModalOpen(false)}
        title="Select Outfit from Wardrobe"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Select Top (Shirt / T-Shirt / Sweater)
            </label>
            <select
              value={selectedTop}
              onChange={(e) => setSelectedTop(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            >
              <option value="">-- Choose from wardrobe --</option>
              {wardrobe
                .filter((w) => w.category === "Tops")
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.color})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Select Bottom (Trousers / Chinos / Jeans)
            </label>
            <select
              value={selectedBottom}
              onChange={(e) => setSelectedBottom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            >
              <option value="">-- Choose from wardrobe --</option>
              {wardrobe
                .filter((w) => w.category === "Bottoms")
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.color})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Select Footwear (Boots / Loafers / Sneakers)
            </label>
            <select
              value={selectedShoes}
              onChange={(e) => setSelectedShoes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            >
              <option value="">-- Choose from wardrobe --</option>
              {wardrobe
                .filter((w) => w.category === "Shoes")
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.color})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" onClick={() => setIsOutfitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveOutfit}>
              Confirm Outfit
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD REMINDER MODAL */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Add Event Timeline Reminder"
        size="sm"
      >
        <form onSubmit={handleAddReminder} className="space-y-4">
          <Input
            label="Reminder Title *"
            placeholder="e.g. Iron blazer, Departure alert"
            value={remTitle}
            onChange={(e) => setRemTitle(e.target.value)}
            required
          />
          <Input
            label="Time *"
            type="time"
            value={remTime}
            onChange={(e) => setRemTime(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsReminderModalOpen(false)}>
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
