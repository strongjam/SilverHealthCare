import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import HealthDashboard from './components/HealthDashboard';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={koKR}>
      <div className="App">
        <header style={{
          background: '#001529',
          color: 'white',
          padding: '16px 24px',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>
          실버 헬스케어 - 실시간 건강 모니터링 시스템
        </header>
        <HealthDashboard />
      </div>
    </ConfigProvider>
  );
}

export default App;
