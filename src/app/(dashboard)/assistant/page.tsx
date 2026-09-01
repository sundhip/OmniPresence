"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { assistantService } from "@/services/assistantService";
import { ChatMessage, PendingAction } from "@/types/assistant";
import { Button } from "@/components/ui/Button";
import { FormattedMessage } from "@/components/ui/FormattedMessage";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Calendar,
  Clock,
  Shirt,
  Train,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Check,
  X,
  MapPin,
  Tag,
  Zap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AssistantPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    "What should I wear today?",
    "Explain quantum computing simply",
    "Help me write a professional leave email",
    "How to style a white shirt?",
    "Add ₹450 for lunch",
    "What is my remaining budget?",
    "I have a wedding tomorrow. What should I wear and will it rain?",
  ];

  const initializeWelcome = () => {
    setMessages([
      {
        id: "msg_welcome",
        sender: "assistant",
        text: `Hello ${user?.name || "there"}! I am **OP AI**, your personal intelligence assistant.\n\nI have active, private contextual awareness over your:\n• **Digital Wardrobe** & Wear History\n• **Calendar Schedule** & Transit Routes\n• **Live Local Weather**\n• **Personal Finance Goals**\n\nHow can I help you plan your day?`,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          {
            label: "What should I wear today?",
            actionType: "query",
            payload: "What should I wear today?",
          },
          {
            label: "What's on my schedule?",
            actionType: "query",
            payload: "What's on my schedule?",
          },
          {
            label: "What is my remaining budget?",
            actionType: "query",
            payload: "What is my remaining budget?",
          },
        ],
      },
    ]);
  };

  useEffect(() => {
    initializeWelcome();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInputValue("");
    setIsThinking(true);

    try {
      const recentTurns = newHistory.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const assistantReply = await assistantService.askAssistant(query, recentTurns);
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: "assistant",
          text: "I encountered a temporary issue accessing your contextual data. Please try asking again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleActionClick = (action: NonNullable<ChatMessage["suggestedActions"]>[0]) => {
    if (action.actionType === "query" && action.payload) {
      handleSendMessage(action.payload);
    }
  };

  const handleExecuteAction = async (msgId: string, action: PendingAction) => {
    setExecutingActionId(action.id);
    try {
      const res = await assistantService.executePendingAction(action);
      if (res.success) {
        success("Action Executed", res.message);
        // Update message state to show action executed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId && m.pendingAction
              ? {
                  ...m,
                  pendingAction: { ...m.pendingAction, status: "executed" },
                  text: `${m.text}\n\n✓ **Action Completed**: ${res.message}`,
                }
              : m
          )
        );
      } else {
        toastError("Execution Failed", res.message);
      }
    } catch (e: any) {
      toastError("Error", e.message);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.pendingAction
          ? {
              ...m,
              pendingAction: { ...m.pendingAction, status: "cancelled" },
              text: `${m.text}\n\n✗ *Action cancelled.*`,
            }
          : m
      )
    );
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl h-[calc(100vh-6rem)] flex flex-col pb-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6657D9] to-[#8B74EC] text-white flex items-center justify-center shadow-md shadow-[#6657D9]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                OP AI Personal Intelligence
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
                Live Context
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Grounded in your actual wardrobe, schedule, transit options, and financial goals.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={initializeWelcome}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="Reset Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear Chat
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm space-y-3.5 shadow-sm ${
                  isUser
                    ? "bg-[var(--primary)] text-white rounded-br-xs"
                    : "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-xs"
                }`}
              >
                {/* Formatted Text Content */}
                <FormattedMessage text={msg.text} isUser={isUser} />

                {/* 1. EMBEDDED OUTFIT CARD */}
                {!isUser && msg.embeddedCard?.type === "outfit" && (
                  <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                        <Shirt className="w-4 h-4 text-[var(--primary)]" />
                        <span>{msg.embeddedCard.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {msg.embeddedCard.details.matchScore || 9.2} Match
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {msg.embeddedCard.details.topName && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                          <span className="text-[10px] text-[var(--text-muted)] block font-semibold">Top</span>
                          <p className="font-bold text-[var(--text-primary)] truncate">
                            {msg.embeddedCard.details.topName}
                          </p>
                        </div>
                      )}
                      {msg.embeddedCard.details.bottomName && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                          <span className="text-[10px] text-[var(--text-muted)] block font-semibold">Bottom</span>
                          <p className="font-bold text-[var(--text-primary)] truncate">
                            {msg.embeddedCard.details.bottomName}
                          </p>
                        </div>
                      )}
                      {msg.embeddedCard.details.shoesName && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-[var(--text-muted)] block font-semibold">Footwear</span>
                          <p className="font-bold text-[var(--text-primary)] truncate">
                            {msg.embeddedCard.details.shoesName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. EMBEDDED EVENT & TRANSIT CARD */}
                {!isUser && msg.embeddedCard?.type === "event" && (
                  <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                      <Train className="w-4 h-4 text-emerald-500" />
                      <span>{msg.embeddedCard.title}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Departure Time</span>
                        <p className="font-bold text-[var(--text-primary)]">
                          {msg.embeddedCard.details.departureTime}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Transit Duration</span>
                        <p className="font-bold text-[var(--text-primary)]">
                          {msg.embeddedCard.details.duration} ({msg.embeddedCard.details.cost})
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EMBEDDED FINANCIAL SUMMARY CARD */}
                {!isUser && msg.embeddedCard?.type === "finance" && (
                  <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                        <span>{msg.embeddedCard.title}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Remaining</span>
                        <p className="font-bold text-emerald-500 text-sm">
                          ₹{msg.embeddedCard.details.remaining?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Spent This Month</span>
                        <p className="font-bold text-amber-500 text-sm">
                          ₹{msg.embeddedCard.details.spent?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.5 MULTI-DOMAIN COMPOUND CARD */}
                {!isUser && msg.embeddedCard?.type === "multi_domain" && (
                  <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                        <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                        <span>{msg.embeddedCard.title}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        {msg.embeddedCard.subtitle}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {msg.embeddedCard.details.eventTitle && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-[var(--text-muted)] block">Event</span>
                          <p className="font-bold text-[var(--text-primary)] truncate">
                            {msg.embeddedCard.details.eventTitle}
                          </p>
                        </div>
                      )}
                      {msg.embeddedCard.details.topItem && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-muted)] block">Outfit Top</span>
                          <p className="font-bold text-[var(--primary)] truncate">
                            {msg.embeddedCard.details.topItem}
                          </p>
                        </div>
                      )}
                      <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Remaining Budget</span>
                        <p className="font-bold text-emerald-500">
                          ₹{msg.embeddedCard.details.remainingBudget?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ACTION CONFIRMATION CARD (For Write Operations) */}
                {!isUser && msg.pendingAction && msg.pendingAction.status === "pending" && (
                  <div className="p-4 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--primary)]">
                      <Zap className="w-4 h-4" />
                      <span>{msg.pendingAction.title}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {msg.pendingAction.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleExecuteAction(msg.id, msg.pendingAction!)}
                        isLoading={executingActionId === msg.pendingAction.id}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Confirm &amp; Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelAction(msg.id)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Suggested Action Chips */}
                {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleActionClick(action)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--surface-soft)] hover:bg-[var(--primary-soft)] text-[var(--text-secondary)] hover:text-[var(--primary)] border border-[var(--border)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{action.label}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm font-bold text-xs">
                  {user?.name?.[0] || "U"}
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl rounded-bl-xs p-4 space-y-2 max-w-[75%] shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>OP AI is reasoning across your schedule and wardrobe...</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 flex-shrink-0 no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isThinking}
            className="px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--primary)] border border-[var(--border)] text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex-shrink-0 shadow-xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 border border-[var(--border)] rounded-3xl bg-[var(--surface)] p-2 shadow-md flex-shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask OP AI (e.g. 'What should I wear tomorrow?', 'Add ₹450 for lunch')..."
          disabled={isThinking}
          className="flex-1 px-4 py-2 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isThinking}
          className="p-3 rounded-2xl bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-sm flex-shrink-0"
          aria-label="Send query to OP AI"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
