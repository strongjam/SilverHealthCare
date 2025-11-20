import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Select,
  Spin,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
} from 'antd';
import {
  HeartOutlined,
  DashboardOutlined,
  MedicineBoxOutlined,
  FireOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { User, HealthData, HealthAlert } from '../types/index';
import { userApi, healthApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const HealthDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [latestHealthData, setLatestHealthData] = useState<HealthData | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserData(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const response = await userApi.getUsers();
      setUsers(response.data);
      if (response.data.length > 0 && !selectedUserId) {
        setSelectedUserId(response.data[0].id);
      }
    } catch (error) {
      message.error('사용자 목록을 불러오는데 실패했습니다');
    }
  };

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const [userRes, healthRes, alertsRes] = await Promise.all([
        userApi.getUser(userId),
        healthApi.getLatestHealthData(userId),
        healthApi.getHealthAlerts(userId),
      ]);

      setSelectedUser(userRes.data);
      setLatestHealthData(healthRes.data);
      setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      message.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedUserId) {
      loadUserData(selectedUserId);
      message.success('데이터를 새로고침했습니다');
    }
  };

  const handleAddHealthData = async (values: any) => {
    if (!selectedUserId) return;

    try {
      const newData: HealthData = {
        id: `health-${Date.now()}`,
        user_id: selectedUserId,
        timestamp: new Date().toISOString(),
        heart_rate: values.heart_rate,
        blood_pressure_high: values.blood_pressure_high,
        blood_pressure_low: values.blood_pressure_low,
        blood_sugar: values.blood_sugar,
        temperature: values.temperature,
        oxygen_saturation: values.oxygen_saturation,
        status: 'normal',
      };

      await healthApi.createHealthData(newData);
      message.success('건강 데이터가 추가되었습니다');
      setIsModalOpen(false);
      form.resetFields();
      loadUserData(selectedUserId);
    } catch (error) {
      message.error('건강 데이터 추가에 실패했습니다');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAlertType = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>어르신 선택:</span>
              <Select
                style={{ width: 200 }}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="어르신을 선택하세요"
              >
                {users.map((user) => (
                  <Option key={user.id} value={user.id}>
                    {user.name} ({user.age}세)
                  </Option>
                ))}
              </Select>
            </Space>
            <Space>
              <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsModalOpen(true)}>
                건강 데이터 추가
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                새로고침
              </Button>
            </Space>
          </Space>
        </Card>

        {selectedUser && (
          <Card title="어르신 정보">
            <Row gutter={16}>
              <Col span={6}>
                <div><strong>이름:</strong> {selectedUser.name}</div>
              </Col>
              <Col span={6}>
                <div><strong>나이:</strong> {selectedUser.age}세</div>
              </Col>
              <Col span={6}>
                <div><strong>성별:</strong> {selectedUser.gender}</div>
              </Col>
              <Col span={6}>
                <div><strong>연락처:</strong> {selectedUser.phone}</div>
              </Col>
            </Row>
            <div style={{ marginTop: '12px' }}>
              <strong>긴급연락처:</strong> {selectedUser.emergency_contact}
            </div>
          </Card>
        )}

        {alerts.length > 0 && (
          <Card title="건강 알림">
            <Space direction="vertical" style={{ width: '100%' }}>
              {alerts.map((alert, index) => (
                <Alert
                  key={index}
                  message={alert.message}
                  type={getAlertType(alert.severity)}
                  showIcon
                />
              ))}
            </Space>
          </Card>
        )}

        {loading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          </Card>
        ) : latestHealthData ? (
          <>
            <Card
              title={
                <Space>
                  <span>실시간 건강 상태</span>
                  <Tag color={getStatusColor(latestHealthData.status)}>
                    {latestHealthData.status.toUpperCase()}
                  </Tag>
                </Space>
              }
            >
              <div style={{ marginBottom: '8px', color: '#666' }}>
                측정 시간: {dayjs(latestHealthData.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="심박수"
                      value={latestHealthData.heart_rate}
                      suffix="bpm"
                      prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="혈압"
                      value={`${latestHealthData.blood_pressure_high}/${latestHealthData.blood_pressure_low}`}
                      suffix="mmHg"
                      prefix={<DashboardOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ color: '#0050b3' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="혈당"
                      value={latestHealthData.blood_sugar}
                      suffix="mg/dL"
                      prefix={<ExperimentOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: '#389e0d' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="체온"
                      value={latestHealthData.temperature}
                      suffix="°C"
                      prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
                      valueStyle={{ color: '#d46b08' }}
                      precision={1}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="산소포화도"
                      value={latestHealthData.oxygen_saturation}
                      suffix="%"
                      prefix={<MedicineBoxOutlined style={{ color: '#722ed1' }} />}
                      valueStyle={{ color: '#531dab' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              건강 데이터가 없습니다
            </div>
          </Card>
        )}
      </Space>

      <Modal
        title="건강 데이터 추가"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="추가"
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleAddHealthData}>
          <Form.Item
            label="심박수 (bpm)"
            name="heart_rate"
            rules={[{ required: true, message: '심박수를 입력하세요' }]}
          >
            <InputNumber min={40} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="수축기 혈압 (mmHg)"
            name="blood_pressure_high"
            rules={[{ required: true, message: '수축기 혈압을 입력하세요' }]}
          >
            <InputNumber min={80} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="이완기 혈압 (mmHg)"
            name="blood_pressure_low"
            rules={[{ required: true, message: '이완기 혈압을 입력하세요' }]}
          >
            <InputNumber min={50} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="혈당 (mg/dL)"
            name="blood_sugar"
            rules={[{ required: true, message: '혈당을 입력하세요' }]}
          >
            <InputNumber min={50} max={400} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="체온 (°C)"
            name="temperature"
            rules={[{ required: true, message: '체온을 입력하세요' }]}
          >
            <InputNumber min={35} max={42} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="산소포화도 (%)"
            name="oxygen_saturation"
            rules={[{ required: true, message: '산소포화도를 입력하세요' }]}
          >
            <InputNumber min={70} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HealthDashboard;
