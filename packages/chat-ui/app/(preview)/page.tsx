"use client";

import { useEffect, useRef, useState } from "react";
import { DiffusionText } from "@/components/DiffusionText";
import { v4 as uuidv4 } from "uuid";
import { AttachmentIcon } from "@/components/icons";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  isStreaming?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(uuidv4());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: uuidv4(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const botMessageId = uuidv4();
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: "bot", content: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Conversation-ID": conversationId,
        },
        body: JSON.stringify({
          message: input,
          modality: "text",
          conversationId,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "");
              if (dataStr.trim() === "") continue;
              
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "tokenChunk" || parsed.type === "done") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? { ...msg, content: parsed.content, isStreaming: parsed.type !== "done" }
                      : msg
                  )
                );
                
                if (parsed.type === "done") {
                  setIsTyping(false);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: "I'm having trouble generating a response right now. Please try again in a moment.", isStreaming: false }
            : msg
        )
      );
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 h-screen w-full">
      <div className="w-full max-w-3xl flex flex-col justify-between" style={{ height: "calc(100vh - 4rem)" }}>
        
        {/* Message List */}
        <div className="flex flex-col gap-4 overflow-y-auto p-4 flex-grow">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`${
                  message.role === "user"
                    ? "bg-gray-100 text-gray-900 rounded-lg shadow-md p-3 mb-2 max-w-[80%]"
                    : "bg-white text-gray-900 rounded-lg shadow-md p-3 mb-2 max-w-[80%]"
                }`}
              >
                <div className="flex items-center mb-1 font-semibold text-sm">
                  {message.role === "user" ? (
                    <>
                      <img src="https://unpkg.com/lucide-static@latest/icons/user.svg" className="inline-block w-5 h-5 mr-2" alt="User" />
                      You
                    </>
                  ) : (
                    <>
                      <img src="https://unpkg.com/lucide-static@latest/icons/robot.svg" className="inline-block w-5 h-5 mr-2" alt="Bot" />
                      Pauli-Pi
                    </>
                  )}
                </div>
                
                <div className="text-sm">
                  {message.role === "bot" && message.isStreaming ? (
                    <DiffusionText text={message.content} />
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex w-full justify-start">
               <div className="bg-white text-gray-900 rounded-lg shadow-md p-3 mb-2 max-w-[80%] flex items-center">
                 <img src="https://unpkg.com/lucide-static@latest/icons/robot.svg" className="inline-block w-5 h-5 mr-2" alt="Bot" />
                 <span className="animate-pulse flex space-x-1">
                   <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                   <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                   <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                 </span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="w-full p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <button type="button" className="text-gray-500 p-2 hover:text-gray-700">
               <AttachmentIcon aria-hidden="true" />
            </button>
            <input
              type="text"
              className="flex-grow rounded-full bg-gray-100 border-none px-4 py-2 outline-none"
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white rounded-full px-4 py-2 hover:bg-blue-700 transition">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}