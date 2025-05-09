import React, { useState } from 'react';
import { Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ArxmlImporter } from '../../components';
import './ArxmlImport.css';

const { Title } = Typography;

const ArxmlImportPage = () => {
  const navigate = useNavigate();
  const [importedFile, setImportedFile] = useState(null);

  const handleFileImported = (fileData) => {
    setImportedFile(fileData);
    // Store the imported file data in sessionStorage
    sessionStorage.setItem('arxmlFile', JSON.stringify(fileData));
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleViewArxml = () => {
    navigate('/view-arxml');
  };

  return (
    <div className="arxml-import-page">
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginRight: 16 }}
        >
          Back to Home
        </Button>
        <Title level={3}>Import ARXML File</Title>
      </div>

      <div className="page-content">
        <ArxmlImporter onFileImported={handleFileImported} />
      </div>

      <div className="page-actions">
        <Space>
          <Button onClick={handleBack}>Cancel</Button>
          <Button 
            type="primary" 
            onClick={handleViewArxml} 
            disabled={!importedFile}
            icon={<EyeOutlined />}
          >
            View ARXML
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ArxmlImportPage;
