import React, { useState, useEffect } from 'react';
import { Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ArxmlViewer } from '../../components';
import './ArxmlView.css';

const { Title } = Typography;

const ArxmlViewPage = () => {
  const navigate = useNavigate();
  const [arxmlData, setArxmlData] = useState(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    // Retrieve the ARXML file data from sessionStorage
    const storedData = sessionStorage.getItem('arxmlFile');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setArxmlData(parsedData.parsedContent);
      setFileName(parsedData.name);
    } else {
      navigate('/import-arxml');
    }
  }, [navigate]);

  const handleBack = () => {
    navigate('/import-arxml');
  };

  return (
    <div className="arxml-view-page">
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
      </div>      <div className="page-content">
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
