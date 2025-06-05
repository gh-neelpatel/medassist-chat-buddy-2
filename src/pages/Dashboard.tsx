
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import DashboardCards from "@/components/DashboardCards";
import HealthSummary from "@/components/HealthSummary";
import ChatInterface from "@/components/ChatInterface";

const Dashboard = () => {
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
          <div className="container max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, Neel</h1>
                <p className="text-muted-foreground">Here's an overview of your health</p>
              </div>
              <Button size="icon" variant="outline" className="md:hidden" onClick={toggleSidebar}>
                <Menu size={20} />
              </Button>
            </div>
            
            <div className="space-y-6">
              <DashboardCards />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthSummary />
                <ChatInterface />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

