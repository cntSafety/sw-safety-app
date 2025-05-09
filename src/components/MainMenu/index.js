import React, { useState } from 'react';
import { Menu, Layout, Button } from 'antd';
import {
  FileOutlined,
  EditOutlined,
  EyeOutlined,
  RocketOutlined,
  FileTextOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import './MainMenu.css';

const { Header } = Layout;

const MainMenu = ({ onNavigate }) => {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  const handleMenuClick = (e) => {
    switch (e.key) {
      case 'import-arxml':
        onNavigate('/import-arxml');
        if (!collapsed) {
          setCollapsed(true);
        }
        break;
      case 'home':
        onNavigate('/');
        if (!collapsed) {
          setCollapsed(true);
        }
        break;
      case 'back':
        window.history.back();
        if (!collapsed) {
          setCollapsed(true);
        }
        break;
      default:
        // Handle other menu actions
        console.log(`Menu item clicked: ${e.key}`);
    }
  };
  
  // Define menu items for desktop
  const desktopMenuItems = [
    {
      key: 'file',
      icon: <FileOutlined />,
      label: 'File',
      children: [
        {
          key: 'import-arxml',
          icon: <FileOutlined />,
          label: 'Import .arxml'
        },
        {
          key: 'export',
          icon: <FileOutlined />,
          label: 'Export'
        },
        {
          key: 'save',
          icon: <FileOutlined />,
          label: 'Save'
        },
        {
          key: 'save-as',
          icon: <FileOutlined />,
          label: 'Save As'
        }
      ]
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      children: [
        {
          key: 'cut',
          label: 'Cut'
        },
        {
          key: 'copy',
          label: 'Copy'
        },
        {
          key: 'paste',
          label: 'Paste'
        }
      ]
    },
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View',
      children: [
        {
          key: 'zoom-in',
          label: 'Zoom In'
        },
        {
          key: 'zoom-out',
          label: 'Zoom Out'
        }
      ]
    },
    {
      key: 'go',
      icon: <RocketOutlined />,
      label: 'Go',
      children: [
        {
          key: 'home',
          label: 'Home'
        },
        {
          key: 'back',
          label: 'Back'
        }
      ]
    },
    {
      key: 'report',
      icon: <FileTextOutlined />,
      label: 'Report',
      children: [
        {
          key: 'generate-report',
          label: 'Generate Report'
        },
        {
          key: 'export-report',
          label: 'Export Report'
        }
      ]
    }
  ];

  // Define menu items for mobile
  const mobileMenuItems = [
    {
      key: 'file-mobile',
      icon: <FileOutlined />,
      label: 'File',
      children: [
        {
          key: 'import-arxml',
          icon: <FileOutlined />,
          label: 'Import .arxml'
        },
        {
          key: 'export',
          icon: <FileOutlined />,
          label: 'Export'
        },
        {
          key: 'save',
          icon: <FileOutlined />,
          label: 'Save'
        },
        {
          key: 'save-as',
          icon: <FileOutlined />,
          label: 'Save As'
        }
      ]
    },
    {
      key: 'edit-mobile',
      icon: <EditOutlined />,
      label: 'Edit',
      children: [
        {
          key: 'cut',
          label: 'Cut'
        },
        {
          key: 'copy',
          label: 'Copy'
        },
        {
          key: 'paste',
          label: 'Paste'
        }
      ]
    },
    {
      key: 'view-mobile',
      icon: <EyeOutlined />,
      label: 'View',
      children: [
        {
          key: 'zoom-in',
          label: 'Zoom In'
        },
        {
          key: 'zoom-out',
          label: 'Zoom Out'
        }
      ]
    },
    {
      key: 'go-mobile',
      icon: <RocketOutlined />,
      label: 'Go',
      children: [
        {
          key: 'home',
          label: 'Home'
        },
        {
          key: 'back',
          label: 'Back'
        }
      ]
    },
    {
      key: 'report-mobile',
      icon: <FileTextOutlined />,
      label: 'Report',
      children: [
        {
          key: 'generate-report',
          label: 'Generate Report'
        },
        {
          key: 'export-report',
          label: 'Export Report'
        }
      ]
    }
  ];
  
  return (
    <div className="menu-wrapper">
      <Header className="app-header">
        <div className="logo">Safety App</div>
        <div className="menu-mobile-toggle">
          <Button 
            type="text" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
            onClick={toggleCollapsed} 
          />
        </div>
        <div className="menu-desktop">
          <Menu 
            mode="horizontal" 
            onClick={handleMenuClick}
            items={desktopMenuItems}
          />
        </div>
      </Header>
      
      {/* Mobile sidebar */}
      {!collapsed && (
        <div className="mobile-sidebar-overlay" onClick={toggleCollapsed}></div>
      )}
      <div className={`mobile-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
        <Menu
          mode="inline"
          theme="dark"
          onClick={handleMenuClick}
          items={mobileMenuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </div>
    </div>
  );
};

export default MainMenu;
