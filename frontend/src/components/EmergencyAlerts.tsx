import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Descriptions } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../services/api';

interface EmergencyAlert {
  id: string;
  user_id: string;
  user_name: string;
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  vital_signs?: {
    heart_rate?: number;
    blood_pressure_high?: number;
    blood_pressure_low?: number;
    blood_sugar?: number;
    temperature?: number;
    oxygen_saturation?: number;
  };
}

const EmergencyAlerts = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/emergency-alerts');
      setAlerts(response.data);
    } catch (error) {
      message.error('알림 로드 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.put(`/api/emergency-alerts/${alertId}/acknowledge`);
      message.success('알림 확인 완료');
      setModalVisible(false);
      loadAlerts();
    } catch (error) {
      message.error('알림 확인 실패');
    }
  };

  const handleViewDetail = (alert: EmergencyAlert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'default';
      default: return 'default';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return '위급';
      case 'high': return '높음';
      case 'medium': return '중간';
      default: return severity;
    }
  };

  const columns = [
    {
      title: '시간',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('ko-KR')
    },
    {
      title: '어르신',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '유형',
      dataIndex: 'alert_type',
      key: 'alert_type',
    },
    {
      title: '심각도',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>
          {getSeverityText(severity)}
        </Tag>
      )
    },
    {
      title: '메시지',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '상태',
      dataIndex: 'acknowledged',
      key: 'acknowledged',
      render: (acknowledged: boolean) => (
        acknowledged ? (
          <Tag icon={<CheckCircleOutlined />} color="success">확인됨</Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">대기중</Tag>
        )
      )
    },
    {
      title: '작업',
      key: 'action',
      render: (_: any, record: EmergencyAlert) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            상세보기
          </Button>
          {!record.acknowledged && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleAcknowledge(record.id)}
            >
              확인
            </Button>
          )}
        </Space>
      )
    }
  ];

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div style={{ padding: '12px' }}>
      <Card
        title={
          <Space>
            <WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
            <span>응급 알림</span>
            {unacknowledgedCount > 0 && (
              <Tag color="error">{unacknowledgedCount}건 미확인</Tag>
            )}
          </Space>
        }
        extra={
          <Button onClick={loadAlerts} loading={loading}>새로고침</Button>
        }
      >
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => !record.acknowledged ? 'unacknowledged-row' : ''}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title="응급 알림 상세 정보"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            닫기
          </Button>,
          selectedAlert && !selectedAlert.acknowledged && (
            <Button
              key="acknowledge"
              type="primary"
              onClick={() => handleAcknowledge(selectedAlert.id)}
            >
              확인 처리
            </Button>
          )
        ]}
        width={700}
      >
        {selectedAlert && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="어르신" span={2}>
                <strong style={{ fontSize: '16px' }}>{selectedAlert.user_name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="발생 시간" span={2}>
                {new Date(selectedAlert.timestamp).toLocaleString('ko-KR')}
              </Descriptions.Item>
              <Descriptions.Item label="알림 유형">
                {selectedAlert.alert_type}
              </Descriptions.Item>
              <Descriptions.Item label="심각도">
                <Tag color={getSeverityColor(selectedAlert.severity)}>
                  {getSeverityText(selectedAlert.severity)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="상태" span={2}>
                {selectedAlert.acknowledged ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">확인됨</Tag>
                ) : (
                  <Tag icon={<ClockCircleOutlined />} color="warning">대기중</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="메시지" span={2}>
                {selectedAlert.message}
              </Descriptions.Item>
              {selectedAlert.acknowledged_by && (
                <>
                  <Descriptions.Item label="확인자">
                    {selectedAlert.acknowledged_by}
                  </Descriptions.Item>
                  <Descriptions.Item label="확인 시간">
                    {selectedAlert.acknowledged_at ? new Date(selectedAlert.acknowledged_at).toLocaleString('ko-KR') : '-'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedAlert.vital_signs && (
              <Card title="생체 신호" style={{ marginTop: '16px' }} size="small">
                <Descriptions column={2}>
                  {selectedAlert.vital_signs.heart_rate && (
                    <Descriptions.Item label="심박수">
                      <strong style={{ color: selectedAlert.vital_signs.heart_rate > 100 || selectedAlert.vital_signs.heart_rate < 60 ? '#ff4d4f' : 'inherit' }}>
                        {selectedAlert.vital_signs.heart_rate} bpm
                      </strong>
                    </Descriptions.Item>
                  )}
                  {(selectedAlert.vital_signs.blood_pressure_high || selectedAlert.vital_signs.blood_pressure_low) && (
                    <Descriptions.Item label="혈압">
                      <strong style={{ color: selectedAlert.vital_signs.blood_pressure_high && selectedAlert.vital_signs.blood_pressure_high > 140 ? '#ff4d4f' : 'inherit' }}>
                        {selectedAlert.vital_signs.blood_pressure_high}/{selectedAlert.vital_signs.blood_pressure_low} mmHg
                      </strong>
                    </Descriptions.Item>
                  )}
                  {selectedAlert.vital_signs.blood_sugar && (
                    <Descriptions.Item label="혈당">
                      <strong style={{ color: selectedAlert.vital_signs.blood_sugar > 180 || selectedAlert.vital_signs.blood_sugar < 70 ? '#ff4d4f' : 'inherit' }}>
                        {selectedAlert.vital_signs.blood_sugar} mg/dL
                      </strong>
                    </Descriptions.Item>
                  )}
                  {selectedAlert.vital_signs.temperature && (
                    <Descriptions.Item label="체온">
                      <strong style={{ color: selectedAlert.vital_signs.temperature > 37.5 || selectedAlert.vital_signs.temperature < 36.0 ? '#ff4d4f' : 'inherit' }}>
                        {selectedAlert.vital_signs.temperature} °C
                      </strong>
                    </Descriptions.Item>
                  )}
                  {selectedAlert.vital_signs.oxygen_saturation && (
                    <Descriptions.Item label="산소포화도">
                      <strong style={{ color: selectedAlert.vital_signs.oxygen_saturation < 95 ? '#ff4d4f' : 'inherit' }}>
                        {selectedAlert.vital_signs.oxygen_saturation} %
                      </strong>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmergencyAlerts;
