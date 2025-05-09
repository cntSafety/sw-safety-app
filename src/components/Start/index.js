import React, { useState } from 'react';
import { Button, Typography, Space, Card, Steps, Modal, Layout, Divider } from 'antd';
import { ImportOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
import { FolderAddOutlined } from '@ant-design/icons';
import ArxmlImporter from '../ArxmlImporter';
import ArxmlViewer from '../ArxmlViewer';
import './Start.css';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Header, Content } = Layout;

/**
 * Start component serves as the landing page for the application.
 * It provides an option to import projects.
 */
const Start = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [importedFile, setImportedFile] = useState(null);

  const handleImportProject = () => {
    setShowImportModal(true);
  };

  const handleCloseModal = () => {
    setShowImportModal(false);
    setCurrentStep(0);
    setImportedFile(null);
  };

  const handleFileImported = (fileData) => {
    setImportedFile(fileData);
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ArxmlImporter onFileImported={handleFileImported} />;
      case 1:
        return importedFile ? <ArxmlViewer arxmlData={importedFile.parsedContent} /> : null;
      default:
        return null;
    }
  };
  return (
    <Layout className="start-container">
      <Header style={{ 
        background: '#fff', 
        padding: '0 20px', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ margin: 0 }}>
          <BookOutlined style={{ marginRight: 12 }} />
          Software Safety Analysis Tool
        </Title>
      </Header>
      
      <Content style={{ padding: '50px 20px' }}>
        <Card className="start-card">
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
          
          <Divider />
          
          <Space direction="vertical" size="large" className="button-container">
            <Button 
              type="primary" 
              icon={<ImportOutlined />} 
              size="large"
              onClick={handleImportProject}
            >
              Import ARXML Project
            </Button>
            <Button 
              icon={<FolderAddOutlined />}
              size="large"
            >
              Create New Project
            </Button>          </Space>
        </Card>
      </Content>

      <Modal
        title="Import ARXML Project"
        open={showImportModal}
        onCancel={handleCloseModal}
        width={800}
        footer={[
          <Button key="back" onClick={handleCloseModal}>
            Close
          </Button>,
          currentStep === 0 ? null : (
            <Button 
              key="back_step" 
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
          ),
          currentStep === 1 ? null : (
            <Button 
              key="continue" 
              type="primary" 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 1 || !importedFile}
            >
              Continue
            </Button>
          ),
        ].filter(Boolean)}
      >
        <Steps current={currentStep} style={{ marginBottom: 20 }}>
          <Step title="Import File" icon={<ImportOutlined />} />
          <Step title="View Structure" icon={<FileTextOutlined />} />
        </Steps>
        {renderStepContent()}
      </Modal>
    </Layout>
  );
};

export default Start;
