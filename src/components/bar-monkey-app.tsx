"use client";

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, GlassWater, Loader2, Menu, X } from "lucide-react";
import type { InventoryItem } from '@/lib/db';

export function BarMonkeyApp() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [greeting, setGreeting] = useState("Ready to mix, Assaf?");
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // min-h classes handle base height, this expands it based on content up to 200px
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);
  const { messages, sendMessage, error, status } = useChat({
    onFinish: () => {
      fetchInventory();
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.items) setInventory(data.items);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
    
    const greetings = [
      "Cheers Assaf, ready to mix?",
      "What are you drinking today, Assaf?",
      "Assaf! Let's shake something up.",
      "Welcome back to your bar, Assaf.",
      "Hey Assaf, what's on the menu?"
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative font-sans text-foreground overscroll-none">
      
      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Inventory */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-white/95 backdrop-blur-xl shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] 
        border-r border-border flex flex-col shrink-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:relative
      `}>
        <div className="p-4 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-2">
            <GlassWater className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg text-foreground tracking-wide">Your Bar</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
              {inventory.length}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-8 w-8 text-muted-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-hide">
          <div className="space-y-3">
            {inventory.length === 0 ? (
              <div className="text-sm text-muted-foreground italic p-4 text-center rounded-2xl bg-secondary border border-border">
                Bar is empty. Tell Bar Monkey what you have!
              </div>
            ) : (
              inventory.map((item) => (
                <div key={item.id} className="flex flex-col p-3 rounded-2xl bg-white shadow-sm border border-border hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <span className="font-semibold text-sm text-foreground">{item.item_name}</span>
                    <span className="text-xs font-bold bg-secondary text-foreground px-2 py-1 rounded-md">
                      {item.quantity} {item.unit !== 'units' ? item.unit : ''}
                    </span>
                  </div>
                  <span className="relative z-10 text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">{item.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative bg-background">
        
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 absolute top-0 w-full z-10 glass rounded-b-2xl md:rounded-b-3xl mx-auto max-w-4xl left-0 right-0 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-x border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center justify-center flex-1 gap-2 md:gap-3">
            <img src="/logo.png" alt="Bar Monkey" className="w-8 h-8 md:w-10 md:h-10 object-contain mix-blend-multiply contrast-[1.15] brightness-[1.05]" />
            <h1 className="text-base md:text-xl font-black tracking-tight text-foreground uppercase truncate">
              Bar Monkey
            </h1>
          </div>
          
          <div className="w-10 md:hidden" /> {/* Spacer for centering logo on mobile */}
        </header>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto pt-24 pb-32 px-4 md:px-8 scroll-smooth" ref={scrollRef}>
          <div className="w-full max-w-3xl flex flex-col gap-6">
            
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative mb-6">
                  {/* Glowing background behind logo matching the cream/orange vibe */}
                  <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 to-transparent blur-3xl rounded-full"></div>
                  <img src="/logo.png" alt="Bar Monkey Logo" className="relative w-40 h-40 md:w-48 md:h-48 object-contain mix-blend-multiply contrast-[1.15] brightness-[1.05]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-center mb-6 tracking-tight text-foreground">
                  {greeting}
                </h2>
                <div className="flex gap-3 text-sm font-medium w-full max-w-md justify-center flex-wrap">
                  <span className="bg-white shadow-sm px-4 py-2 rounded-full border border-border cursor-pointer hover:border-primary hover:text-primary transition-colors text-foreground" onClick={() => setInput("Add a bottle of Gin")}>+ Add Gin</span>
                  <span className="bg-white shadow-sm px-4 py-2 rounded-full border border-border cursor-pointer hover:border-primary hover:text-primary transition-colors text-foreground" onClick={() => setInput("What can I make with my inventory?")}>🍸 Recipe Ideas</span>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`flex gap-2 md:gap-3 max-w-[92%] md:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {message.role === 'user' ? (
                    <Avatar className={`w-8 h-8 md:w-10 md:h-10 shrink-0 border shadow-sm border-primary/30`}>
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">ME</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
                      <img src="/logo.png" alt="Bar Monkey" className="w-full h-full object-contain mix-blend-multiply contrast-[1.15] brightness-[1.05]" />
                    </div>
                  )}
                  
                  {/* Bubble */}
                  <div className={`rounded-3xl p-5 shadow-sm border ${message.role === 'user' ? 'bg-primary text-primary-foreground border-primary rounded-tr-sm' : 'bg-white text-foreground border-border rounded-tl-sm'}`}>
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                      {message.parts.filter(p => p.type === 'text').map(p => p.text).join('') || (
                        <span className="italic text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary"/> Let me check...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full left-0 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-6 md:pb-8 px-4 z-20">
          <form 
            className="max-w-3xl mx-auto relative flex items-center" 
            onSubmit={(e) => {
              e.preventDefault();
              if (!input?.trim() || isLoading) return;
              sendMessage({ text: input });
              setInput("");
            }}
          >
            <div className="relative w-full flex items-center shadow-2xl rounded-full">
              <textarea 
                ref={textareaRef}
                placeholder="Ask your Bar Monkey..." 
                className="w-full resize-none py-4 md:py-5 bg-white hover:bg-white/90 focus:bg-white transition-colors border border-border min-h-[56px] md:min-h-[64px] max-h-[200px] overflow-y-auto rounded-[32px] pr-16 pl-6 text-base md:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground font-medium shadow-sm leading-tight"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!input?.trim() || isLoading) return;
                    sendMessage({ text: input });
                    setInput("");
                  }
                }}
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !input?.trim()} 
                className="absolute right-2 w-10 md:w-12 h-10 md:h-12 rounded-full shrink-0 transition-transform active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-4 font-semibold tracking-wide uppercase">
            Bar Monkey Inventory Assistant
            {error && <div className="text-destructive mt-2 lowercase">⚠️ {error.message || "Failed to connect. Make sure your API key (GOOGLE_GENERATIVE_AI_API_KEY) is in .env.local and valid!"}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
