import React, { useState, useEffect } from 'react';
import { Tree, Card, Typography, Spin, Statistic, Divider, Row, Col, Alert, Badge, Tabs, Table, Tag, Modal, Button, Descriptions, Empty, List, Select } from 'antd';
import { 
  FolderOutlined, 
  FileTextOutlined, 
  ApartmentOutlined, 
  ClusterOutlined,
  BranchesOutlined, 
  AppstoreOutlined, 
  BlockOutlined,
  TagOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  DotChartOutlined,
  // Added for Tabs and other UI elements
  ProfileOutlined, 
  PartitionOutlined, 
  ShareAltOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import './ArxmlStructureAnalyzer.css';
import { useNavigate } from 'react-router-dom';

// Added Tabs, List, Empty, Modal, Button, Descriptions, Statistic, Card
const { TabPane } = Tabs;
const { Meta } = Card;

const { Title, Text } = Typography;

/**
 * Component for analyzing the structure of ARXML files
 * Provides statistical overview of element types and their hierarchy
 */
const ArxmlStructureAnalyzer = ({ arxmlData, fileName = '' }) => {
  const navigate = useNavigate();
  // State for analysis results (will now be based on filtered tree)
  const [analysis, setAnalysis] = useState({
    counts: {}, // Counts of NAMED elements by their original XML type
    total: 0, // Total number of NAMED elements
    hierarchyDepth: 0, // Max depth of the FILTERED tree
    elementsByType: {}, // NAMED elements grouped by original XML type
    hierarchyTree: [] // The new FILTERED hierarchy tree
  });
  
  // State for component analysis
  const [componentAnalysis, setComponentAnalysis] = useState({
    components: [],
    typesByCategory: {},
    relationshipCount: 0
  });
  // State for tree visualization
  const [treeData, setTreeData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeDetailsVisible, setIsNodeDetailsVisible] = useState(false);
  // Add state for expansion level and expanded keys
  const [expansionLevel, setExpansionLevel] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState([]);

  // Helper function to find SHORT-NAME or SHORT-LABEL in a node
  // Prioritizes SHORT-NAME, then SHORT-LABEL
  // Handles text directly or within a <T> tag
  const findShortNameOrLabel = (xmlNode) => {
    if (!xmlNode || !xmlNode.children || xmlNode.children.length === 0) return null;

    let nameNode = null;
    // Prioritize SHORT-NAME
    nameNode = Array.from(xmlNode.children).find(child => child.nodeName === 'SHORT-NAME');
    
    // If SHORT-NAME not found, try SHORT-LABEL
    if (!nameNode) {
      nameNode = Array.from(xmlNode.children).find(child => child.nodeName === 'SHORT-LABEL');
    }

    if (nameNode) {
      // Check for <T> tag inside SHORT-NAME/SHORT-LABEL for multilingual variants
      const tNode = Array.from(nameNode.children || []).find(child => child.nodeName === 'T');
      if (tNode) {
        return tNode.textContent?.trim() || null;
      }
      // Otherwise, take direct textContent
      return nameNode.textContent?.trim() || null;
    }
    return null;
  };

  // Helper to extract attributes from a NamedNodeMap into a plain object
  const extractAttributes = (attributes) => {
    const attrs = {};
    if (attributes) {
      for (let i = 0; i < attributes.length; i++) {
        attrs[attributes[i].name] = attributes[i].value;
      }
    }
    return attrs;
  };

  // Process data when arxmlData changes
  useEffect(() => {
    if (!arxmlData) {
      setTreeData([]);
      setAnalysis({
        counts: {},
        total: 0,
        hierarchyDepth: 0,
        elementsByType: {},
        hierarchyTree: []
      });
      setComponentAnalysis({
        components: [],
        typesByCategory: {},
        relationshipCount: 0
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Perform analysis on a timeout to prevent UI blocking
      setTimeout(() => {
        // General structure analysis
        const analysisResults = analyzeArxmlStructure(arxmlData);
        setAnalysis(analysisResults);
        
        // Specific component analysis
        const componentResults = analyzeComponents(arxmlData);
        setComponentAnalysis(componentResults);
        
        // Generate tree data for visualization
        const structureTree = generateStructureTree(analysisResults);
        setTreeData(structureTree);
        
        setIsAnalyzing(false);
      }, 100);
    } catch (err) {
      console.error("Error analyzing ARXML structure:", err);
      setError("Failed to analyze ARXML structure: " + err.message);
      setIsAnalyzing(false);
    }
  }, [arxmlData]);

  /**
   * Main function to analyze the ARXML structure
   * Builds a hierarchical tree of elements that have a SHORT-NAME or SHORT-LABEL.
   */
  const analyzeArxmlStructure = (data) => {
    const counts = {}; // Counts of NAMED elements by their original type
    const elementsByType = {}; // Stores NAMED elements, categorized by their type
    let totalNamedElements = 0;
    const hierarchyTree = []; // The new tree structure of NAMED elements

    // Recursive function to traverse the ARXML structure
    const traverseNode = (xmlNode, parentXmlPath = []) => {
      if (!xmlNode) {
        return [];
      }

      // Handle both Document and Element nodes
      const nodeToProcess = xmlNode.nodeType === 9 ? xmlNode.documentElement : xmlNode;
      
      if (!nodeToProcess || !nodeToProcess.nodeName || typeof nodeToProcess.nodeName !== 'string') {
        return [];
      }

      // Skip certain nodes
      if (nodeToProcess.nodeName === 'ANNOTATIONS' || nodeToProcess.nodeName === '#text') {
        return [];
      }

      const currentXmlPath = [...parentXmlPath, nodeToProcess.nodeName];
      const shortNameOrLabel = findShortNameOrLabel(nodeToProcess);

      let namedChildrenForCurrentNode = [];
      
      // Process children
      if (nodeToProcess.children && nodeToProcess.children.length > 0) {
        Array.from(nodeToProcess.children).forEach(childXmlNode => {
          const namedDescendants = traverseNode(childXmlNode, currentXmlPath);
          namedChildrenForCurrentNode.push(...namedDescendants);
        });
      }

      if (shortNameOrLabel) {
        // This node has a SHORT-NAME or SHORT-LABEL
        totalNamedElements++;
        
        if (!counts[nodeToProcess.nodeName]) {
          counts[nodeToProcess.nodeName] = 0;
          elementsByType[nodeToProcess.nodeName] = [];
        }
        counts[nodeToProcess.nodeName]++;
        
        const elementData = {
          name: shortNameOrLabel,
          type: nodeToProcess.nodeName,
          attributes: extractAttributes(nodeToProcess.attributes),
          xmlPath: currentXmlPath,
          rawNode: {
            nodeName: nodeToProcess.nodeName,
            attributes: extractAttributes(nodeToProcess.attributes),
            children: Array.from(nodeToProcess.children || []).map(child => ({
              nodeName: child.nodeName,
              textContent: child.textContent?.trim(),
              attributes: extractAttributes(child.attributes)
            }))
          },
          children: namedChildrenForCurrentNode.length > 0 ? namedChildrenForCurrentNode : undefined,
        };
        
        elementsByType[nodeToProcess.nodeName].push({
          name: shortNameOrLabel,
          type: nodeToProcess.nodeName,
          path: currentXmlPath.join(' > '),
        });
        
        return [elementData];
      } else {
        // This node does NOT have a SHORT-NAME/LABEL
        return namedChildrenForCurrentNode;
      }
    };
    
    try {
      // Start traversal from the root
      const rootElement = data.nodeType === 9 ? data.documentElement : data;
      
      if (rootElement) {
        const topLevelNamedNodes = traverseNode(rootElement, []);
        hierarchyTree.push(...topLevelNamedNodes);
      }

      let maxNewTreeDepth = 0;
      const calculateDepth = (nodes, currentDepth) => {
        if (!nodes || nodes.length === 0) return;
        maxNewTreeDepth = Math.max(maxNewTreeDepth, currentDepth);
        nodes.forEach(node => {
          if (node.children) {
            calculateDepth(node.children, currentDepth + 1);
          }
        });
      };
      calculateDepth(hierarchyTree, 0);

      return {
        counts,
        total: totalNamedElements,
        hierarchyDepth: maxNewTreeDepth,
        elementsByType,
        hierarchyTree
      };
    } catch (error) {
      console.error('Error in analyzeArxmlStructure:', error);
      throw error;
    }
  };

  /**
   * Specialized function to analyze all element structures in ARXML
   * This function is updated to use findShortNameOrLabel for consistency.
   */
  const analyzeComponents = (data) => {
    const elements = [];
    const typesByCategory = {};
    let relationshipCount = 0;
    const connectors = [];
    const ports = [];
    
    // Helper function to traverse all elements
    const traverseElements = (node, path = [], depth = 0) => {
      if (!node) return;
      
      const currentPath = [...path, node.nodeName];
      const displayName = findShortNameOrLabel(node); // Use new helper
      const hasChildren = node.children && node.children.length > 0;
      
      // Skip text nodes and very basic elements
      if (!node.nodeName || node.nodeName === '#text' || node.nodeName === 'S' || node.nodeName === 'T') {
        return;
      }
      
      // Add this element to our collection
      // Use displayName if available, otherwise nodeName for elements list
      const elementNameForList = displayName || node.nodeName; 
      // Robust UUID extraction for both NamedNodeMap and plain object
      const uuid =
        node.attributes && typeof node.attributes.getNamedItem === 'function'
          ? node.attributes.getNamedItem('UUID')?.value || ''
          : node.attributes && node.attributes.UUID
            ? node.attributes.UUID
            : '';
      if (displayName || uuid) { // Only add if displayName or uuid exists
        // Store references and relationships
        const references = findReferences(node);
        
        // Track relationships
        if (references.length > 0) {
          relationshipCount += references.length;
        }
        
        // Add to main elements list
        elements.push({
          name: elementNameForList,
          type: node.nodeName,
          uuid: uuid, // Use robust uuid
          references: references,
          location: currentPath.join(' > '),
          depth: depth,
          hasChildren: hasChildren
        });
        
        // Categorize by element type
        if (!typesByCategory[node.nodeName]) {
          typesByCategory[node.nodeName] = [];
        }
        
        typesByCategory[node.nodeName].push({
          name: elementNameForList, // Use consistent naming
          uuid: uuid, // Use robust uuid
          location: currentPath.join(' > ')
        });
        
        // Track special elements
        if (node.nodeName === 'ASSEMBLY-SW-CONNECTOR') {
          connectors.push({
            name: elementNameForList, // Use consistent naming
            uuid: uuid, // Use robust uuid
            provider: findProviderRef(node),
            requester: findRequesterRef(node),
            location: currentPath.join(' > ')
          });
        } else if (node.nodeName === 'P-PORT-PROTOTYPE' || node.nodeName === 'R-PORT-PROTOTYPE') {
          ports.push({
            name: elementNameForList, // Use consistent naming
            type: node.nodeName,
            uuid: uuid, // Use robust uuid
            interface: findInterfaceRef(node),
            location: currentPath.join(' > ')
          });
        }
      }
      
      // Continue searching in children
      if (hasChildren) {
        Array.from(node.children).forEach(child => { // Corrected iteration
          traverseElements(child, currentPath, depth + 1);
        });
      }
    };
    
    // Helper function to find all reference elements in a node
    const findReferences = (node) => {
      if (!node.children) return [];
      
      const references = [];
      
      // Look through all children for reference elements (-REF, -IREF, -TREF)
      const processNode = (n, path = []) => {
        if (!n) return;
        
        const currentPath = [...path, n.nodeName];
        
        // Find reference nodes (-REF suffix)
        if (n.nodeName && (n.nodeName.endsWith('-REF') || n.nodeName.endsWith('-TREF') || n.nodeName.endsWith('-IREF'))) {
          // Robust attribute access for DEST
          const destValue = 
            n.attributes && typeof n.attributes.getNamedItem === 'function'
            ? n.attributes.getNamedItem('DEST')?.value || ''
            : n.attributes && n.attributes.DEST
              ? n.attributes.DEST
              : '';
          
          references.push({
            type: n.nodeName,
            dest: destValue,
            value: n.textContent || '',
            path: currentPath.join(' > ')
          });
        }
        
        // Continue recursive search
        if (n.children && n.children.length > 0) {
          Array.from(n.children).forEach(child => processNode(child, currentPath)); // Corrected iteration
        }
      };
      
      // Start processing from this node's children
      Array.from(node.children).forEach(child => processNode(child)); // Corrected iteration
      
      return references;
    };
    
    // Find provider references in connectors
    const findProviderRef = (node) => {
      if (!node.children) return null;
      
      const providerIref = Array.from(node.children).find(child => child.nodeName === 'PROVIDER-IREF');
      if (!providerIref) return null;
      
      // Extract component and port refs
      const componentRefNode = providerIref.children ? Array.from(providerIref.children).find(c => c.nodeName === 'CONTEXT-COMPONENT-REF') : null;
      const portRefNode = providerIref.children ? Array.from(providerIref.children).find(c => c.nodeName === 'TARGET-P-PORT-REF') : null;
      
      // Robust attribute access for DEST
      const getDestValue = (node) => {
        return node && node.attributes && typeof node.attributes.getNamedItem === 'function'
          ? node.attributes.getNamedItem('DEST')?.value || ''
          : node && node.attributes && node.attributes.DEST
            ? node.attributes.DEST
            : '';
      };
      
      return {
        component: getDestValue(componentRefNode),
        componentPath: componentRefNode?.textContent || '',
        port: getDestValue(portRefNode),
        portPath: portRefNode?.textContent || ''
      };
    };
    
    // Find requester references in connectors
    const findRequesterRef = (node) => {
      if (!node.children) return null;
      
      const requesterIref = Array.from(node.children).find(child => child.nodeName === 'REQUESTER-IREF');
      if (!requesterIref) return null;
      
      // Extract component and port refs
      const componentRefNode = requesterIref.children ? Array.from(requesterIref.children).find(c => c.nodeName === 'CONTEXT-COMPONENT-REF') : null;
      const portRefNode = requesterIref.children ? Array.from(requesterIref.children).find(c => c.nodeName === 'TARGET-R-PORT-REF') : null;
      
      // Robust attribute access for DEST
      const getDestValue = (node) => {
        return node && node.attributes && typeof node.attributes.getNamedItem === 'function'
          ? node.attributes.getNamedItem('DEST')?.value || ''
          : node && node.attributes && node.attributes.DEST
            ? node.attributes.DEST
            : '';
      };
      
      return {
        component: getDestValue(componentRefNode),
        componentPath: componentRefNode?.textContent || '',
        port: getDestValue(portRefNode),
        portPath: portRefNode?.textContent || ''
      };
    };
    
    // Find interface references in port elements
    const findInterfaceRef = (node) => {
      if (!node.children) return null;
      
      const interfaceRefNode = Array.from(node.children).find(child => 
        child.nodeName === 'REQUIRED-INTERFACE-TREF' || 
        child.nodeName === 'PROVIDED-INTERFACE-TREF'
      );
      
      if (interfaceRefNode) {
        // Robust attribute access for DEST
        const destValue = interfaceRefNode.attributes && typeof interfaceRefNode.attributes.getNamedItem === 'function'
          ? interfaceRefNode.attributes.getNamedItem('DEST')?.value || ''
          : interfaceRefNode.attributes && interfaceRefNode.attributes.DEST
            ? interfaceRefNode.attributes.DEST
            : '';
        
        return {
          type: interfaceRefNode.nodeName,
          dest: destValue,
          value: interfaceRefNode.textContent || ''
        };
      }
      
      return null;
    };

    // Start the analysis from the root
    // Ensure data is the root element if it's a document
    const rootElementForComponents = data.documentElement || data; 
    if (rootElementForComponents && rootElementForComponents.children) {
        for (const child of rootElementForComponents.children) {
            traverseElements(child); // Start traversal from children of root
        }
    } else if (rootElementForComponents) {
        traverseElements(rootElementForComponents); // If data itself is the element
    }
    
    return {
      components: elements,
      typesByCategory,
      relationshipCount,
      connectors,
      ports
    };
  };

  /**
   * Convert the hierarchical tree data into format suitable for Ant Design Tree component
   */
  const generateStructureTree = (analysisData) => {
    const { hierarchyTree } = analysisData;
    
    if (!hierarchyTree || hierarchyTree.length === 0) {
      return [];
    }
    
    // Helper function to truncate text
    const truncateText = (text, maxLength = 50) => {
      if (!text) return '';
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };
    
    // Helper function to recursively convert nodes from the filtered hierarchy
    const convertTreeNode = (filteredNode, parentKey = '') => {
      if (!filteredNode) {
        return null;
      }
      
      // Generate a unique key for this node
      const nodeKey = `${parentKey}-${filteredNode.name}-${filteredNode.type}`;
      
      // Choose icon based on element type
      let iconComponent;
      switch (filteredNode.type) {
        case 'AR-PACKAGE':
        case 'AR-PACKAGES':
          iconComponent = <FolderOutlined />;
          break;
        case 'COMPONENTS':
          iconComponent = <AppstoreOutlined />;
          break;
        case 'SW-COMPONENT-PROTOTYPE':
        case 'COMPOSITION-SW-COMPONENT-TYPE':
        case 'APPLICATION-SW-COMPONENT-TYPE':
        case 'SERVICE-SW-COMPONENT-TYPE':
          iconComponent = <BlockOutlined />;
          break;
        case 'R-PORT-PROTOTYPE':
        case 'P-PORT-PROTOTYPE':
        case 'PR-PORT-PROTOTYPE':
          iconComponent = <BranchesOutlined />;
          break;
        case 'PORTS':
          iconComponent = <PartitionOutlined />;
          break;
        case 'ASSEMBLY-SW-CONNECTOR':
        case 'DELEGATION-SW-CONNECTOR': 
          iconComponent = <ShareAltOutlined />;
          break;
        default:
          iconComponent = <FileTextOutlined />;
      }
      
      // Process children if they exist
      const children = filteredNode.children && filteredNode.children.length > 0
        ? filteredNode.children
            .filter(child => child !== null)
            .map(child => convertTreeNode(child, nodeKey))
            .filter(Boolean)
        : undefined;
      
      const childCount = children ? children.length : 0;
      
      // Create the tree node
      return {
        title: (
          <span>
            <Text strong={filteredNode.xmlPath.length === 1}>{truncateText(filteredNode.name)}</Text>
            {childCount > 0 && (
              <Badge 
                count={childCount} 
                style={{ backgroundColor: '#1890ff', marginLeft: 8 }} 
              />
            )}
            <Text type="secondary" style={{ fontSize: '0.85em', marginLeft: 8 }}>
              ({filteredNode.type})
            </Text>
          </span>
        ),
        key: nodeKey,
        icon: iconComponent,
        children: children,
        data: filteredNode
      };
    };
    
    // Convert each root node in the hierarchy tree
    return hierarchyTree.map(rootNode => convertTreeNode(rootNode));
  };

  // Get all element types for the dashboard
  const getAllElementTypes = () => {
    const { counts } = analysis;
    
    // Sort by count in descending order
    return Object.entries(counts)
      .sort(([, countA], [, countB]) => countB - countA);
  };

  // Render Overview Statistics
  const renderOverviewStats = () => {
    const allTypes = getAllElementTypes();
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Named Elements"
              value={analysis?.total || 0}
              prefix={<ProfileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Named Element Types"
              value={Object.keys(analysis?.counts || {}).length}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Max Tree Depth"
              value={analysis?.hierarchyDepth || 0}
              prefix={<ApartmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Component Relationships"
              value={componentAnalysis?.relationshipCount || 0}
              prefix={<ShareAltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Title level={4} style={{ marginTop: 20 }}>All Named Element Types</Title>
          {allTypes.length > 0 ? (
            <List
              bordered
              dataSource={allTypes}
              renderItem={([type, count]) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>{type}</Text>
                    <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
                  </div>
                </List.Item>
              )}
            />
          ) : <Empty description="No element types found" />}
        </Col>
      </Row>
    );
  };

  // Column definitions for elements table
  const elementColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Element Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'blue';
        let icon = <TagOutlined />;
        
        if (type.includes('COMPONENT')) { color = 'green'; icon = <AppstoreOutlined />; }
        if (type.includes('PORT')) { color = 'purple'; icon = <BranchesOutlined />; }
        if (type.includes('CONNECTOR')) { color = 'volcano'; icon = <ApartmentOutlined />; }
        if (type.includes('PACKAGE')) { color = 'geekblue'; icon = <FolderOutlined />; }
        if (type.includes('COM-SPEC')) { color = 'orange'; icon = <ClusterOutlined />; }
        
        return (
          <span style={{ maxWidth: 160, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>
            <span title={type}>
              <Tag color={color} style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                {icon} {type}
              </Tag>
            </span>
          </span>
        );
      },
      sorter: (a, b) => a.type.localeCompare(b.type),
      filters: [
        { text: 'Component Types', value: 'COMPONENT' },
        { text: 'Port Types', value: 'PORT' },
        { text: 'Connector Types', value: 'CONNECTOR' },
        { text: 'Package Types', value: 'PACKAGE' },
        { text: 'Communication', value: 'COM-SPEC' }
      ],
      onFilter: (value, record) => record.type.includes(value),
      ellipsis: true,
      width: 180
    },
    {
      title: 'Location',
      dataIndex: 'location', // This refers to componentAnalysis.components[x].location
      key: 'location',
      ellipsis: true,
      width: '30%',
      render: (text) => (
        <div style={{ maxWidth: 300, overflow: 'auto', whiteSpace: 'pre' }}>{text}</div>
      )
    },
    {
      title: 'References',
      dataIndex: 'references',
      key: 'references',
      render: (refs) => refs && Array.isArray(refs) ? (
        <span>{refs.length} ref{refs.length !== 1 ? 's' : ''}</span>
      ) : '-',
      filters: [
        { text: '0', value: '0' },
        { text: '1-10', value: '1-10' },
        { text: '11-100', value: '11-100' },
        { text: '101-1000', value: '101-1000' },
        { text: '>1000', value: '1001+' }
      ],
      onFilter: (value, record) => {
        const count = Array.isArray(record.references) ? record.references.length : 0;
        if (value === '0') return count === 0;
        if (value === '1-10') return count >= 1 && count <= 10;
        if (value === '11-100') return count >= 11 && count <= 100;
        if (value === '101-1000') return count >= 101 && count <= 1000;
        if (value === '1001+') return count > 1000;
        return true;
      },
      sorter: (a, b) => {
        const aCount = Array.isArray(a.references) ? a.references.length : 0;
        const bCount = Array.isArray(b.references) ? b.references.length : 0;
        return aCount - bCount;
      },
      width: 120
    },
    {
      title: 'UUID',
      dataIndex: 'uuid',
      key: 'uuid',
      ellipsis: true,
      width: '20%',
      render: (uuid) => uuid || '-'
    }
  ];

  // Handle node selection in the tree
  const onNodeSelect = (selectedKeys, info) => {
    if (info.node && info.node.data) {
      setSelectedNode(info.node.data);
      setIsNodeDetailsVisible(true);
    } else {
      setSelectedNode(null);
      setIsNodeDetailsVisible(false);
    }
  };

  // Close modal
  const handleCloseNodeDetails = () => {
    setIsNodeDetailsVisible(false);
    setSelectedNode(null);
  };

  // Render node details modal
  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    // Find related components
    const relatedComponents = componentAnalysis.components.filter(comp => 
      comp.references?.some(ref => ref.value === selectedNode.name)
    );

    return (
      <Modal
        title={
          <span>
            <InfoCircleOutlined /> Element Details: {selectedNode.type}
          </span>
        }
        open={isNodeDetailsVisible}
        onCancel={handleCloseNodeDetails}
        footer={[
          <Button key="close" onClick={handleCloseNodeDetails}>
            Close
          </Button>
        ]}
        width={800}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Full Name">
            <Text copyable>{selectedNode.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Element Type">
            <Tag color="blue">{selectedNode.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="XML Path">
            <Text copyable>{selectedNode.xmlPath.join(' > ')}</Text>
          </Descriptions.Item>
          {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
            <Descriptions.Item label="Attributes">
              <pre style={{ maxHeight: '150px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(selectedNode.attributes, null, 2)}
              </pre>
            </Descriptions.Item>
          )}
        </Descriptions>

        {relatedComponents.length > 0 && (
          <>
            <Divider>Related Components</Divider>
            <List
              bordered
              dataSource={relatedComponents}
              renderItem={comp => (
                <List.Item>
                  <List.Item.Meta
                    title={comp.name}
                    description={
                      <>
                        <div>Type: {comp.type}</div>
                        <div>Location: {comp.location}</div>
                        {comp.references && comp.references.length > 0 && (
                          <div>
                            References: {comp.references.map(ref => (
                              <Tag key={ref.value} style={{ marginRight: '4px' }}>
                                {ref.type}: {ref.value}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {selectedNode.rawNode && (
          <>
            <Divider>Raw XML Structure (Excerpt)</Divider>
            <pre style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {(() => {
                try {
                  const { nodeName, attributes, children } = selectedNode.rawNode;
                  
                  // Build XML string manually
                  let xmlString = `<${nodeName}`;
                  
                  // Add attributes
                  if (attributes && Object.keys(attributes).length > 0) {
                    xmlString += ' ' + Object.entries(attributes)
                      .map(([key, value]) => `${key}="${value}"`)
                      .join(' ');
                  }
                  
                  // Add children or self-closing tag
                  if (children && children.length > 0) {
                    xmlString += '>\n';
                    children.forEach(child => {
                      xmlString += `  <${child.nodeName}`;
                      if (child.attributes && Object.keys(child.attributes).length > 0) {
                        xmlString += ' ' + Object.entries(child.attributes)
                          .map(([key, value]) => `${key}="${value}"`)
                          .join(' ');
                      }
                      if (child.textContent) {
                        xmlString += `>${child.textContent}</${child.nodeName}>\n`;
                      } else {
                        xmlString += '/>\n';
                      }
                    });
                    xmlString += `</${nodeName}>`;
                  } else {
                    xmlString += '/>';
                  }
                  
                  return xmlString.substring(0, 1000) + (xmlString.length > 1000 ? '...' : '');
                } catch (error) {
                  console.error('Error displaying raw XML:', error);
                  return 'Error displaying raw XML structure';
                }
              })()}
            </pre>
          </>
        )}
      </Modal>
    );
  };

  // Function to get all keys up to a certain level
  const getKeysUpToLevel = (nodes, currentLevel = 0, targetLevel = 1) => {
    let keys = [];
    
    nodes.forEach((node) => {
      if (currentLevel < targetLevel) {
        // Use the node's key from our tree data
        if (node.key) {
          keys.push(node.key);
        }
        // Recursively process children
        if (node.children) {
          keys = keys.concat(getKeysUpToLevel(node.children, currentLevel + 1, targetLevel));
        }
      }
    });
    
    return keys;
  };

  // Function to expand tree to specific level
  const expandToLevel = (level) => {
    if (!treeData || treeData.length === 0) return;
    
    const keys = getKeysUpToLevel(treeData, 0, level);
    setExpandedKeys(keys);
  };

  // Function to collapse all nodes
  const collapseAll = () => {
    setExpandedKeys([]);
  };

  // Handle tree expansion
  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
  };

  // UI Rendering
  if (isAnalyzing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin>
          <div style={{ padding: '50px', textAlign: 'center' }}>
            Analyzing ARXML structure...
          </div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (!arxmlData) {
    return <Empty description="No ARXML data loaded. Please import an ARXML file first." />;
  }
  
  const topElementTypes = getAllElementTypes();

  return (
    <div className="arxml-structure-analyzer">
      <Title level={3} style={{ marginBottom: '20px' }}>
        ARXML Structure Analysis: <Text type="secondary">{fileName}</Text>
      </Title>

      <Tabs 
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: <span><InfoCircleOutlined /> Overview</span>,
            children: renderOverviewStats()
          },
          {
            key: '2',
            label: <span><ApartmentOutlined /> Structure Tree</span>,
            children: treeData && treeData.length > 0 ? (
              <div style={{ padding: '20px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ marginRight: '8px' }}>Expand to level:</span>
                  <Select
                    value={expansionLevel}
                    onChange={(value) => {
                      setExpansionLevel(value);
                      expandToLevel(value);
                    }}
                    style={{ width: '100px' }}
                  >
                    {Array.from({ length: analysis.hierarchyDepth + 1 }, (_, i) => i + 1).map(level => (
                      <Select.Option key={level} value={level}>
                        Level {level}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button 
                    onClick={collapseAll}
                    icon={<ApartmentOutlined />}
                  >
                    Collapse All
                  </Button>
                </div>
                <Tree
                  showLine
                  showIcon
                  expandedKeys={expandedKeys}
                  onExpand={onExpand}
                  onSelect={onNodeSelect}
                  treeData={treeData}
                  className="arxml-tree"
                />
              </div>
            ) : (
              <Empty description="No hierarchical structure with named elements to display." />
            )
          },
          {
            key: '3',
            label: <span><BlockOutlined /> Element Analysis</span>,
            children: (
              <>
                <Title level={4}>All Identified Elements</Title>
                <Text style={{ marginBottom: 16, display: 'block' }}>
                  This table lists all elements identified during the component analysis, primarily those with a SHORT-NAME/LABEL or UUID.
                </Text>
                <Table 
                  dataSource={componentAnalysis?.components || []} 
                  columns={elementColumns} 
                  rowKey={(record, index) => record.uuid || `${record.name}-${record.type}-${index}`}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </>
            )
          },
          {
            key: '4',
            label: <span><DotChartOutlined /> Connections</span>,
            children: (
              <>
                <Title level={4}>Connectors</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={componentAnalysis?.connectors || []}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${item.name} (${item.type || 'Connector'})`}
                        description={`Provider: ${item.provider?.componentPath || 'N/A'} -> ${item.provider?.portPath || 'N/A'} | Requester: ${item.requester?.componentPath || 'N/A'} -> ${item.requester?.portPath || 'N/A'}`}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: "No connectors found." }}
                />
                <Title level={4} style={{marginTop: '20px'}}>Ports</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={componentAnalysis?.ports || []}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${item.name} (${item.type})`}
                        description={`Interface: ${item.interface?.value || 'N/A'} (DEST: ${item.interface?.dest || 'N/A'})`}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: "No ports found." }}
                />
              </>
            )
          }
        ]}
      />

      {renderNodeDetails()}
    </div>
  );
};

export default ArxmlStructureAnalyzer;
