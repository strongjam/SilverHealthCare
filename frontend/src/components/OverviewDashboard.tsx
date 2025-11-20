import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Space, Button } from 'antd';
import {
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  ReloadOutlined
} from '@ant-design/icons';
const OverviewDashboard = () => {
  const [stats] = useState({
    total: 12,
    normal: 8,
    warning: 3,
    critical: 1
  });

  const [users] = useState<any[]>([
    {
      key: '1',
      name: '김영희',
      age: 75,
      status: 'normal',
      heartRate: 72,
      bloodPressure: '120/80',
      lastCheck: '5분 전',
      room: '101호'
    },
    {
      key: '2',
      name: '이철수',
      age: 68,
      status: 'warning',
      heartRate: 95,
      bloodPressure: '145/90',
      lastCheck: '2분 전',
      room: '102호'
    },
    {
      key: '3',
      name: '박순자',
      age: 82,
      status: 'critical',
      heartRate: 125,
      bloodPressure: '160/95',
      lastCheck: '방금',
      room: '103호'
    },
    {
      key: '4',
      name: '최민수',
      age: 71,
      status: 'normal',
      heartRate: 68,
      bloodPressure: '118/78',
      lastCheck: '3분 전',
      room: '104호'
    },
    {
      key: '5',
      name: '정수진',
      age: 79,
      status: 'normal',
      heartRate: 74,
      bloodPressure: '125/82',
      lastCheck: '7분 전',
      room: '105호'
    },
    {
      key: '6',
      name: '강호동',
      age: 73,
      status: 'warning',
      heartRate: 88,
      bloodPressure: '138/85',
      lastCheck: '4분 전',
      room: '106호'
    },
    {
      key: '7',
      name: '윤미래',
      age: 76,
      status: 'normal',
      heartRate: 70,
      bloodPressure: '122/80',
      lastCheck: '8분 전',
      room: '107호'
    },
    {
      key: '8',
      name: '서장훈',
      age: 70,
      status: 'normal',
      heartRate: 75,
      bloodPressure: '120/79',
      lastCheck: '6분 전',
      room: '108호'
    },
    {
      key: '9',
      name: '한석봉',
      age: 84,
      status: 'warning',
      heartRate: 92,
      bloodPressure: '142/88',
      lastCheck: '1분 전',
      room: '109호'
    },
    {
      key: '10',
      name: '송혜교',
      age: 72,
      status: 'normal',
      heartRate: 73,
      bloodPressure: '119/77',
      lastCheck: '9분 전',
      room: '110호'
    },
    {
      key: '11',
      name: '김태희',
      age: 77,
      status: 'normal',
      heartRate: 71,
      bloodPressure: '121/81',
      lastCheck: '5분 전',
      room: '111호'
    },
    {
      key: '12',
      name: '전지현',
      age: 74,
      status: 'normal',
      heartRate: 69,
      bloodPressure: '117/76',
      lastCheck: '10분 전',
      room: '112호'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '정상';
      case 'warning': return '주의';
      case 'critical': return '위급';
      default: return status;
    }
  };

  const columns = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '나이',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '방 번호',
      dataIndex: 'room',
      key: 'room',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '심박수',
      dataIndex: 'heartRate',
      key: 'heartRate',
      render: (rate: number) => `${rate} bpm`
    },
    {
      title: '혈압',
      dataIndex: 'bloodPressure',
      key: 'bloodPressure',
    },
    {
      title: '마지막 확인',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
    },
  ];

  return (
    <div style={{ padding: '12px' }}>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="전체 어르신"
              value={stats.total}
              prefix={<UserOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="정상"
              value={stats.normal}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="주의"
              value={stats.warning}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="위급"
              value={stats.critical}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix="명"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
        <Col xs={24} sm={24} md={16} lg={16}>
          <Card
            title="어르신 목록"
            extra={<Button icon={<ReloadOutlined />} size="small">새로고침</Button>}
          >
            <Table
              columns={columns}
              dataSource={users}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8}>
          <Card title="디바이스 상태">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span><WifiOutlined /> 웨어러블 기기</span>
                    <Tag color="green">온라인</Tag>
                  </Space>
                </div>
                <Progress percent={85} size="small" status="active" />
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                  <ThunderboltOutlined /> 배터리: 85%
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span><WifiOutlined /> 센서 모듈</span>
                    <Tag color="green">온라인</Tag>
                  </Space>
                </div>
                <Progress percent={92} size="small" status="active" />
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                  <ThunderboltOutlined /> 배터리: 92%
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span><WifiOutlined /> 게이트웨이</span>
                    <Tag color="orange">점검 필요</Tag>
                  </Space>
                </div>
                <Progress percent={35} size="small" status="exception" />
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                  <ThunderboltOutlined /> 배터리: 35%
                </div>
              </div>
            </Space>
          </Card>

          <Card title="실시간 알림" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ padding: '8px', background: '#fff1f0', borderLeft: '3px solid #f5222d' }}>
                <div style={{ fontWeight: 'bold', color: '#f5222d' }}>위급 알림</div>
                <div style={{ fontSize: '12px' }}>박순자 - 심박수 이상 (방금)</div>
              </div>
              <div style={{ padding: '8px', background: '#fffbe6', borderLeft: '3px solid #faad14' }}>
                <div style={{ fontWeight: 'bold', color: '#faad14' }}>주의 알림</div>
                <div style={{ fontSize: '12px' }}>이철수 - 혈압 상승 (2분 전)</div>
              </div>
              <div style={{ padding: '8px', background: '#f6ffed', borderLeft: '3px solid #52c41a' }}>
                <div style={{ fontWeight: 'bold', color: '#52c41a' }}>정상</div>
                <div style={{ fontSize: '12px' }}>김영희 - 복약 완료 (5분 전)</div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewDashboard;
