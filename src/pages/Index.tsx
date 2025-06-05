
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';

const Index = () => {
  const navigate = useNavigate();
  
  // Just redirect to the Dashboard component immediately
  useEffect(() => {
    // We could navigate to Dashboard but for simplicity, we'll just render it directly
  }, [navigate]);
  
  return <Dashboard />;
};

export default Index;
