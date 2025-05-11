import React, { useState, useEffect } from 'react';
import { Typography, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArxmlViewer } from '../../components';
import './ArxmlView.css';

const { Title } = Typography;

const ArxmlViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [arxmlData, setArxmlData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // First check if data was passed via location state (for large files)
    if (location.state?.arxmlData) {
      setArxmlData(location.state.arxmlData);
      setFileName(location.state.fileName || 'Imported File');
      return;
    }
    
    try {
      // Try to retrieve the ARXML file data from sessionStorage
      const storedData = sessionStorage.getItem('arxmlFile');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setArxmlData(parsedData.parsedContent);
        setFileName(parsedData.name);
      } else {
        messageApi.error('No ARXML data found. Please import a file first.');
        navigate('/import-arxml');
      }
    } catch (error) {
      messageApi.error('Error loading ARXML data: ' + error.message);
      navigate('/import-arxml');
    }
  }, [navigate, location, messageApi]);

  const handleBack = () => {
    navigate('/import-arxml');
  };
  return (
    <div className="arxml-view-page">
      {contextHolder}
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginRight: 16 }}
        >
          Back to Import
        </Button>
        <Title level={3}>
          ARXML Viewer: {fileName}
        </Title>
      </div><div className="page-content">
        {arxmlData ? (
          <ArxmlViewer arxmlData={arxmlData} fileName={fileName} />
        ) : (
          <div className="loading-state">Loading ARXML data...</div>
        )}
      </div>
    </div>
  );
};

export default ArxmlViewPage;
