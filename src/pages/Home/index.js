import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ImportOutlined, FolderAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const { Title, Paragraph, Text } = Typography;

const HomePage = () => {
  const navigate = useNavigate();

  const handleImportArxml = () => {
    navigate('/import-arxml');
  };

  return (
    <div className="home-container">
      <Card className="home-card">
        <Typography>
          <Title level={2}>Welcome to Safety App</Title>
          <Paragraph>
            Get started with your software safety analysis by importing a project.
          </Paragraph>
          <Paragraph>
            <Text type="secondary">
              Import AUTOSAR XML files to analyze software components and their safety aspects.
            </Text>
          </Paragraph>
        </Typography>
        
        <Space direction="vertical" size="large" className="button-container">
          <Button 
            type="primary" 
            icon={<ImportOutlined />} 
            size="large"
            onClick={handleImportArxml}
          >
            Import ARXML Project
          </Button>
          <Button 
            icon={<FolderAddOutlined />}
            size="large"
          >
            Create New Project
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default HomePage;
