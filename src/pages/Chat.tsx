
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-offwhite">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Chat with MedAssist</h1>
                <p className="text-muted-foreground">Ask anything about your health</p>
              </div>
              <Button size="icon" variant="outline" className="md:hidden" onClick={toggleSidebar}>
                <Menu size={20} />
              </Button>
            </div>
            
            <ChatInterface />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
