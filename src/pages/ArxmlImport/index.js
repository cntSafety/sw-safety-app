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
    
    try {
      // For large files, store only the parsed content and metadata, not the raw content
      const storageData = {
        id: fileData.id,
        name: fileData.name,
        parsedContent: fileData.parsedContent,
        timestamp: Date.now()
      };
      
      // Store the imported file data in sessionStorage
      sessionStorage.setItem('arxmlFile', JSON.stringify(storageData));
    } catch (error) {
      console.error('Error storing ARXML data:', error);
      // If storage fails, we'll still have the data in state
      // and can pass it directly via navigation state
    }
  };

  const handleBack = () => {
    navigate('/');
  };
  const handleViewArxml = () => {
    if (importedFile) {
      try {
        // Check if we can access the sessionStorage data
        const test = sessionStorage.getItem('arxmlFile');
        if (!test) {
          throw new Error('Session storage not available');
        }
        navigate('/view-arxml');
      } catch (error) {
        // If sessionStorage fails, pass the data via navigation state
        navigate('/view-arxml', { 
          state: { 
            arxmlData: importedFile.parsedContent,
            fileName: importedFile.name
          } 
        });
      }
    } else {
      navigate('/view-arxml');
    }
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
