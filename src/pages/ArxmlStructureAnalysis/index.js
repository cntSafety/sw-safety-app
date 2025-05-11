import React from 'react';
import { Typography, Divider } from 'antd';
import { ArxmlImporter, ArxmlStructureAnalyzer } from '../../components';
import './ArxmlStructureAnalysis.css';

const { Title, Paragraph } = Typography;

/**
 * ARXML Structure Analysis page
 * Provides tools for analyzing and visualizing ARXML file structures
 */
const ArxmlStructureAnalysis = () => {
  const [arxmlData, setArxmlData] = React.useState(null);
  const [fileName, setFileName] = React.useState('');

  // Handle file import
  const handleFileImported = (fileData) => {
    if (fileData && fileData.parsedContent) {
      setArxmlData(fileData.parsedContent);
      setFileName(fileData.name);
    }
  };

  return (
    <div className="arxml-structure-analysis-container">
      <Typography>
        <Title level={2}>ARXML Structure Analysis</Title>
        <Paragraph>
          Import an ARXML file to analyze its structure and get statistical information about the components,
          packages, and other elements contained within it.
        </Paragraph>
      </Typography>
      
      <Divider />
      
      {/* File importer component */}
      <ArxmlImporter onFileImported={handleFileImported} />
      
      <Divider />
      
      {/* Structure analyzer component */}
      <ArxmlStructureAnalyzer arxmlData={arxmlData} fileName={fileName} />
    </div>
  );
};

export default ArxmlStructureAnalysis;
