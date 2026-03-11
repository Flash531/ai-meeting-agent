"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);

  const runAgent = async () => {
    if (!prompt) return;

    const userMessage = prompt;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    setLoading(true);
    setPrompt("");

    try {
      const res = await fetch(`/api/agent?prompt=${encodeURIComponent(userMessage)}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.text || "No response" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error running agent." },
      ]);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-900 via-black to-neutral-950 text-white">

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Meeting Assistant
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Your personal AI that manages emails and schedules meetings.
          </p>
        </div>

        <div className="flex flex-col gap-4">

          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-neutral-500"
            placeholder="Ask something like: check my unread emails"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runAgent();
            }}
          />

          <button
            onClick={runAgent}
            className="rounded-xl bg-white text-black font-medium py-3 transition hover:opacity-90 active:scale-[0.98]"
          >
            Run Agent
          </button>

        </div>

        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl text-sm leading-relaxed border border-white/10 ${
                msg.role === "user"
                  ? "bg-white text-black"
                  : "bg-black/40 text-neutral-200"
              }`}
            >
              <p className="text-xs opacity-70 mb-1">
                {msg.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
          ))}

          {loading && (
            <div className="text-neutral-400 text-sm px-2">Thinking…</div>
          )}
        </div>

      </div>

    </main>
  );
}
