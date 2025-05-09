import React, { useState } from 'react';
import { Tree, Typography, Tooltip, Card, Descriptions, Divider, Empty } from 'antd';
import {
  FileTextOutlined,
  AppstoreOutlined,
  TagOutlined,
  BlockOutlined,
  BranchesOutlined,
  ApartmentOutlined,
  ControlOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined,
  FunctionOutlined,
  PartitionOutlined,
  RobotOutlined,
  SettingOutlined
} from '@ant-design/icons';
import './ArxmlViewer.css';

const { Title, Text } = Typography;

// Type for our tree nodes
const ArxmlViewer = ({ arxmlData, fileName = '' }) => {
  const [treeData, setTreeData] = React.useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Function to determine the appropriate icon based on node name
  const getNodeIcon = (nodeName) => {
    const nodeTypes = {
      'AUTOSAR': <FileTextOutlined />,
      'AR-PACKAGES': <AppstoreOutlined />,
      'AR-PACKAGE': <AppstoreOutlined />,
      'ELEMENTS': <BlockOutlined />,
      'APPLICATION-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'SHORT-NAME': <TagOutlined />,
      'PORTS': <BranchesOutlined />,
      'P-PORT-PROTOTYPE': <ApartmentOutlined />,
      'R-PORT-PROTOTYPE': <ApartmentOutlined />,
      'PROVIDED-INTERFACE-TREF': <DeploymentUnitOutlined />,
      'REQUIRED-INTERFACE-TREF': <DeploymentUnitOutlined />,
      'INTERNAL-BEHAVIORS': <RobotOutlined />,
      'SWC-INTERNAL-BEHAVIOR': <ControlOutlined />,
      'EVENTS': <FunctionOutlined />,
      'TIMING-EVENT': <SettingOutlined />,
      'RUNNABLES': <ClusterOutlined />,
      'RUNNABLE-ENTITY': <ClusterOutlined />,
      'COMPOSITION-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'SENDER-RECEIVER-INTERFACE': <DeploymentUnitOutlined />,
      'CLIENT-SERVER-INTERFACE': <DeploymentUnitOutlined />,
      'SERVICE-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'SWC-IMPLEMENTATION': <PartitionOutlined />,
    };

    return nodeTypes[nodeName] || <FileTextOutlined />;
  };

  // Process the ARXML data into a format suitable for the Tree component
  React.useEffect(() => {
    if (arxmlData) {
      const processedData = processArxmlData(arxmlData);
      setTreeData(processedData);
    }
  }, [arxmlData]);

  // Function to process ARXML data into tree structure
  const processArxmlData = (data, parentKey = '0') => {
    if (!data) return [];

    const nodes = [];

    // Root node special case
    if (parentKey === '0') {
      const rootNode = {
        key: '0-root',
        title: <Tooltip title={data.nodeName}>{data.nodeName}</Tooltip>,
        icon: getNodeIcon(data.nodeName),
        children: []
      };

      // Process direct children
      data.children.forEach((child, index) => {
        const childNodes = processArxmlData(child, `0-root-${index}`);
        if (childNodes.length > 0) {
          rootNode.children = [...(rootNode.children || []), ...childNodes];
        }
      });

      nodes.push(rootNode);
    } else {
      // For each child node
      if (data.nodeName === 'SHORT-NAME' && data.textContent) {
        nodes.push({
          key: `${parentKey}-${data.nodeName}`,
          title: (
            <Tooltip title={`${data.nodeName}: ${data.textContent}`}>
              <Text
                style={{
                  fontSize: '1.1em',
                  fontWeight: 600,
                  color: '#1677ff'
                }}
              >
                {data.textContent}
              </Text>
            </Tooltip>
          ),
          icon: getNodeIcon(data.nodeName),
          isLeaf: true
        });
      } else {
        const nodeKey = `${parentKey}-${data.nodeName}`;
        const node = {
          key: nodeKey,
          title: <Tooltip title={data.nodeName}>{data.nodeName}</Tooltip>,
          icon: getNodeIcon(data.nodeName),
          children: []
        };

        // Add attributes as leaf nodes if they exist and are relevant
        if (Object.keys(data.attributes).length > 0) {
          for (const [key, value] of Object.entries(data.attributes)) {
            if (key !== 'xmlns' && key !== 'xsi:schemaLocation') {
              node.children?.push({
                key: `${nodeKey}-attr-${key}`,
                title: (
                  <Tooltip title={`${key}: ${value}`}>
                    <span style={{ color: '#6c6c6c' }}>{key}: {value}</span>
                  </Tooltip>
                ),
                isLeaf: true
              });
            }
          }
        }

        // Process text content if it exists
        if (data.textContent && data.nodeName !== 'SHORT-NAME') {
          node.children?.push({
            key: `${nodeKey}-text`,
            title: <span style={{ color: '#003a8c' }}>{data.textContent}</span>,
            isLeaf: true
          });
        }

        // Process child nodes
        data.children.forEach((child, index) => {
          const childNodes = processArxmlData(child, `${nodeKey}-${index}`);
          if (childNodes.length > 0) {
            node.children = [...(node.children || []), ...childNodes];
          }
        });

        // If no children were added, mark as leaf
        if (!node.children || node.children.length === 0) {
          node.isLeaf = true;
          delete node.children;
        }

        nodes.push(node);
      }
    }

    return nodes;
  };  const onSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0 && info.node) {
      setSelectedNode(info.node);
    } else {
      setSelectedNode(null);
    }
  };  return (
    <div className="arxml-viewer-container">
      <div className="viewer-header">
        <Title level={4}>ARXML Structure {fileName && <span className="file-name">- {fileName}</span>}</Title>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1 1 60%' }}>
          {treeData.length > 0 ? (
            <Tree
              showIcon
              defaultExpandAll={false}
              defaultExpandedKeys={['0-root']}
              onSelect={onSelect}
              treeData={treeData}
              style={{ overflow: 'auto', maxHeight: '600px', background: '#fff', padding: '12px', borderRadius: '4px' }}
            />
          ) : (
            <Empty description="No ARXML data to display" />
          )}
        </div>
        
        <div style={{ flex: '1 1 40%' }}>
          <Card title="Node Details" style={{ maxHeight: '600px', overflow: 'auto' }}>
            {selectedNode ? (
              <div>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Node Type">
                    {typeof selectedNode.title === 'object' ? 
                      selectedNode.title.props?.title || 'Unknown' : 
                      String(selectedNode.title)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Key">{selectedNode.key}</Descriptions.Item>
                  <Descriptions.Item label="Has Children">
                    {selectedNode.children && selectedNode.children.length > 0 ? 'Yes' : 'No'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <Empty description="Select a node to view details" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ArxmlViewer;
