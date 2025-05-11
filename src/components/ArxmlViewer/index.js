import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tree, Typography, Tooltip, Card, Descriptions, Empty, Input, Spin, Pagination, Radio, Tag, Space, Modal, Button } from 'antd';
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
  SettingOutlined,
  SearchOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  CloseOutlined
} from '@ant-design/icons';
import './ArxmlViewer.css';

const { Title, Text } = Typography;
const { Search } = Input;

// Type for our tree nodes
const ArxmlViewer = ({ arxmlData, fileName = '' }) => {
  const [treeData, setTreeData] = useState([]);
  const [filteredTreeData, setFilteredTreeData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeDetailsVisible, setIsNodeDetailsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(['0-root']);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('smart'); // 'smart' or 'exact'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalMatches, setTotalMatches] = useState(0);
  const [nodeIndex, setNodeIndex] = useState({}); // For fast lookup
  const [searchResults, setSearchResults] = useState([]); // Store all matches
  const [displayedResults, setDisplayedResults] = useState([]); // Current page results
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Common node categories in AUTOSAR
  const nodeCategories = [
    { key: 'all', label: 'All' },
    { key: 'component', label: 'Components', patterns: ['COMPONENT-TYPE', 'SW-COMPONENT'] },
    { key: 'port', label: 'Ports', patterns: ['PORT-PROTOTYPE', 'PORT-INTERFACE'] },
    { key: 'datatype', label: 'DataTypes', patterns: ['DATA-TYPE', 'VALUE-SPECIFICATION'] },
    { key: 'behavior', label: 'Behaviors', patterns: ['BEHAVIOR', 'RUNNABLE', 'EVENT'] },
  ];
  
  // Worker for intensive operations
  const worker = useRef(null);
  
  // Debounce search function to improve performance
  const debounceTimeout = useRef(null);
  const debounceSearch = useCallback((value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 300); // 300ms delay
  }, []);
  // Function to determine the appropriate icon based on node name
  const getNodeIcon = (nodeName) => {
    // Map specific node types to icons
    const nodeTypes = {
      // Root and package structure
      'AUTOSAR': <FileTextOutlined />,
      'AR-PACKAGES': <AppstoreOutlined />,
      'AR-PACKAGE': <AppstoreOutlined />,
      'ELEMENTS': <BlockOutlined />,
      'CONTAINERS': <BlockOutlined />,
      
      // Component types
      'APPLICATION-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'COMPOSITION-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'SERVICE-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'PARAMETER-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'SENSOR-ACTUATOR-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'COMPLEX-DEVICE-DRIVER-SW-COMPONENT-TYPE': <PartitionOutlined />,
      'SWC-IMPLEMENTATION': <PartitionOutlined />,
      'BSW-MODULE': <PartitionOutlined />,
      
      // Interface elements
      'PORTS': <BranchesOutlined />,
      'P-PORT-PROTOTYPE': <ApartmentOutlined />,
      'R-PORT-PROTOTYPE': <ApartmentOutlined />,
      'PROVIDED-INTERFACE-TREF': <DeploymentUnitOutlined />,
      'REQUIRED-INTERFACE-TREF': <DeploymentUnitOutlined />,
      'SENDER-RECEIVER-INTERFACE': <DeploymentUnitOutlined />,
      'CLIENT-SERVER-INTERFACE': <DeploymentUnitOutlined />,
      
      // Behavior and execution
      'INTERNAL-BEHAVIORS': <RobotOutlined />,
      'SWC-INTERNAL-BEHAVIOR': <ControlOutlined />,
      'EVENTS': <FunctionOutlined />,
      'TIMING-EVENT': <SettingOutlined />,
      'DATA-RECEIVE-EVENT': <FunctionOutlined />,
      'OPERATION-INVOKED-EVENT': <FunctionOutlined />,
      'RUNNABLES': <ClusterOutlined />,
      'RUNNABLE-ENTITY': <ClusterOutlined />,
      
      // Data elements
      'SHORT-NAME': <TagOutlined />,
      'IMPLEMENTATION-DATA-TYPE': <TagOutlined />,
      'APPLICATION-DATA-TYPE': <TagOutlined />,
      'DATA-PROTOTYPE': <TagOutlined />,
      
      // System elements
      'SYSTEM': <ClusterOutlined />,
      'ECU-INSTANCE': <ControlOutlined />,
    };

    // Try exact match
    if (nodeTypes[nodeName]) {
      return nodeTypes[nodeName];
    }
    
    // Try pattern matching for common suffixes
    if (nodeName.endsWith('-TYPE')) {
      return <TagOutlined />;
    } else if (nodeName.endsWith('-DEFINITION')) {
      return <BlockOutlined />;
    } else if (nodeName.endsWith('-PROTOTYPE')) {
      return <ApartmentOutlined />;
    } else if (nodeName.endsWith('-EVENT')) {
      return <FunctionOutlined />;
    } else if (nodeName.endsWith('-INTERFACE')) {
      return <DeploymentUnitOutlined />;
    }
      // Default icon
    return <FileTextOutlined />;
  };
  // Process the ARXML data into a format suitable for the Tree component
  useEffect(() => {
    if (arxmlData) {
      setIsLoading(true);
      
      // Execute this in a setTimeout to allow UI to update with loading state
      setTimeout(() => {
        try {
          // Process the data
          const processedData = processArxmlData(arxmlData);
          setTreeData(processedData);
          setFilteredTreeData(processedData);
          
          // Build an index for faster searching
          const index = buildNodeIndex(processedData);
          setNodeIndex(index);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error processing ARXML data:', error);
          setIsLoading(false);
        }
      }, 0);
    }
  }, [arxmlData]);
    // Build an indexed lookup for faster searches
  const buildNodeIndex = (nodes) => {
    const index = {
      byTitle: {},
      byType: {},
      byPath: {},
      allNodes: []
    };
    
    const processNode = (node, path = []) => {
      // Get the display title
      const nodeTitle = typeof node.title === 'object' 
        ? node.title.props?.title || ''
        : String(node.title);
      
      // Extract just the name without the type for better searching
      let displayTitle = nodeTitle;
      if (typeof node.title === 'object' && node.title.props?.children?.props?.children) {
        // Try to extract the short name part
        const children = node.title.props.children.props.children;
        if (Array.isArray(children)) {
          displayTitle = children[0];
        }
      }
      
      // Use the stored path if available, otherwise build from current path
      const nodePath = node._fullPath || [...path, displayTitle];
      const nodeType = node._rawNode ? getNodeType(node._rawNode.nodeName) : getNodeType(displayTitle);
      
      // Add to indices
      if (!index.byTitle[displayTitle.toLowerCase()]) {
        index.byTitle[displayTitle.toLowerCase()] = [];
      }
      index.byTitle[displayTitle.toLowerCase()].push(node);
      
      if (!index.byType[nodeType]) {
        index.byType[nodeType] = [];
      }
      index.byType[nodeType].push(node);
      
      // Store path information
      index.byPath[node.key] = nodePath;
      
      // Add to flat list for linear search if needed
      index.allNodes.push({
        node,
        title: displayTitle,
        path: nodePath,
        type: nodeType,
        key: node.key
      });
      
      // Process children
      if (node.children) {
        node.children.forEach(child => processNode(child, nodePath));
      }
    };
    
    nodes.forEach(node => processNode(node));
    return index;
  };
  
  // Determine node type category for filtering
  const getNodeType = (nodeName) => {
    if (!nodeName) return 'other';
    
    const lowerName = nodeName.toLowerCase();
    
    for (const category of nodeCategories) {
      if (category.patterns) {
        for (const pattern of category.patterns) {
          if (lowerName.includes(pattern.toLowerCase())) {
            return category.key;
          }
        }
      }
    }
    
    return 'other';
  };  // Helper function to find SHORT-NAME in children
  const findShortName = (node) => {
    if (!node) return null;
    
    // If node has a textContent property directly, check for non-empty string
    if (node.textContent && typeof node.textContent === 'string' && node.nodeName === 'SHORT-NAME') {
      return node.textContent.trim();
    }
    
    // Otherwise search through children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (child.nodeName === 'SHORT-NAME' && child.textContent) {
          return child.textContent.trim();
        }
      }
    }
    
    // Check attributes as fallback (some XML formats might store name as attribute)
    if (node.attributes && node.attributes.name) {
      return node.attributes.name;
    }
    
    return null;
  };
  // Function to determine if a node is a structural element that should be retained but de-emphasized
  const isStructuralElement = (nodeName) => {
    const structuralElements = [
      'AR-PACKAGES', 
      'AR-PACKAGE', 
      'ELEMENTS',
      'CONTAINERS',
      'ECUC-VALUES',
      'ECUC-MODULE-CONFIGURATION-VALUES',
      'PORTS',
      'INTERNAL-BEHAVIORS',
      'AUTOSAR'
    ];
    return structuralElements.includes(nodeName);
  };
  
  // Function to determine if the node should be shown with its shortName or as-is
  const shouldShowWithShortName = (node) => {
    // Almost all AUTOSAR elements should be displayed with their SHORT-NAME as primary identifier
    // Only some very specific container elements should be displayed with their node name instead
    
    // Elements that should be displayed with their element name instead of SHORT-NAME
    const structuralElements = [
      'AUTOSAR',           // Root element
      'ANNOTATIONS'        // Annotation containers
    ];
    
    // If the node is in the list of structural elements, don't prioritize its SHORT-NAME
    if (structuralElements.includes(node.nodeName)) {
      return false;
    }
      // For all other nodes with a SHORT-NAME, prioritize the SHORT-NAME
    return findShortName(node) !== null;
  };
    
  // Function to determine if a node should be displayed
  const isSignificantObject = (node) => {
    // Exclude very specific internal nodes that don't provide value 
    const excludedTypes = [
      'SHORT-NAME', // We extract short name separately
      'DESC',       // Description is handled separately
      'S',          // Shorthand elements are not directly useful
      'T'           // Shorthand elements are not directly useful
    ];
    
    // Always show package and structural elements as they contain important content
    const alwaysShowTypes = [
      'AR-PACKAGE',
      'AR-PACKAGES',
      'ELEMENTS',
      'CONTAINERS'
    ];
    
    // Always include these structural elements
    if (alwaysShowTypes.includes(node.nodeName)) {
      return true;
    }
    
    // Don't directly show these as they are often just containers or bookkeeping elements
    if (excludedTypes.includes(node.nodeName)) {
      return false;
    }
    
    // If node has a SHORT-NAME child, it's definitely significant
    const hasShortName = findShortName(node) !== null;
    if (hasShortName) {
      return true;
    }
    
    // If node has children or attributes, consider it potentially significant
    const hasChildren = node.children && node.children.length > 0;
    const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0;
    
    // In AUTOSAR, elements with explicit names or attributes are typically meaningful
    return hasChildren || hasAttributes;
  };
  // Function to process ARXML data into tree structure showing most nodes
  const processArxmlData = (data, parentKey = '0', parentPath = []) => {
    if (!data) return [];

    const nodes = [];
    const currentPath = [...parentPath];
    
    // Add this element to the path for tracking
    currentPath.push(data.nodeName);    // Root node special case
    if (parentKey === '0') {
      // Find SHORT-NAME if available for root
      const rootShortName = findShortName(data);
      
      // Create the root node with appropriate display
      const rootNode = {
        key: '0-root',
        title: rootShortName ? 
          <Tooltip title={`${rootShortName} (AUTOSAR)`}>
            <Text className="arxml-node-title">
              {rootShortName}
              <Text type="secondary" style={{ fontSize: '0.85em', marginLeft: 8 }}>
                (AUTOSAR)
              </Text>
            </Text>
          </Tooltip> : 
          <Tooltip title="AUTOSAR">AUTOSAR</Tooltip>,
        icon: getNodeIcon(data.nodeName),
        children: [],
        _fullPath: ['AUTOSAR'],
        _rawNode: data
      };

      // Process direct children
      data.children.forEach((child, index) => {
        const childNodes = processArxmlData(
          child, 
          `0-root-${index}`, 
          ['AUTOSAR', rootShortName].filter(Boolean)
        );
        if (childNodes.length > 0) {
          rootNode.children = [...(rootNode.children || []), ...childNodes];
        }
      });

      nodes.push(rootNode);
    } else {
      // Check if this node should be displayed and how
      const shortName = findShortName(data);
      const isSignificant = isSignificantObject(data);
      const useShortNameDisplay = shouldShowWithShortName(data) && shortName;
      const isStructural = isStructuralElement(data.nodeName);
      const nodeKey = `${parentKey}-${data.nodeName}`;
        if (isSignificant) {
        // Determine how to display this node
        let nodeTitle;
        // Always prioritize showing SHORT-NAME if available, except for pure structural elements
        if (shortName && !isStructural) {
          // Display with SHORT-NAME as primary identifier
          nodeTitle = (
            <Tooltip title={`${shortName} (${data.nodeName})`}>
              <Text className="arxml-node-title">
                {shortName}
                <Text type="secondary" style={{ fontSize: '0.85em', marginLeft: 8 }}>
                  ({data.nodeName})
                </Text>
              </Text>
            </Tooltip>
          );
        } else if (shortName && isStructural) {
          // For structural elements with SHORT-NAME (like AR-PACKAGE), show both but emphasize the SHORT-NAME
          nodeTitle = (
            <Tooltip title={`${shortName} (${data.nodeName})`}>
              <Text style={{ fontSize: '1.05em' }}>
                {shortName}
                <Text type="secondary" style={{ fontSize: '0.9em', marginLeft: 4 }}>
                  ({data.nodeName})
                </Text>
              </Text>
            </Tooltip>
          );
        } else {
          // For elements without SHORT-NAME, show the node name
          nodeTitle = <Tooltip title={data.nodeName}>{data.nodeName}</Tooltip>;
        }
        
        const node = {
          key: nodeKey,
          title: nodeTitle,
          icon: getNodeIcon(data.nodeName),
          children: [],
          _fullPath: [...currentPath, shortName].filter(Boolean), // filter out undefined/null
          _rawNode: data
        };

        // Process children
        let childrenToDisplay = [];
        data.children.forEach((child, index) => {
          // Skip SHORT-NAME nodes as they are incorporated into the parent display
          if (child.nodeName !== 'SHORT-NAME' || !useShortNameDisplay) {
            const childNodes = processArxmlData(
              child, 
              `${nodeKey}-${index}`, 
              [...currentPath, shortName || data.nodeName].filter(Boolean)
            );
            if (childNodes.length > 0) {
              childrenToDisplay = [...childrenToDisplay, ...childNodes];
            }
          }
        });
        
        if (childrenToDisplay.length > 0) {
          node.children = childrenToDisplay;
        } else {
          node.isLeaf = true;
          delete node.children;
        }

        nodes.push(node);
      } else if (data.nodeName === 'SHORT-NAME') {
        // Skip SHORT-NAME nodes as they're incorporated with their parent
      } else {
        // Handle any other nodes and process their children
        data.children.forEach((child, index) => {
          const childNodes = processArxmlData(
            child, 
            `${parentKey}-${data.nodeName}-${index}`, 
            currentPath
          );
          if (childNodes.length > 0) {
            nodes.push(...childNodes);
          }
        });
      }
    }

    return nodes;
  };
  // Function to handle search/filter with pagination support
  const handleSearch = useCallback((value) => {
    setIsLoading(true);
    setSearchText(value);
    setCurrentPage(1); // Reset to first page on new search
    
    // If search is empty, reset to original data
    if (!value) {
      setFilteredTreeData(treeData);
      setExpandedKeys(['0-root']);
      setTotalMatches(0);
      setSearchResults([]);
      setDisplayedResults([]);
      setIsLoading(false);
      return;
    }

    const searchValue = value.toLowerCase();
    const newExpandedKeys = new Set(['0-root']);
    
    // Execute search in a timeout to prevent UI blocking
    setTimeout(() => {
      try {
        let matches = [];
        
        // Use indexed search for better performance
        if (Object.keys(nodeIndex).length > 0) {
          // Find matches using the index
          matches = findMatchesUsingIndex(searchValue, filterCategory);
          
          // Apply category filter if specified
          if (filterCategory !== 'all') {
            matches = matches.filter(match => 
              nodeIndex.byType[filterCategory]?.some(node => node.key === match.key)
            );
          }
          
          // Sort matches by path depth for more relevant results first
          matches.sort((a, b) => {
            const pathA = nodeIndex.byPath[a.key] || [];
            const pathB = nodeIndex.byPath[b.key] || [];
            return pathA.length - pathB.length;
          });
          
          // Store total number of matches
          setTotalMatches(matches.length);
          setSearchResults(matches);
          
          // Get current page of results
          const startIdx = 0;
          const endIdx = Math.min(pageSize, matches.length);
          const currentPageResults = matches.slice(startIdx, endIdx);
          setDisplayedResults(currentPageResults);
          
          // Build the tree with only matching paths
          const filteredTree = buildFilteredTree(currentPageResults);
          setFilteredTreeData(filteredTree);
          
          // Expand paths to matches
          expandPathsToMatches(currentPageResults, newExpandedKeys);
        } else {
          // Fallback to the old recursive search if index is not available
          const filtered = filterTreeNodesClassic(treeData, searchValue);
          setFilteredTreeData(filtered);
        }
        
        setExpandedKeys([...newExpandedKeys]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error during search:', error);
        setFilteredTreeData(treeData);
        setIsLoading(false);
      }
    }, 0);
  }, [treeData, nodeIndex, filterCategory, pageSize]);
  
  // Find matches using the pre-built index
  const findMatchesUsingIndex = (searchValue, category = 'all') => {
    if (!nodeIndex.allNodes) return [];
    
    // Different search strategies
    if (searchMode === 'smart') {
      // Smart search prioritizes exact matches and specific categories
      const exactMatches = [];
      const containsMatches = [];
      
      nodeIndex.allNodes.forEach(item => {
        const { title, node } = item;
        const lowerTitle = title.toLowerCase();
        
        // Skip if category filter is active and doesn't match
        if (category !== 'all' && getNodeType(title) !== category) {
          return;
        }
        
        if (lowerTitle === searchValue) {
          exactMatches.push(node);
        } else if (lowerTitle.includes(searchValue)) {
          containsMatches.push(node);
        }
      });
      
      return [...exactMatches, ...containsMatches];
    } else {
      // Exact search just looks for the substring
      return nodeIndex.allNodes
        .filter(item => {
          // Apply category filter if specified
          if (category !== 'all' && getNodeType(item.title) !== category) {
            return false;
          }
          return item.title.toLowerCase().includes(searchValue);
        })
        .map(item => item.node);
    }
  };
  
  // Build a filtered tree containing only paths to matches
  const buildFilteredTree = (matches) => {
    if (!matches.length) return [];
    
    // Create a map of all nodes that should be kept
    const nodesToKeep = new Map();
    
    // For each match, add all its ancestors to the keep list
    matches.forEach(match => {
      const keyParts = match.key.split('-');
      let currentKey = keyParts[0];
      nodesToKeep.set(currentKey, true);
      
      for (let i = 1; i < keyParts.length; i++) {
        currentKey = `${currentKey}-${keyParts[i]}`;
        nodesToKeep.set(currentKey, true);
      }
    });
    
    // Clone function that keeps only nodes in the nodesToKeep map
    const cloneFilteredNode = (node) => {
      if (!nodesToKeep.has(node.key)) return null;
      
      const nodeTitle = typeof node.title === 'object' 
        ? node.title.props?.title || ''
        : String(node.title);
      
      // Check if this is one of our matches
      const isMatch = matches.some(m => m.key === node.key);
      
      // Create a clone of the node
      const newNode = { ...node };          // Highlight if it's a match while preserving the SHORT-NAME + type format
      if (isMatch) {
        // Check if the title is already a formatted React component with SHORT-NAME
        if (typeof nodeTitle === 'object' && nodeTitle.props && nodeTitle.props.children && 
            typeof nodeTitle.props.children === 'object') {
          // Try to preserve the original format but with highlight styling
          const originalTooltipTitle = nodeTitle.props.title;
          
          newNode.title = (
            <Tooltip title={originalTooltipTitle}>
              <Text className="arxml-node-match" style={{
                fontSize: '1.1em',
                fontWeight: 600,
                color: '#f50'
              }}>
                {nodeTitle.props.children}
              </Text>
            </Tooltip>
          );
        } else {
          // Simple highlight for plain text titles
          const originalLabel = nodeTitle;
          newNode.title = (
            <Tooltip title={originalLabel}>
              <Text className="arxml-node-match" style={{ 
                fontSize: '1.1em',
                fontWeight: 600,
                color: '#f50'
              }}>
                {originalLabel}
              </Text>
            </Tooltip>
          );
        }
      }
      
      // Process children recursively
      if (node.children) {
        newNode.children = node.children
          .map(child => cloneFilteredNode(child))
          .filter(child => child !== null);
        
        if (newNode.children.length === 0 && !isMatch) {
          delete newNode.children;
          newNode.isLeaf = true;
        }
      }
      
      return newNode;
    };
    
    // Start from the root nodes
    return treeData
      .map(node => cloneFilteredNode(node))
      .filter(node => node !== null);
  };
  
  // Expand all paths to matching nodes
  const expandPathsToMatches = (matches, expandedKeysSet) => {
    matches.forEach(match => {
      // Add all ancestor keys to the expanded keys set
      const keyParts = match.key.split('-');
      let currentKey = keyParts[0];
      expandedKeysSet.add(currentKey);
      
      for (let i = 1; i < keyParts.length; i++) {
        currentKey = `${currentKey}-${keyParts[i]}`;
        expandedKeysSet.add(currentKey);
      }
    });
  };
  
  // Legacy recursive search function (fallback)
  const filterTreeNodesClassic = (nodes, searchValue, parentMatched = false) => {
    if (!nodes) return [];

    return nodes.map(node => {
      const children = node.children ? filterTreeNodesClassic(node.children, searchValue, parentMatched) : [];
      
      // Check if this node's title matches the search text
      const nodeTitle = typeof node.title === 'object' 
        ? node.title.props?.title || ''
        : String(node.title);
      
      const matches = nodeTitle.toLowerCase().includes(searchValue);
      
      // If this node matches or any child matches, include it
      if (matches || children.some(child => child !== null)) {
        // Add this node's key to expanded keys if it matches
        if (matches) {
          // Get all parent keys by splitting the key by `-` and rebuilding
          const keyParts = node.key.split('-');
          let currentKey = '';
          for (let i = 0; i < keyParts.length; i++) {
            currentKey = currentKey ? `${currentKey}-${keyParts[i]}` : keyParts[i];
            // newExpandedKeys.add(currentKey);
          }
          
          // Highlight the matching title if it's a text component
          if (typeof node.title === 'object' && node.title.props && node.title.props.children) {
            const title = node.title.props.title;
            const originalLabel = typeof title === 'string' ? title : nodeTitle;
            
            return {
              ...node,
              title: (
                <Tooltip title={originalLabel}>
                  <Text style={{ 
                    fontSize: '1.1em',
                    fontWeight: 600,
                    color: '#f50', // Highlight color for matching nodes
                    backgroundColor: '#ffeeee' // Light background for highlighting
                  }}>
                    {originalLabel}
                  </Text>
                </Tooltip>
              ),
              children: children.length > 0 ? children : node.children,
            };
          }
        }
        
        return {
          ...node,
          children: children.length > 0 ? children : node.children,
        };
      }
      
      return null;
    }).filter(node => node !== null);
  };
  
  // Handle page change in paginated results
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        const startIdx = (page - 1) * size;
        const endIdx = Math.min(startIdx + size, searchResults.length);
        const currentPageResults = searchResults.slice(startIdx, endIdx);
        setDisplayedResults(currentPageResults);
        
        // Build tree with only current page matches
        const newExpandedKeys = new Set(['0-root']);
        const filteredTree = buildFilteredTree(currentPageResults);
        setFilteredTreeData(filteredTree);
        
        // Expand paths to matches
        expandPathsToMatches(currentPageResults, newExpandedKeys);
        setExpandedKeys([...newExpandedKeys]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error during pagination:', error);
        setIsLoading(false);
      }
    }, 0);
  };
  const onSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0 && info.node) {
      setSelectedNode(info.node);
      setIsNodeDetailsVisible(true);
    } else {
      setSelectedNode(null);
      setIsNodeDetailsVisible(false);
    }
  };
  
  const closeNodeDetails = () => {
    setIsNodeDetailsVisible(false);
  };  return (
    <div className="arxml-viewer-container">
      <div className="viewer-header">
        <div className="title-row">
          <Title level={4}>
            ARXML Structure {fileName && <span className="file-name">- {fileName}</span>}
            {searchText && <span className="filter-active"> (Filtered)</span>}
            {searchText && totalMatches > 0 && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {totalMatches} matches
              </Tag>
            )}
          </Title>
          <Space>
            {selectedNode && (
              <Button 
                type="primary" 
                size="small" 
                icon={<InfoCircleOutlined />} 
                onClick={() => setIsNodeDetailsVisible(true)}
              >
                View Node Details
              </Button>
            )}
          </Space>
        </div>
        <div className="search-container">
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Search
              placeholder="Search in ARXML"
              allowClear
              prefix={<SearchOutlined />}
              loading={isLoading}
              enterButton
              size="middle"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                if (!e.target.value) {
                  setFilteredTreeData(treeData);
                  setTotalMatches(0);
                } else {
                  debounceSearch(e.target.value);
                }
              }}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <FilterOutlined />
                <Radio.Group 
                  value={searchMode} 
                  onChange={(e) => setSearchMode(e.target.value)}
                  optionType="button" 
                  buttonStyle="solid" 
                  size="small"
                >
                  <Radio.Button value="smart">Smart Search</Radio.Button>
                  <Radio.Button value="exact">Exact Match</Radio.Button>
                </Radio.Group>
                
                <Radio.Group 
                  value={filterCategory} 
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    if (searchText) {
                      handleSearch(searchText);
                    }
                  }}
                  optionType="button"
                  size="small"
                >
                  {nodeCategories.map(cat => (
                    <Radio.Button key={cat.key} value={cat.key}>
                      {cat.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Space>
            </div>
            
            {searchText && totalMatches > pageSize && (
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalMatches}
                onChange={handlePageChange}
                size="small"
                showSizeChanger
                pageSizeOptions={['50', '100', '200', '500']}
              />
            )}
          </Space>
        </div>
      </div>
        <div className="tree-view-container">
        <Spin spinning={isLoading} tip="Processing ARXML data...">
          {filteredTreeData.length > 0 ? (
            <div className="tree-container">
              <Tree
                showIcon
                defaultExpandAll={false}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                onSelect={onSelect}
                treeData={filteredTreeData}
                height={600}
                virtual={true}
                style={{ 
                  overflow: 'auto', 
                  maxHeight: '700px',
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '4px' 
                }}
              />
              {searchText && totalMatches > 0 && (
                <div className="results-info" style={{ padding: '8px', background: '#f5f5f5', borderRadius: '0 0 4px 4px' }}>
                  Showing matches {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalMatches)} of {totalMatches}
                </div>
              )}
            </div>
          ) : (
            <Empty description={searchText ? "No matches found" : "No ARXML data to display"} />
          )}
        </Spin>
          {/* Node Details Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Node Details
            </div>
          }
          open={isNodeDetailsVisible && selectedNode !== null}
          onCancel={closeNodeDetails}
          footer={[
            <Button key="close" onClick={closeNodeDetails}>
              Close
            </Button>
          ]}
          width={600}
          destroyOnClose={true}
        >
          {selectedNode && (
            <div>
              <Descriptions bordered size="small" column={1}>                <Descriptions.Item label="SHORT-NAME">
                  {(() => {
                    // If we have the raw node, get the SHORT-NAME directly
                    if (selectedNode._rawNode) {
                      const shortName = findShortName(selectedNode._rawNode);
                      if (shortName) {
                        return <Text strong style={{ color: '#1677ff' }}>{shortName}</Text>;
                      }
                    }
                    
                    // Otherwise try to extract from title
                    const title = typeof selectedNode.title === 'object' ? 
                      selectedNode.title.props?.title || 'Unknown' : 
                      String(selectedNode.title);
                    
                    // Parse the SHORT-NAME from the tooltip if available
                    const nameMatch = title.match(/^(.*?)\s*\(/);
                    return nameMatch ? 
                      <Text strong style={{ color: '#1677ff' }}>{nameMatch[1]}</Text> : 
                      <Text type="secondary">Not available</Text>;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Element Type">
                  {(() => {
                    if (selectedNode._rawNode) {
                      return <Tag color="blue">{selectedNode._rawNode.nodeName}</Tag>;
                    } else {
                      // Extract from the key if _rawNode is not available
                      const parts = selectedNode.key.split('-');
                      return <Tag color="blue">{parts[parts.length - 1]}</Tag>;
                    }
                  })()}
                </Descriptions.Item>
                {selectedNode._fullPath && (
                  <Descriptions.Item label="Full Path">
                    {selectedNode._fullPath.join(' > ')}
                  </Descriptions.Item>
                )}
                {!selectedNode._fullPath && nodeIndex.byPath && nodeIndex.byPath[selectedNode.key] && (
                  <Descriptions.Item label="Path">
                    {nodeIndex.byPath[selectedNode.key].join(' > ')}
                  </Descriptions.Item>
                )}
                {selectedNode._rawNode && selectedNode._rawNode.attributes && 
                 Object.keys(selectedNode._rawNode.attributes).length > 0 && (
                  <Descriptions.Item label="Attributes" contentStyle={{ whiteSpace: 'pre-wrap' }}>
                    {Object.entries(selectedNode._rawNode.attributes).map(([key, value]) => (
                      <div key={key}>
                        <Text strong>{key}:</Text> {value}
                      </div>
                    ))}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Has Children">
                  {selectedNode.children && selectedNode.children.length > 0 ? 'Yes' : 'No'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ArxmlViewer;
