"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Role = "user" | "assistant";
type Message = { role: Role; text: string };
type ApiMessage = { role: Role; content: string };

type AgentStep = {
  id: number;
  label: string;
  status: "done" | "active" | "pending";
  icon: string;
};

type MeetingCard = {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendee: string;
  platform: string;
};

type EmailCard = {
  id: number;
  sender: string;
  initials: string;
  subject: string;
  snippet: string;
  time: string;
  tag: string;
};

/* ── Icons ────────────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M15 10l4.55-2.56A1 1 0 0 1 21 8.4v7.2a1 1 0 0 1-1.45.88L15 14"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArielLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect width="26" height="26" rx="7" fill="#6366f1" />
      <rect x="6" y="6" width="6" height="6" rx="1.5" fill="white" />
      <rect x="14" y="6" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.45" />
      <rect x="6" y="14" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.45" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.75" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ── Typing Dots ──────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 18 }}>
      <span className="dot" style={S.dot} />
      <span className="dot" style={S.dot} />
      <span className="dot" style={S.dot} />
    </div>
  );
}

/* ── Message text w/ bold & line breaks ──────────────────── */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </p>
  );
}

const CHIPS = [
  "Check my unread emails",
  "Handle meeting requests",
  "What's on my calendar today?",
  "Schedule a meeting with Farhan",
];

/* Map tool name → human-readable activity label */
const TOOL_LABELS: Record<string, string> = {
  getUnreadEmails:     "Reading Gmail inbox",
  getCalendarEvents:   "Checking calendar availability",
  createCalendarEvent: "Scheduling event",
  sendEmail:           "Sending confirmation email",
  markEmailAsRead:     "Marking email as read",
};

/** Build AgentStep[] from the toolCalls array returned by the API */
function buildStepsFromToolCalls(toolCalls: { toolName: string }[]): AgentStep[] {
  const seen = new Set<string>();
  const steps: AgentStep[] = [];
  let id = 1;

  // If emails were fetched AND calendar/event tools were also used, infer a detection step
  const usedTools = toolCalls.map((t) => t.toolName);
  const fetchedEmails = usedTools.includes("getUnreadEmails");
  const didScheduling = usedTools.some((t) =>
    ["getCalendarEvents", "createCalendarEvent"].includes(t)
  );

  for (const call of toolCalls) {
    const label = TOOL_LABELS[call.toolName];
    if (!label || seen.has(call.toolName)) continue;
    seen.add(call.toolName);

    // Insert "Detecting meeting request" between email fetch and calendar check
    if (call.toolName === "getCalendarEvents" && fetchedEmails && didScheduling && !seen.has("__detect__")) {
      seen.add("__detect__");
      steps.push({ id: id++, label: "Detecting meeting request", status: "done", icon: "✓" });
    }

    steps.push({ id: id++, label, status: "done", icon: "✓" });
  }

  return steps;
}



/* ─────────────────────────────────────────────────────────── */

