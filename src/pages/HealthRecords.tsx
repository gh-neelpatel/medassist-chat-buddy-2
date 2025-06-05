
import React, { useState } from 'react';
import { Menu, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const HealthRecords = () => {
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
                <h1 className="text-2xl md:text-3xl font-bold">Health Records</h1>
                <p className="text-muted-foreground">View and manage your medical history</p>
              </div>
              <Button size="icon" variant="outline" className="md:hidden" onClick={toggleSidebar}>
                <Menu size={20} />
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Your Medical Records</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                This section will display your complete medical history, test results, and diagnoses.
              </p>
              
              <div className="text-center py-10">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Health Records Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We're working on integrating with healthcare providers to bring your medical records online.
                </p>
                <Button>Upload Documents</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HealthRecords;
