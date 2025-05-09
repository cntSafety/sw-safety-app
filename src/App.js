import React, { useEffect } from 'react';
import { ConfigProvider, App as AntApp, message } from 'antd';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainMenu } from './components';
import { HomePage, ArxmlImportPage, ArxmlViewPage } from './pages';
import './App.css';

// Wrapper component for navigation
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  
  // Use effect to ensure components mount properly
  useEffect(() => {
    // Show a loading message that gets cleared when component mounts
    const timer = setTimeout(() => {
      messageApi.success('Application loaded successfully!', 1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname, messageApi]);
  
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="app-container">
      {contextHolder}
      <MainMenu onNavigate={handleNavigate} />
      <main className="main-content">
        <div className="app-content">
          <div className="route-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/import-arxml" element={<ArxmlImportPage />} />
              <Route path="/view-arxml" element={<ArxmlViewPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AntApp>
        <Router>
          <AppContent />
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