export default function Home() {
  const [prompt, setPrompt]   = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [steps, setSteps]     = useState<AgentStep[]>([]);
  const [meetings, setMeetings] = useState<MeetingCard[]>([]);
  const [emails, setEmails]   = useState<EmailCard[]>([]);
  const [processingText, setProcessingText] = useState("");

  // Auth state
  const [session, setSession] = useState<{
    loggedIn: boolean;
    profile?: { name?: string; email?: string; picture?: string } | null;
  }>({ loggedIn: false });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const historyRef  = useRef<ApiMessage[]>([]);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch session on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSession(data))
      .catch(() => setSession({ loggedIn: false }));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout");
    setSession({ loggedIn: false });
    setProfileOpen(false);
  }, []);


  /* Show a simple cycling processing message while loading — no fake steps */
  useEffect(() => {
    if (!loading) return;
    const processingMessages = [
      "Ariel is analyzing your inbox…",
      "Scanning for meeting requests…",
      "Checking calendar availability…",
      "Preparing your response…",
    ];
    let pi = 0;
    setProcessingText(processingMessages[0]);
    const textTimer = setInterval(() => {
      pi++;
      setProcessingText(processingMessages[pi % processingMessages.length]);
    }, 1800);
    return () => clearInterval(textTimer);
  }, [loading]);

  const runAgent = async (overrideText?: string) => {
    const userText = (overrideText ?? prompt).trim();
    if (!userText || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setPrompt("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "24px";

    const updatedHistory: ApiMessage[] = [
      ...historyRef.current,
      { role: "user", content: userText },
    ];

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory }),
      });
      const data = await res.json();
      const assistantText = data.text || "No response.";

      historyRef.current = [
        ...updatedHistory,
        { role: "assistant", content: assistantText },
      ];

      // Derive real activity steps from actual tool calls
      const realSteps = buildStepsFromToolCalls(data.toolCalls ?? []);
      setSteps(realSteps);

      // Use pre-shaped email / meeting data from the server
      if (data.emails?.length > 0) {
        setEmails(data.emails);
      }
      if (data.meetings?.length > 0) {
        setMeetings((prev) => [
          ...data.meetings,
          ...prev.filter((m: MeetingCard) => !data.meetings.find((n: MeetingCard) => n.title === m.title)),
        ]);
      }

      setMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    }

    setLoading(false);
    setProcessingText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runAgent();
    }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div style={S.root}>

      {/* ── Top Navigation ─────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <ArielLogo />
          <div>
            <div style={S.navBrand}>Ariel</div>
            <div style={S.navSubtitle}>AI Inbox Assistant</div>
          </div>
        </div>

        <div style={S.navCenter}>
          {loading && (
            <div className="processing" style={S.processingPill}>
              <span style={S.processingDot} />
              {processingText || "Ariel is analyzing your inbox…"}
            </div>
          )}
        </div>

        <div style={S.navRight}>
          <div style={{
            ...S.connectionBadge,
            borderColor: session.loggedIn ? "var(--border-mid)" : "rgba(239,68,68,0.3)",
            color: session.loggedIn ? "var(--text-secondary)" : "#ef4444",
          }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <span className={session.loggedIn ? "ping" : ""} style={{
                ...S.pingRing,
                background: session.loggedIn ? "var(--green)" : "#ef4444",
              }} />
              <span style={{
                ...S.pingDot,
                background: session.loggedIn ? "var(--green)" : "#ef4444",
              }} />
            </div>
            {session.loggedIn ? "Connected to Gmail & Google Calendar" : "Not connected"}
          </div>
          <button style={S.iconBtn} aria-label="Settings">
            <SettingsIcon />
          </button>

          {/* ── Profile / Auth button ── */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              style={{
                ...S.avatarBtn,
                background: session.loggedIn && session.profile?.picture
                  ? "transparent"
                  : "var(--surface-2)",
                overflow: "hidden",
                padding: 0,
              }}
              aria-label="Profile"
              onClick={() => setProfileOpen((o) => !o)}
            >
              {session.loggedIn && session.profile?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.profile.picture}
                  alt={session.profile.name ?? "Profile"}
                  width={32}
                  height={32}
                  style={{ borderRadius: "50%", display: "block" }}
                />
              ) : session.loggedIn ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                  {session.profile?.name?.[0] ?? "U"}
                </span>
              ) : (
                <UserIcon />
              )}
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div style={S.profileDropdown}>
                {session.loggedIn ? (
                  <>
                    <div style={S.dropdownHeader}>
                      <div style={S.dropdownName}>{session.profile?.name ?? "Signed in"}</div>
                      <div style={S.dropdownEmail}>{session.profile?.email}</div>
                    </div>
                    <div style={S.dropdownDivider} />
                    <button
                      style={S.dropdownItem}
                      onClick={handleSignOut}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <SignOutIcon />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <div style={S.dropdownHeader}>
                      <div style={S.dropdownName}>Not signed in</div>
                      <div style={S.dropdownEmail}>Connect your Google account</div>
                    </div>
                    <div style={S.dropdownDivider} />
                    <a
                      href="/api/auth/login"
                      style={{ ...S.dropdownItem, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <GoogleIcon />
                      Sign in with Google
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={S.body}>

        {/* ── Left Panel: Chat ───────────────────────────────── */}
        <section style={S.leftPanel}>

          {/* Chat feed */}
          <div style={S.chatFeed}>
            {isEmpty && (
              <div style={S.emptyState}>
                <div style={S.emptyIconWrap}>
                  <ArielLogo />
                </div>
                <h1 style={S.emptyTitle}>
                  {session.loggedIn
                    ? `Good evening, ${session.profile?.name?.split(" ")[0] ?? "there"}`
                    : "Good evening"}
                </h1>
                <p style={S.emptySub}>
                  Ask Ariel to manage your inbox, handle meeting requests, or check your calendar.
                </p>
                <div style={S.chipsGrid}>
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      className="card-hover"
                      style={S.chip}
                      onClick={() => runAgent(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className="msg-animate"
                style={{
                  ...S.msgRow,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={S.aiAvatar}>
                    <ArielLogo />
                  </div>
                )}
                <div style={msg.role === "user" ? S.userBubble : S.aiBubble}>
                  <MessageText text={msg.text} />
                </div>
                {msg.role === "user" && (
                  <div style={S.userAvatar}>
                    {session.profile?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="msg-animate" style={S.msgRow}>
                <div style={S.aiAvatar}><ArielLogo /></div>
                <div style={S.aiBubble}><TypingDots /></div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={S.inputArea}>
            <div style={S.inputBox}>
              <textarea
                ref={textareaRef}
                style={S.textarea}
                placeholder="Ask Ariel to manage your inbox…"
                rows={1}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  e.target.style.height = "24px";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
              />
              <div style={S.inputActions}>
                <button style={S.micBtn} aria-label="Voice input">
                  <MicIcon />
                </button>
                <button
                  onClick={() => runAgent()}
                  disabled={!prompt.trim() || loading}
                  style={{
                    ...S.sendBtn,
                    opacity: !prompt.trim() || loading ? 0.4 : 1,
                    cursor: !prompt.trim() || loading ? "not-allowed" : "pointer",
                    background: !prompt.trim() || loading ? "var(--surface-3)" : "var(--accent)",
                  }}
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
            <p style={S.inputHint}>
              Press <kbd style={S.kbd}>Enter</kbd> to send · <kbd style={S.kbd}>Shift+Enter</kbd> for new line
            </p>
          </div>
        </section>

        {/* ── Right Panel: Agent Activity ────────────────────── */}
        <aside style={S.rightPanel}>

          {/* Section: Agent Activity Timeline */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <div style={S.sectionLabel}>
                <span style={S.sectionDot} />
                Agent Activity
              </div>
              {loading && (
                <span className="processing" style={S.liveTag}>Live</span>
              )}
            </div>

            <div style={S.timelineList}>
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="step-animate"
                  style={{
                    ...S.timelineItem,
                    animationDelay: `${idx * 0.06}s`,
                  }}
                >
                  <div
                    style={{
                      ...S.stepIcon,
                      background: step.status === "done"
                        ? "var(--green-dim)"
                        : step.status === "active"
                        ? "var(--accent-dim)"
                        : "var(--surface-2)",
                      color: step.status === "done"
                        ? "var(--green)"
                        : step.status === "active"
                        ? "var(--accent)"
                        : "var(--text-muted)",
                      border: step.status === "active"
                        ? "1px solid var(--accent-glow)"
                        : "1px solid transparent",
                    }}
                  >
                    {step.status === "active" ? (
                      <TypingDots />
                    ) : (
                      <CheckIcon size={11} />
                    )}
                  </div>
                  <span
                    style={{
                      ...S.stepLabel,
                      color: step.status === "active"
                        ? "var(--text-primary)"
                        : step.status === "done"
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {step.label}
                  </span>
                  {step.status !== "active" && step.status !== "pending" && (
                    <span style={S.stepTime}>just now</span>
                  )}
                </div>
              ))}
              {!loading && steps.length === 0 && (
                <p style={S.emptyMini}>Activity will appear when Ariel processes a task.</p>
              )}
            </div>
          </div>

          {/* Section: Scheduled Meetings */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <div style={S.sectionLabel}>
                <CalendarIcon />
                Scheduled Meetings
              </div>
              <span style={S.sectionCount}>{meetings.length}</span>
            </div>

            <div style={S.meetingList}>
              {meetings.map((m) => (
                <div key={m.id} className="card-hover" style={S.meetingCard}>
                  <div style={S.meetingTop}>
                    <span style={S.meetingTitle}>{m.title}</span>
                    <span style={S.scheduledBadge}>Scheduled</span>
                  </div>
                  <div style={S.meetingMeta}>
                    <span style={S.metaItem}>
                      <CalendarIcon />
                      {m.date}
                    </span>
                    <span style={S.metaItem}>
                      <ClockIcon />
                      {m.time}
                    </span>
                    <span style={S.metaItem}>
                      <VideoIcon />
                      {m.duration}
                    </span>
                  </div>
                  <div style={S.meetingAttendee}>
                    <div style={S.attendeeAvatar}>
                      {m.attendee.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span style={S.attendeeName}>{m.attendee}</span>
                    <span style={S.attendeePlatform}>{m.platform}</span>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && (
                <p style={S.emptyMini}>Meetings scheduled by Ariel will appear here.</p>
              )}
            </div>
          </div>

          {/* Section: Email Summary */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <div style={S.sectionLabel}>
                <MailIcon />
                Email Summary
              </div>
              <span style={S.sectionCount}>{emails.length}</span>
            </div>

            <div style={S.emailList}>
              {emails.map((em) => (
                <div key={em.id} className="card-hover" style={S.emailRow}>
                  <div style={{
                    ...S.emailAvatar,
                    background: em.tag === "Meeting Request" ? "var(--accent-dim)" : "var(--surface-3)",
                    color: em.tag === "Meeting Request" ? "var(--accent-hover)" : "var(--text-secondary)",
                  }}>
                    {em.initials}
                  </div>
                  <div style={S.emailBody}>
                    <div style={S.emailTop}>
                      <span style={S.emailSender}>{em.sender}</span>
                      <span style={S.emailTime}>{em.time}</span>
                    </div>
                    <div style={S.emailSubject}>{em.subject}</div>
                    <div style={S.emailSnippet}>{em.snippet}</div>
                    {em.tag === "Meeting Request" && (
                      <span style={S.meetingTag}>Meeting Request</span>
                    )}
                  </div>
                </div>
              ))}
              {emails.length === 0 && (
                <p style={S.emptyMini}>Emails will appear here after Ariel reads your inbox.</p>
              )}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Style tokens                                               */
/* ─────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {

  /* ── Shell ── */
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "var(--bg)",
    fontFamily: "var(--font-inter)",
    overflow: "hidden",
  },

  /* ── Top Nav ── */
  nav: {
    height: 56,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
    backdropFilter: "blur(12px)",
    gap: 16,
    zIndex: 10,
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  navBrand: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  navSubtitle: {
    fontSize: 10.5,
    color: "var(--text-muted)",
    letterSpacing: "0.01em",
    lineHeight: 1.2,
  },
  navCenter: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  connectionBadge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 11.5,
    color: "var(--text-secondary)",
    background: "var(--surface)",
    border: "1px solid var(--border-mid)",
    borderRadius: 20,
    padding: "5px 12px",
    letterSpacing: "-0.01em",
  },
  pingRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "var(--green)",
    opacity: 0.7,
  },
  pingDot: {
    position: "absolute",
    inset: 1.5,
    borderRadius: "50%",
    background: "var(--green)",
  },
  processingPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "var(--accent-hover)",
    background: "var(--accent-dim)",
    border: "1px solid var(--accent-glow)",
    borderRadius: 20,
    padding: "5px 14px",
    letterSpacing: "-0.01em",
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--accent)",
    display: "inline-block",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid var(--border-mid)",
    background: "var(--surface-2)",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.15s",
  },

  /* ── Body layout ── */
  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    gap: 0,
  },

  /* ── Left Panel ── */
  leftPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid var(--border)",
    overflow: "hidden",
    minWidth: 0,
  },
  chatFeed: {
    flex: 1,
    overflowY: "auto",
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  /* Empty state */
  emptyState: {
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 14,
    maxWidth: 460,
    paddingBottom: 32,
  },
  emptyIconWrap: {
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.04em",
    color: "var(--text-primary)",
    lineHeight: 1.25,
  },
  emptySub: {
    fontSize: 13,
    color: "var(--text-tertiary)",
    lineHeight: 1.65,
    maxWidth: 380,
  },
  chipsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  chip: {
    padding: "8px 14px",
    borderRadius: 20,
    border: "1px solid var(--border-mid)",
    background: "var(--surface)",
    color: "var(--text-secondary)",
    fontSize: 12,
    fontFamily: "inherit",
    cursor: "pointer",
    letterSpacing: "-0.01em",
  },

  /* Messages */
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
  },
  aiAvatar: {
    flexShrink: 0,
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--accent)",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.02em",
  },
  userBubble: {
    maxWidth: "60%",
    padding: "11px 16px",
    borderRadius: "16px 16px 4px 16px",
    background: "var(--accent)",
    color: "rgba(255,255,255,0.95)",
    fontSize: 13.5,
    lineHeight: 1.65,
    letterSpacing: "-0.01em",
  },
  aiBubble: {
    maxWidth: "72%",
    padding: "11px 16px",
    borderRadius: "4px 16px 16px 16px",
    background: "var(--surface)",
    border: "1px solid var(--border-mid)",
    color: "var(--text-primary)",
    fontSize: 13.5,
    lineHeight: 1.65,
    letterSpacing: "-0.01em",
  },

  /* Typing dot */
  dot: {
    display: "inline-block",
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--text-muted)",
  },

  /* ── Input ── */
  inputArea: {
    padding: "14px 28px 18px",
    borderTop: "1px solid var(--border-soft)",
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  inputBox: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    background: "var(--surface)",
    border: "1px solid var(--border-mid)",
    borderRadius: 14,
    padding: "10px 10px 10px 16px",
    transition: "border-color 0.15s",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    fontSize: 13.5,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    lineHeight: 1.6,
    minHeight: 24,
    maxHeight: 120,
    letterSpacing: "-0.01em",
  },
  inputActions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s, background 0.15s",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  inputHint: {
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center" as const,
    letterSpacing: "0.01em",
  },
  kbd: {
    fontFamily: "inherit",
    fontSize: 10,
    fontWeight: 500,
    background: "var(--surface-2)",
    border: "1px solid var(--border-mid)",
    borderRadius: 4,
    padding: "1px 5px",
    color: "var(--text-tertiary)",
  },

  /* ── Right Panel ── */
  rightPanel: {
    width: 360,
    flexShrink: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    background: "var(--bg-2)",
  },
  sectionCard: {
    padding: "20px 20px",
    borderBottom: "1px solid var(--border)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11.5,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--accent)",
    display: "inline-block",
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "1px 8px",
  },
  liveTag: {
    fontSize: 10,
    fontWeight: 700,
    color: "var(--accent-hover)",
    background: "var(--accent-dim)",
    border: "1px solid var(--accent-glow)",
    borderRadius: 20,
    padding: "2px 8px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },

  /* Timeline */
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  timelineItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 10px",
    borderRadius: 8,
    transition: "background 0.15s",
  },
  stepIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 10,
  },
  stepLabel: {
    fontSize: 12.5,
    letterSpacing: "-0.01em",
    flex: 1,
  },
  stepTime: {
    fontSize: 10.5,
    color: "var(--text-muted)",
    flexShrink: 0,
  },
  emptyMini: {
    fontSize: 12,
    color: "var(--text-muted)",
    textAlign: "center" as const,
    padding: "12px 0",
    lineHeight: 1.6,
  },

  /* Meeting cards */
  meetingList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  meetingCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    cursor: "default",
  },
  meetingTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  meetingTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    lineHeight: 1.3,
  },
  scheduledBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--green)",
    background: "var(--green-dim)",
    borderRadius: 20,
    padding: "2px 8px",
    flexShrink: 0,
    letterSpacing: "0.02em",
  },
  meetingMeta: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11.5,
    color: "var(--text-tertiary)",
  },
  meetingAttendee: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    borderTop: "1px solid var(--border-soft)",
    paddingTop: 8,
  },
  attendeeAvatar: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "var(--accent-dim)",
    color: "var(--accent-hover)",
    fontSize: 9,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  attendeeName: {
    fontSize: 11.5,
    color: "var(--text-secondary)",
    fontWeight: 500,
    flex: 1,
  },
  attendeePlatform: {
    fontSize: 10.5,
    color: "var(--text-muted)",
  },

  /* Email rows */
  emailList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  emailRow: {
    display: "flex",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 8,
    cursor: "default",
    alignItems: "flex-start",
    border: "1px solid transparent",
  },
  emailAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    letterSpacing: "0.02em",
  },
  emailBody: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  emailTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emailSender: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.01em",
  },
  emailTime: {
    fontSize: 10.5,
    color: "var(--text-muted)",
    flexShrink: 0,
  },
  emailSubject: {
    fontSize: 11.5,
    color: "var(--text-secondary)",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emailSnippet: {
    fontSize: 11,
    color: "var(--text-muted)",
    lineHeight: 1.5,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },
  meetingTag: {
    display: "inline-block",
    marginTop: 4,
    fontSize: 9.5,
    fontWeight: 600,
    color: "var(--accent-hover)",
    background: "var(--accent-dim)",
    borderRadius: 20,
    padding: "2px 7px",
    letterSpacing: "0.02em",
  },

  /* ── Profile dropdown ── */
  profileDropdown: {
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    right: 0,
    width: 220,
    background: "var(--surface)",
    border: "1px solid var(--border-mid)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    zIndex: 100,
    overflow: "hidden",
  },
  dropdownHeader: {
    padding: "12px 14px",
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.01em",
  },
  dropdownEmail: {
    fontSize: 11,
    color: "var(--text-muted)",
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  dropdownDivider: {
    height: 1,
    background: "var(--border)",
    margin: "0",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    width: "100%",
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
    transition: "background 0.12s",
  },
};
