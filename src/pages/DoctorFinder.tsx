
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import DoctorFinder from "@/components/DoctorFinder";

const DoctorFinderPage = () => {
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
          <div className="container max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Find Doctors</h1>
                <p className="text-muted-foreground">Find and connect with healthcare providers</p>
              </div>
              <Button size="icon" variant="outline" className="md:hidden" onClick={toggleSidebar}>
                <Menu size={20} />
              </Button>
            </div>
            
            <DoctorFinder />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorFinderPage;
