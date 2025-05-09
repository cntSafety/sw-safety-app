import React, { useState } from 'react';
import { Upload, Button, Card, Typography, Space, message } from 'antd';
import { UploadOutlined, FileOutlined, PlusOutlined } from '@ant-design/icons';
import { UploadFile } from 'antd/es/upload/interface';
import './ArxmlImporter.css';

const { Title } = Typography;
const { Dragger } = Upload;

const ArxmlImporter = ({ onFileImported }) => {
  const [fileList, setFileList] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentFile, setCurrentFile] = useState(null);

  const beforeUpload = (file) => {    const isXML = file.name.endsWith('.arxml') || file.type === 'application/xml';

    if (!isXML) {
      messageApi.error('You can only upload ARXML or XML files!');
      return false;
    }

    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target && typeof e.target.result === 'string') {
          const content = e.target.result;
          
          // Process the content
          const parsedContent = parseArxmlContent(content);
          
          // Notify parent component about the imported file
          const fileData = {
            id: Date.now().toString(),
            name: file.name,
            content,
            parsedContent
          };
          
          setCurrentFile(fileData);
          onFileImported(fileData);
          
          messageApi.success(`${file.name} imported successfully`);
        }
      } catch (error) {
        messageApi.error(`Error parsing ${file.name}: ${error}`);
      }
    };

    reader.readAsText(file);

    // Prevent default upload behavior
    return false;
  };

  const parseArxmlContent = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Convert XML document to a more manageable JSON structure
    return convertXmlToJson(xmlDoc.documentElement);
  };

  const convertXmlToJson = (node) => {
    const result = {
      nodeName: node.nodeName,
      attributes: {},
      children: []
    };

    // Add attributes
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        result.attributes[attr.nodeName] = attr.nodeValue;
      }
    }

    // Add child nodes
    node.childNodes.forEach((childNode) => {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        result.children.push(convertXmlToJson(childNode));
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        const text = childNode.nodeValue?.trim();
        if (text && text.length > 0) {
          result.textContent = text;
        }
      }
    });

    return result;
  };  return (
    <div className="arxml-importer-container">
      {contextHolder}
      <Card>
        <Title level={3}>Import ARXML File</Title>
        
        {currentFile ? (
          <div className="file-imported">
            <div className="file-success">
              <FileOutlined className="file-icon" />
              <div className="file-info">
                <div className="file-name">{currentFile.name}</div>
                <div className="file-status">Successfully imported</div>
              </div>
              <Button 
                type="link" 
                onClick={() => setCurrentFile(null)}
                style={{ marginLeft: 'auto' }}
              >
                Import Another File
              </Button>
            </div>
          </div>
        ) : (
          <Dragger
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={({ fileList }) => setFileList(fileList)}
            multiple={false}
            accept=".arxml,.xml"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag ARXML files to this area to import</p>
            <p className="ant-upload-hint">
              Support for importing AUTOSAR XML (.arxml) files
            </p>
          </Dragger>
        )}
      </Card>
    </div>
  );
};

export default ArxmlImporter;
