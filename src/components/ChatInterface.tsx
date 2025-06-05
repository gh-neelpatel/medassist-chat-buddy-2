
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm MedAssist, your personal healthcare assistant. How can I help you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample quick replies
  const quickReplies = [
    "What's in my health record?",
    "Find a doctor near me",
    "Remind me about my medications",
    "I need an appointment"
  ];

  // Simulate sending a message to the assistant
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate assistant response
    setTimeout(() => {
      let responseText = '';
      
      if (input.toLowerCase().includes('health record') || input.toLowerCase().includes('health summary')) {
        responseText = "Based on your health records, you were diagnosed with hypertension in December 2023. You are currently on 2 medications. Your last check-up was on April 10, 2024.";
      } else if (input.toLowerCase().includes('doctor') || input.toLowerCase().includes('specialist')) {
        responseText = "Based on your symptoms, I recommend consulting a cardiologist. Would you like me to find cardiologists near you?";
      } else if (input.toLowerCase().includes('medication') || input.toLowerCase().includes('medicine')) {
        responseText = "You have 2 active medications: Lisinopril (10mg, once daily) and Atorvastatin (20mg, once daily). Your next Lisinopril dose is due today at 8:00 PM.";
      } else if (input.toLowerCase().includes('appointment')) {
        responseText = "I can help you schedule an appointment. What type of doctor would you like to see, and when are you available?";
      } else {
        responseText = "I understand you need assistance. Could you provide more details about what you're looking for? I can help with health records, finding doctors, medication reminders, or scheduling appointments.";
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Handle quick reply click
  const handleQuickReplyClick = (reply: string) => {
    setInput(reply);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-gray-50 rounded-lg border overflow-hidden">
      <div className="bg-white p-4 border-b">
        <h2 className="text-lg font-semibold text-primary">MedAssist Chat</h2>
        <p className="text-sm text-muted-foreground">Ask me anything about your health</p>
      </div>
      
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex",
                message.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  message.sender === 'user' 
                    ? "message-bubble-user animate-fade-in" 
                    : "message-bubble-assistant animate-fade-in"
                )}
              >
                <p>{message.text}</p>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="message-bubble-assistant">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse-slow"></div>
                  <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse-slow delay-150"></div>
                  <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse-slow delay-300"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-2 bg-white border-t">
        <div className="flex flex-wrap gap-2 mb-2">
          {quickReplies.map((reply, index) => (
            <Button 
              key={index} 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickReplyClick(reply)}
              className="text-xs"
            >
              {reply}
            </Button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea 
            placeholder="Type your message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-10 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
