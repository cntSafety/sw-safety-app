import React from 'react';
import { SWSafetyAnalysis } from '../../components';
import { Typography } from 'antd';
import './SWSafetyAnalysisPage.css';

const { Title } = Typography;

const SWSafetyAnalysisPage = () => {
  return (
    <div className="sw-safety-analysis-page">
      <Title level={2}>SW Safety Analysis</Title>
      <p className="sw-safety-description">
        Import and analyze software safety analysis JSON data. The tool displays components, 
        their functions, and failure modes with associated risk ratings and ASIL levels...
      </p>
      <SWSafetyAnalysis />
    </div>
  );
};

export default SWSafetyAnalysisPage;
