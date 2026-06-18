"use client";

import { useState } from "react";
import { Send, Bot, User, Sparkles, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I am CloudPilot AI. How can I help you build your infrastructure today? You can ask me to create a Virtual Machine, a Kubernetes Cluster, or a full Web App infrastructure.",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: input }]);
    setInput("");
    setIsLoading(true);

    // Mock response for now
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "I've generated the Terraform configuration for your request. Would you like to review it before I deploy it to Azure?",
        }
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-screen relative z-10">
      {/* Header */}
      <header className="h-16 border-b border-white/10 glass flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold text-white">AI Infrastructure Architect</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Azure Target
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === "user" ? "bg-primary-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[70%] p-4 rounded-2xl ${
              msg.role === "user" 
                ? "bg-primary-600 text-white rounded-tr-sm" 
                : "glass-panel text-gray-200 rounded-tl-sm"
            }`}>
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass-panel p-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 glass border-t border-white/10">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative flex items-end gap-2 bg-zinc-900 border border-white/10 p-2 rounded-2xl shadow-xl focus-within:border-primary-500/50 transition-colors">
            <button className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
              <Terminal className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="E.g., Create a production-ready Kubernetes cluster..."
              className="w-full bg-transparent border-none focus:ring-0 text-white resize-none max-h-32 py-3 px-2 scrollbar-thin outline-none"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 mr-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            CloudPilot AI can make mistakes. Consider verifying important architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
