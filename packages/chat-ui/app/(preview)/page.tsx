"use client";

import { useEffect, useRef, useState } from "react";
import { DiffusionText } from "@/components/DiffusionText";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();

    const userMsg: Message = { id: uuidv4(), role: "user", content: userText };
    const botId = uuidv4();
    const botMsg: Message = { id: botId, role: "assistant", content: "", isStreaming: true };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Build history for multi-turn
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Conversation-ID": conversationId,
        },
        body: JSON.stringify({ messages: history, conversationId }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "tokenChunk" || parsed.type === "done") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botId
                    ? { ...msg, content: parsed.content, isStreaming: parsed.type !== "done" }
                    : msg
                )
              );
            }
            if (parsed.type === "done") setIsLoading(false);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botId
            ? { ...msg, content: "Connection error. Please check your API key and try again.", isStreaming: false }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-xs font-bold">P</span>
          </div>
          <span className="text-sm font-medium text-white/80">Pauli-Pi</span>
          <span className="text-xs text-white/30 border border-white/10 rounded px-2 py-0.5">Mercury</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-white/30">Connected</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
              <span className="text-3xl">⚛</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white/90 mb-2">Pauli-Pi</h1>
              <p className="text-sm text-white/40 max-w-sm">
                Powered by Mercury — a diffusion language model. Watch your responses materialize character by character.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md w-full">
              {[
                "Explain quantum superposition",
                "Write a Python async function",
                "What makes diffusion models unique?",
                "Help me debug my React code",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-left text-xs text-white/50 border border-white/10 rounded-xl p-3 hover:border-white/20 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">⚛</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] ${
                    msg.role === "user"
                      ? "bg-white/8 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-3"
                      : "rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="text-sm leading-relaxed text-white/90">
                      {msg.isStreaming && msg.content ? (
                        <DiffusionText text={msg.content} isStreaming={true} />
                      ) : msg.isStreaming && !msg.content ? (
                        <span className="inline-flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ) : (
                        <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 bg-[#0a0a0a] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
            {/* File attach */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-white/30 hover:text-white/60 transition-colors mb-1 flex-shrink-0"
              title="Attach file"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.zip,.txt,.md,.csv,.json,.js,.ts,.py" />

            {/* Textarea */}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Pauli-Pi..."
              className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 resize-none outline-none leading-relaxed max-h-[200px] overflow-y-auto"
              style={{ height: "auto" }}
              disabled={isLoading}
            />

            {/* Send */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-white/90 text-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
            >
              {isLoading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">
            Mercury diffusion model · Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}