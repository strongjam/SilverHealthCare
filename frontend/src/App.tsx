import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Menu, Badge, Drawer, Button } from 'antd';
import {
  DashboardOutlined,
  HeartOutlined,
  BellOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';
import koKR from 'antd/locale/ko_KR';
import Login from './components/Login';
import HealthDashboard from './components/HealthDashboard';
import OverviewDashboard from './components/OverviewDashboard';
import EmergencyAlerts from './components/EmergencyAlerts';
import HealthReports from './components/HealthReports';
import Medications from './components/Medications';
import './App.css';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // 저장된 토큰 확인
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);

      // axios 기본 헤더 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }

    // 화면 크기 변경 감지
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (authToken: string, userData: any, _role: string) => {
    setUser(userData);
    setIsLoggedIn(true);

    // axios 기본 헤더 설정
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setIsLoggedIn(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (!isLoggedIn) {
    return (
      <ConfigProvider locale={koKR}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ConfigProvider>
    );
  }

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '대시보드',
    },
    {
      key: 'health',
      icon: <HeartOutlined />,
      label: '건강 모니터링',
    },
    {
      key: 'alerts',
      icon: <Badge count={0}><BellOutlined /></Badge>,
      label: '응급 알림',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: '건강 리포트',
    },
    {
      key: 'medications',
      icon: <MedicineBoxOutlined />,
      label: '복약 관리',
    },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <OverviewDashboard />;
      case 'health':
        return <HealthDashboard />;
      case 'alerts':
        return <EmergencyAlerts />;
      case 'reports':
        return <HealthReports />;
      case 'medications':
        return <Medications />;
      default:
        return <OverviewDashboard />;
    }
  };

  const SideMenuContent = () => (
    <>
      <div style={{
        height: '64px',
        margin: '16px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: isMobile ? '14px' : '16px'
      }}>
        Silver Health Care
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentPage]}
        items={menuItems}
        onClick={({ key }) => {
          setCurrentPage(key);
          if (isMobile) setDrawerVisible(false);
        }}
      />
    </>
  );

  return (
    <ConfigProvider locale={koKR}>
      <Layout style={{ minHeight: '100vh' }}>
        {/* 데스크톱 사이드바 */}
        {!isMobile && (
          <Sider
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <SideMenuContent />
          </Sider>
        )}

        {/* 모바일 드로어 */}
        {isMobile && (
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0, background: '#001529' }}
            width={250}
          >
            <SideMenuContent />
          </Drawer>
        )}

        <Layout style={{ marginLeft: isMobile ? 0 : 200 }}>
          <Header style={{
            padding: isMobile ? '0 12px' : '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  style={{ fontSize: '18px' }}
                />
              )}
              <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold' }}>
                {menuItems.find(item => item.key === currentPage)?.label}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
              {!isMobile && <span>환영합니다, <strong>{user?.name}</strong>님</span>}
              <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
                <LogoutOutlined /> {!isMobile && '로그아웃'}
              </a>
            </div>
          </Header>
          <Content style={{ margin: '0', overflow: 'initial', minHeight: 'calc(100vh - 64px)' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
