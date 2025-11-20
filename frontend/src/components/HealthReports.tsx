import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Descriptions, Tag, message, Select } from 'antd';
import { FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../services/api';

interface HealthReport {
  id: string;
  user_id: string;
  user_name?: string;
  report_date: string;
  period_start: string;
  period_end: string;
  summary: {
    avg_heart_rate?: number;
    avg_blood_pressure_high?: number;
    avg_blood_pressure_low?: number;
    avg_blood_sugar?: number;
    avg_temperature?: number;
    avg_oxygen_saturation?: number;
    alerts_count?: number;
  };
  recommendations: string[];
  generated_at: string;
}

const HealthReports = () => {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('사용자 로드 실패:', error);
    }
  };

  const loadReports = async (userId?: string) => {
    setLoading(true);
    try {
      const url = userId ? `/api/health-reports/${userId}` : '/api/health-reports/all';
      const response = await api.get(url);
      setReports(response.data);
    } catch (error) {
      message.error('리포트 로드 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadReports();
  }, []);

  const handleGenerateReport = async (userId: string) => {
    try {
      await api.post(`/api/health-reports/generate/${userId}`);
      message.success('리포트 생성 완료');
      loadReports(selectedUserId);
    } catch (error) {
      message.error('리포트 생성 실패');
    }
  };

  const handleViewReport = (report: HealthReport) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const columns = [
    {
      title: '생성일',
      dataIndex: 'generated_at',
      key: 'generated_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('ko-KR')
    },
    {
      title: '어르신',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string) => <strong>{text || '알 수 없음'}</strong>
    },
    {
      title: '기간',
      key: 'period',
      render: (_: any, record: HealthReport) => (
        `${new Date(record.period_start).toLocaleDateString()} - ${new Date(record.period_end).toLocaleDateString()}`
      )
    },
    {
      title: '평균 심박수',
      key: 'heart_rate',
      render: (_: any, record: HealthReport) =>
        record.summary.avg_heart_rate ? `${record.summary.avg_heart_rate.toFixed(0)} bpm` : '-'
    },
    {
      title: '평균 혈압',
      key: 'blood_pressure',
      render: (_: any, record: HealthReport) =>
        record.summary.avg_blood_pressure_high
          ? `${record.summary.avg_blood_pressure_high.toFixed(0)}/${record.summary.avg_blood_pressure_low?.toFixed(0)}`
          : '-'
    },
    {
      title: '알림 수',
      dataIndex: ['summary', 'alerts_count'],
      key: 'alerts_count',
      render: (count: number) => (
        <Tag color={count > 0 ? 'warning' : 'success'}>
          {count || 0}건
        </Tag>
      )
    },
    {
      title: '작업',
      key: 'action',
      render: (_: any, record: HealthReport) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewReport(record)}
          >
            보기
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '12px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: '20px' }} />
            <span>건강 리포트</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="어르신 선택"
              allowClear
              onChange={(value) => {
                setSelectedUserId(value || '');
                loadReports(value);
              }}
            >
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
            {selectedUserId && (
              <Button
                type="primary"
                onClick={() => handleGenerateReport(selectedUserId)}
              >
                리포트 생성
              </Button>
            )}
            <Button onClick={() => loadReports(selectedUserId)} loading={loading}>
              새로고침
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title="건강 리포트 상세"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            닫기
          </Button>
        ]}
        width={800}
      >
        {selectedReport && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="어르신">{selectedReport.user_name}</Descriptions.Item>
              <Descriptions.Item label="생성일">
                {new Date(selectedReport.generated_at).toLocaleString('ko-KR')}
              </Descriptions.Item>
              <Descriptions.Item label="기간" span={2}>
                {new Date(selectedReport.period_start).toLocaleDateString()} - {new Date(selectedReport.period_end).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <Card title="평균 수치" style={{ marginTop: '16px' }} size="small">
              <Descriptions column={2}>
                <Descriptions.Item label="심박수">
                  {selectedReport.summary.avg_heart_rate?.toFixed(1)} bpm
                </Descriptions.Item>
                <Descriptions.Item label="혈압">
                  {selectedReport.summary.avg_blood_pressure_high?.toFixed(1)}/
                  {selectedReport.summary.avg_blood_pressure_low?.toFixed(1)} mmHg
                </Descriptions.Item>
                <Descriptions.Item label="혈당">
                  {selectedReport.summary.avg_blood_sugar?.toFixed(1)} mg/dL
                </Descriptions.Item>
                <Descriptions.Item label="체온">
                  {selectedReport.summary.avg_temperature?.toFixed(1)} °C
                </Descriptions.Item>
                <Descriptions.Item label="산소포화도">
                  {selectedReport.summary.avg_oxygen_saturation?.toFixed(1)} %
                </Descriptions.Item>
                <Descriptions.Item label="알림 발생">
                  {selectedReport.summary.alerts_count || 0}건
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="권장사항" style={{ marginTop: '16px' }} size="small">
              <ul>
                {selectedReport.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HealthReports;
