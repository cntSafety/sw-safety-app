import React, { useState } from 'react';
import { 
  Table, 
  Upload, 
  Button, 
  message, 
  Typography, 
  Space, 
  Card, 
  Tag,
  Collapse,
  Tooltip,
  Input, // Added Input
  Select  // Added Select
} from 'antd';
import { UploadOutlined, SafetyCertificateOutlined, SearchOutlined } from '@ant-design/icons';
import './SWSafetyAnalysis.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input; // For multi-line inputs
const { Option } = Select; // For Select options

const SWSafetyAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [componentSearchText, setComponentSearchText] = useState('');
  const [functionSearchText, setFunctionSearchText] = useState('');
  const [failureModeSearchText, setFailureModeSearchText] = useState('');
  // Handle file upload
  const handleFileUpload = (file) => {
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setAnalysisData(jsonData);
        message.success('SW Safety Analysis file loaded successfully!');
      } catch (error) {
        message.error('Failed to parse the JSON file. Please check the file format.');
        console.error('Error parsing JSON:', error);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      message.error('Failed to read the file');
      setLoading(false);
    };
    
    reader.readAsText(file);
    return false; // Prevent automatic upload
  };

  // Function to handle changes in component name
  const handleComponentNameChange = (oldComponentName, newComponentName) => {
    if (!newComponentName || newComponentName.trim() === '') {
      message.error("Component name cannot be empty.");
      return;
    }
    if (oldComponentName === newComponentName) {
      return; // No change
    }

    setAnalysisData(prevData => {
      if (!prevData || !prevData.components || !prevData.components[oldComponentName]) {
        console.error("Component to rename not found:", oldComponentName);
        message.error("Failed to rename component: Not found.");
        return prevData;
      }
      if (prevData.components[newComponentName]) {
        message.error(`Component name "${newComponentName}" already exists. Please choose a unique name.`);
        return prevData;
      }

      const componentsCopy = { ...prevData.components };
      const componentDataToMove = componentsCopy[oldComponentName];
      delete componentsCopy[oldComponentName];
      componentsCopy[newComponentName] = componentDataToMove;
      
      // Update expandedRowKeys if the old component name was part of any key
      const newExpandedRowKeys = expandedRowKeys.map(key => 
        key.startsWith(oldComponentName) ? key.replace(oldComponentName, newComponentName) : key
      );
      setExpandedRowKeys(newExpandedRowKeys);

      return { ...prevData, components: componentsCopy };
    });
    message.success(`Component "${oldComponentName}" renamed to "${newComponentName}".`);
  };

  // Function to handle changes in function description
  const handleFunctionDescriptionChange = (componentName, funcIdx, newDescription) => {
    setAnalysisData(prevData => {
      if (!prevData || !prevData.components || !prevData.components[componentName] ||
          !prevData.components[componentName].functions ||
          !prevData.components[componentName].functions[funcIdx]) {
        console.error("Invalid path for function description update:", componentName, funcIdx);
        message.error("Failed to update function description: Invalid path.");
        return prevData;
      }

      const newFunctions = prevData.components[componentName].functions.map((fn, fIdx) => {
        if (fIdx === funcIdx) {
          return { ...fn, description: newDescription };
        }
        return fn;
      });

      const newComponents = {
        ...prevData.components,
        [componentName]: {
          ...prevData.components[componentName],
          functions: newFunctions
        }
      };
      return { ...prevData, components: newComponents };
    });
  };

  // Function to handle changes in failure mode fields
  const handleFailureModeChange = (componentName, funcIdx, failureModeIdx, fieldName, value) => {
    setAnalysisData(prevData => {
      if (!prevData || !prevData.components || !prevData.components[componentName] ||
          !prevData.components[componentName].functions ||
          !prevData.components[componentName].functions[funcIdx] ||
          !prevData.components[componentName].functions[funcIdx].failureModes ||
          !prevData.components[componentName].functions[funcIdx].failureModes[failureModeIdx]) {
        console.error("Invalid path for update:", componentName, funcIdx, failureModeIdx, fieldName);
        message.error("Failed to update data: Invalid path.");
        return prevData; 
      }

      const newFunctions = prevData.components[componentName].functions.map((fn, fIdx) => {
        if (fIdx === funcIdx) {
          const newFailureModes = fn.failureModes.map((fm, fmIdx) => {
            if (fmIdx === failureModeIdx) {
              return { ...fm, [fieldName]: value };
            }
            return fm;
          });
          return { ...fn, failureModes: newFailureModes };
        }
        return fn;
      });

      const newComponents = {
        ...prevData.components,
        [componentName]: {
          ...prevData.components[componentName],
          functions: newFunctions
        }
      };
      return { ...prevData, components: newComponents };
    });
  };

  // Function to save analysis data to a JSON file
  const handleSaveToFile = async () => { // Changed to async function
    if (!analysisData) {
      message.error('No data to save.');
      return;
    }

    const currentMetadata = analysisData.metadata || {};
    const metadataForFile = {
      ...currentMetadata,
      exportDate: new Date().toISOString(),
    };

    const dataToSaveInFile = {
      metadata: metadataForFile,
      components: analysisData.components 
    };

    const jsonString = JSON.stringify(dataToSaveInFile, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    if (window.showSaveFilePicker) { // Check if the API is available
      try {
        const options = {
          suggestedName: 'sw_safety_analysis_edited.json',
          types: [
            {
              description: 'JSON Files',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
        };
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        message.success('File saved successfully.');
      } catch (err) {
        // Handle errors, e.g., user cancellation
        if (err.name !== 'AbortError') {
          console.error('Error saving file:', err);
          message.error('Failed to save file.');
        } else {
          message.info('Save operation cancelled.');
        }
      }
    } else {
      // Fallback for browsers that do not support showSaveFilePicker
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sw_safety_analysis_edited.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Data saved to sw_safety_analysis_edited.json (download initiated).');
      message.info('Your browser does not support direct save location choice. File downloaded to default location.');
    }
  };

  // Function to render risk rating with appropriate color
  const renderRiskRating = (rating) => {
    let color = '';
    if (rating.toLowerCase() === 'high') {
      color = 'sw-safety-risk-high';
    } else if (rating.toLowerCase() === 'medium') {
      color = 'sw-safety-risk-medium';
    } else if (rating.toLowerCase() === 'low') {
      color = 'sw-safety-risk-low';
    }
    
    return <span className={color}>{rating}</span>;
  };

  // Function to filter component data based on search criteria
  const getFilteredData = () => {
    const rawData = processAnalysisData();
    
    return rawData.filter(component => {
      // Filter by component name
      const matchesComponent = componentSearchText === '' || 
        component.componentName.toLowerCase().includes(componentSearchText.toLowerCase());
      
      if (!matchesComponent) return false;
      
      // Filter functions
      const filteredFunctions = component.functions.filter(func => {
        // Check if function description matches the search text
        const matchesFunction = functionSearchText === '' || 
          (func.description && func.description.toLowerCase().includes(functionSearchText.toLowerCase()));
        
        if (!matchesFunction) return false;
        
        // Check if any failure mode matches the search text
        if (failureModeSearchText !== '') {
          return func.failureModes.some(mode => 
            (mode.mode && mode.mode.toLowerCase().includes(failureModeSearchText.toLowerCase())) ||
            (mode.effect && mode.effect.toLowerCase().includes(failureModeSearchText.toLowerCase())) ||
            (mode.notes && mode.notes.toLowerCase().includes(failureModeSearchText.toLowerCase()))
          );
        }
        
        return true;
      });
        // If functions match criteria, create a new component object with filtered functions
      if (filteredFunctions.length > 0) {
        // Create a new object to avoid modifying the original
        const newComponent = { ...component };
        newComponent.functions = filteredFunctions;
        Object.assign(component, newComponent);
        return true;
      }
      
      // If failureModeSearchText is empty but functionSearchText filtered out all functions, don't show component
      return failureModeSearchText === '' && functionSearchText === '';
    });
  };

  // Columns for the top-level component table
  const componentColumns = [
    {
      title: 'Component',
      dataIndex: 'componentName',
      key: 'componentName',
      width: '25%',
      sorter: (a, b) => a.componentName.localeCompare(b.componentName),
      render: (text, record) => (
        <Input
          value={text} // text is record.componentName
          onBlur={(e) => {
            if (text !== e.target.value.trim()) {
              handleComponentNameChange(text, e.target.value.trim());
            }
          }}
          onPressEnter={(e) => {
            if (text !== e.target.value.trim()) {
              e.preventDefault();
              handleComponentNameChange(text, e.target.value.trim());
              e.target.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()} // Prevent filter dropdown from opening
          style={{ width: '100%' }}
        />
      ),
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
          <Input
            placeholder="Search Components"
            value={componentSearchText}
            onChange={e => setComponentSearchText(e.target.value)}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
            allowClear
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button 
              onClick={() => {
                setComponentSearchText('');
                confirm();
              }} 
              size="small" style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: () => <SearchOutlined style={{ color: componentSearchText ? '#1890ff' : undefined }} />,
    },
    {
      title: 'Functions',
      dataIndex: 'functionsCount',
      key: 'functionsCount',
      width: '15%',
      render: (text) => <Tag color="blue">{text}</Tag>,
      sorter: (a, b) => a.functionsCount - b.functionsCount,
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
          <Input
            placeholder="Search Functions"
            value={functionSearchText}
            onChange={e => setFunctionSearchText(e.target.value)}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
            allowClear
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button 
              onClick={() => {
                setFunctionSearchText('');
                confirm();
              }} 
              size="small" style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: () => <SearchOutlined style={{ color: functionSearchText ? '#1890ff' : undefined }} />,
    },
    {
      title: 'Failure Modes',
      dataIndex: 'failureModesCount',
      key: 'failureModesCount',
      width: '15%',
      render: (text) => <Tag color="orange">{text}</Tag>,
      sorter: (a, b) => a.failureModesCount - b.failureModesCount, // Corrected sorter logic from b.functionsCount
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
          <Input
            placeholder="Search Failure Modes"
            value={failureModeSearchText}
            onChange={e => setFailureModeSearchText(e.target.value)}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
            allowClear
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button 
              onClick={() => {
                setFailureModeSearchText('');
                confirm();
              }} 
              size="small" style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: () => <SearchOutlined style={{ color: failureModeSearchText ? '#1890ff' : undefined }} />,
    },
    {
      title: 'Highest Risk',
      dataIndex: 'highestRisk',
      key: 'highestRisk',
      width: '15%',
      render: (text) => renderRiskRating(text),
      sorter: (a, b) => {
        const riskLevels = { 'high': 3, 'medium': 2, 'low': 1 };
        return riskLevels[a.highestRisk.toLowerCase()] - riskLevels[b.highestRisk.toLowerCase()];
      },
    },
    {
      title: 'Highest ASIL',
      dataIndex: 'highestASIL',
      key: 'highestASIL',
      width: '15%',
      render: (asil) => {
        let color = 'default';
        if (asil === 'D') color = 'red';
        else if (asil === 'C') color = 'orange';
        else if (asil === 'B') color = 'gold';
        else if (asil === 'A') color = 'green';
        
        return <Tag color={color}>{asil}</Tag>;
      },
      sorter: (a, b) => {
        const asilLevels = { 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'QM': 0 };
        return asilLevels[a.highestASIL] - asilLevels[b.highestASIL];
      },
    },
  ];

  // Columns for the nested failure modes table
  const failureModesColumns = [    {
      title: 'Failure Mode',
      dataIndex: 'mode',
      key: 'mode',
      width: '15%',
      render: (text) => (
        <Tooltip title={text} placement="topLeft" overlayStyle={{ maxWidth: '500px' }}>
          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {text}
          </div>
        </Tooltip>
      ),
    },{
      title: 'Effect',
      dataIndex: 'effect',
      key: 'effect',
      width: '16%',
      render: (text) => (
        <Tooltip title={text} placement="topLeft" overlayStyle={{ maxWidth: '500px' }}>
          <div style={{ whiteSpace: 'normal', overflowWrap: 'break-word', maxWidth: '100%' }}>
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Initial Risk',
      dataIndex: 'initialRiskRating',
      key: 'initialRiskRating',
      width: '10%',
      render: (text) => renderRiskRating(text),
    },
    {
      title: 'ASIL',
      dataIndex: 'asil',
      key: 'asil',
      width: '5%',
      render: (asil) => {
        let color = 'default';
        if (asil === 'D') color = 'red';
        else if (asil === 'C') color = 'orange';
        else if (asil === 'B') color = 'gold';
        else if (asil === 'A') color = 'green';
        
        return <Tag color={color}>{asil}</Tag>;
      },
    },    {
      title: 'Development Measures',
      dataIndex: 'developmentMeasures',
      key: 'developmentMeasures',
      width: '12%',
      render: (text) => (
        <Tooltip title={text} placement="topLeft" overlayStyle={{ maxWidth: '500px' }}>
          <div style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Runtime Measures',
      dataIndex: 'runtimeMeasures',
      key: 'runtimeMeasures',
      width: '12%',
      render: (text) => (
        <Tooltip title={text} placement="topLeft" overlayStyle={{ maxWidth: '500px' }}>
          <div style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Final Risk',
      dataIndex: 'finalRiskRating',
      key: 'finalRiskRating',
      width: '10%',
      render: (text) => renderRiskRating(text),
    },    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: '20%',
      render: (text) => (
        <Tooltip title={text} placement="topLeft" overlayStyle={{ maxWidth: '500px' }}>
          <div style={{ whiteSpace: 'normal', overflowWrap: 'break-word', maxWidth: '100%' }}>
            {text}
          </div>
        </Tooltip>
      ),
    },
  ];

  // Process the data for display in the table
  const processAnalysisData = () => {
    if (!analysisData || !analysisData.components) {
      return [];
    }
    
    return Object.entries(analysisData.components).map(([componentName, componentData], index) => {
      // Count total failure modes across all functions
      let failureModesCount = 0;
      let highestRisk = 'Low';
      let highestASIL = 'QM';

      // ASIL priority order (high to low): D, C, B, A, QM
      const asilPriority = { 'D': 5, 'C': 4, 'B': 3, 'A': 2, 'QM': 1 };
      // Risk priority order (high to low): High, Medium, Low
      const riskPriority = { 'High': 3, 'Medium': 2, 'Low': 1 };

      const functions = componentData.functions.map((func, funcIdx) => {
        failureModesCount += func.failureModes ? func.failureModes.length : 0;

        // Check for highest risk and ASIL across all failure modes
        if (func.failureModes) {
          func.failureModes.forEach(mode => {
            // Check for highest risk
            if (mode.finalRiskRating && 
                riskPriority[mode.finalRiskRating] > riskPriority[highestRisk]) {
              highestRisk = mode.finalRiskRating;
            }
            
            // Check for highest ASIL
            if (mode.asil && 
                asilPriority[mode.asil] > asilPriority[highestASIL]) {
              highestASIL = mode.asil;
            }
          });
        }

        return {
          ...func,
          key: `${componentName}-func-${funcIdx}`,
          failureModes: func.failureModes || []
        };
      });

      return {
        key: `component-${index}`,
        componentName,
        functionsCount: functions.length,
        failureModesCount,
        highestRisk,
        highestASIL,
        functions
      };
    });
  };
  // Expandable row rendering for functions
  const expandedRowRender = (record) => {
    // record is a component from processAnalysisData, contains componentName
    // func is a function object from processAnalysisData, func.key contains original funcIdx
    // mode is a failureMode object, idx is its index in func.failureModes
    return (
      <Collapse>
        {record.functions.map((func) => {
          const funcIdx = parseInt(func.key.split('-func-')[1]);
          return (
            <Panel 
              header={
                // Replaced Space with a div structure for better width control
                <div style={{ width: '100%', display: 'flex', alignItems: 'start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}> {/* This div will expand */}
                    <Text
                      editable={{
                        onChange: (newDescription) => {
                          handleFunctionDescriptionChange(record.componentName, funcIdx, newDescription);
                        },
                        tooltip: 'Click to edit function description',
                        autoSize: { minRows: 1, maxRows: 5 }
                      }}
                      style={{ width: '100%', display: 'block' }}
                      onClick={(e) => e.stopPropagation()} // Prevent panel from toggling
                    >
                      {func.description || 'No description (click to add)'}
                    </Text>
                  </div>
                  {/* The Tag for failure mode count was previously removed, kept out */}
                </div>
              } 
              key={func.key}
            >
              <Collapse>
                {func.failureModes.map((mode, idx) => (
                  <Panel
                    key={`${func.key}-mode-${idx}`}
                    header={
                      <div style={{ width: '100%', display: 'flex', alignItems: 'baseline' }}>
                        <Text strong style={{ marginRight: '16px' }}>Failure Mode {idx + 1}:</Text> {/* Increased marginRight to 16px */}
                        <div style={{ flex: 1, minWidth: 0 }}> {/* This div will expand */}
                          <Text
                            editable={{
                              onChange: (newModeName) => {
                                handleFailureModeChange(record.componentName, funcIdx, idx, 'mode', newModeName.trim());
                              },
                              tooltip: 'Click to edit failure mode name',
                              // autoSize: { minRows: 1, maxRows: 3 } // Optional: if you want auto-sizing for the input
                            }}
                            style={{ width: '100%', display: 'block' }} // Ensure Text takes full width of its container
                            onClick={(e) => e.stopPropagation()} // Prevent panel from toggling
                          >
                            {mode.mode || 'Unnamed Failure Mode'}
                          </Text>
                        </div>
                      </div>
                    }
                  >
                    <Card bordered={false} style={{ marginBottom: 10 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        
                        {/* Effect */}
                        <div className="failure-mode-row">
                          <Text strong>Effect:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <TextArea
                              value={mode.effect || ''}
                              onChange={(e) => handleFailureModeChange(record.componentName, funcIdx, idx, 'effect', e.target.value)}
                              autoSize={{ minRows: 1, maxRows: 5 }}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        
                        {/* Initial Risk Rating */}
                        <div className="failure-mode-row">
                          <Text strong>Initial Risk Rating:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <Select
                              value={mode.initialRiskRating}
                              style={{ width: '100%' }}
                              onChange={(value) => handleFailureModeChange(record.componentName, funcIdx, idx, 'initialRiskRating', value)}
                            >
                              <Option value="High">High</Option>
                              <Option value="Medium">Medium</Option>
                              <Option value="Low">Low</Option>
                            </Select>
                          </div>
                        </div>
                        
                        {/* ASIL */}
                        <div className="failure-mode-row">
                          <Text strong>ASIL:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <Select
                              value={mode.asil}
                              style={{ width: '100%' }}
                              onChange={(value) => handleFailureModeChange(record.componentName, funcIdx, idx, 'asil', value)}
                            >
                              <Option value="D">D</Option>
                              <Option value="C">C</Option>
                              <Option value="B">B</Option>
                              <Option value="A">A</Option>
                              <Option value="QM">QM</Option>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Development Measures */}
                        <div className="failure-mode-row">
                          <Text strong>Development Measures:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <TextArea
                              value={mode.developmentMeasures || ''}
                              onChange={(e) => handleFailureModeChange(record.componentName, funcIdx, idx, 'developmentMeasures', e.target.value)}
                              autoSize={{ minRows: 1, maxRows: 5 }}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        
                        {/* Runtime Measures */}
                        <div className="failure-mode-row">
                          <Text strong>Runtime Measures:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <TextArea
                              value={mode.runtimeMeasures || ''}
                              onChange={(e) => handleFailureModeChange(record.componentName, funcIdx, idx, 'runtimeMeasures', e.target.value)}
                              autoSize={{ minRows: 1, maxRows: 5 }}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                        
                        {/* Final Risk Rating */}
                        <div className="failure-mode-row">
                          <Text strong>Final Risk Rating:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <Select
                              value={mode.finalRiskRating}
                              style={{ width: '100%' }}
                              onChange={(value) => handleFailureModeChange(record.componentName, funcIdx, idx, 'finalRiskRating', value)}
                            >
                              <Option value="High">High</Option>
                              <Option value="Medium">Medium</Option>
                              <Option value="Low">Low</Option>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Notes */}
                        <div className="failure-mode-row">
                          <Text strong>Notes:</Text>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <TextArea
                              value={mode.notes || ''}
                              onChange={(e) => handleFailureModeChange(record.componentName, funcIdx, idx, 'notes', e.target.value)}
                              autoSize={{ minRows: 1, maxRows: 5 }}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </Space>
                    </Card>
                  </Panel>
                ))}
              </Collapse>
            </Panel>
          );
        })}
      </Collapse>
    );
  };

  return (
    <div className="sw-safety-analysis-container">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={3}>
            <SafetyCertificateOutlined /> SW Safety Analysis
          </Title>
          <Space align="start"> {/* Changed Space for buttons, added align="start" */}
            <Upload
              accept=".json"
              beforeUpload={handleFileUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={loading}
                type="primary"
              >
                Upload SW Safety Analysis JSON
              </Button>
            </Upload>
            {analysisData && (
              <Button onClick={handleSaveToFile} type="primary"> {/* Removed marginLeft */}
                Save Changes to JSON
              </Button>
            )}
          </Space>
          
          {analysisData && analysisData.metadata && (
            <Space direction="vertical">
              <Text strong>Export Date: {new Date(analysisData.metadata.exportDate).toLocaleString()}</Text>
              <Text strong>Version: {analysisData.metadata.version}</Text>
            </Space>
          )}
            {analysisData && (
            <>
              <div className="sw-safety-table">
                <Table
                  columns={componentColumns}
                  dataSource={getFilteredData()}
                  expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                    onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
                  }}
                  pagination={false}
                  loading={loading}
                  indentSize={0} // Added to minimize space for expand icon
                />
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default SWSafetyAnalysis;
