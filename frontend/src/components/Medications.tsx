import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, TimePicker, Tag, message, Row, Col } from 'antd';
import { MedicineBoxOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

interface Medication {
  id: string;
  user_id: string;
  user_name?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  schedule_times: string[];
  start_date: string;
  end_date?: string;
  instructions?: string;
  active: boolean;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_time: string;
  actual_time?: string;
  status: string;
  notes?: string;
}

const Medications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [form] = Form.useForm();

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('사용자 로드 실패:', error);
    }
  };

  const loadMedications = async (userId?: string) => {
    setLoading(true);
    try {
      const url = userId ? `/api/medications/${userId}` : '/api/medications/all';
      const response = await api.get(url);
      setMedications(response.data);
    } catch (error) {
      message.error('복약 정보 로드 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (userId?: string) => {
    try {
      const url = userId ? `/api/medication-logs/${userId}` : '/api/medication-logs/all';
      const response = await api.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error('복약 기록 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadMedications();
    loadLogs();
  }, []);

  const handleAddMedication = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const scheduleTimesStr = values.schedule_times.map((t: any) =>
        dayjs(t).format('HH:mm')
      );

      await api.post('/api/medications', {
        id: `med_${Date.now()}`,
        user_id: values.user_id,
        medication_name: values.medication_name,
        dosage: values.dosage,
        frequency: values.frequency,
        schedule_times: scheduleTimesStr,
        start_date: values.start_date,
        end_date: values.end_date,
        instructions: values.instructions,
        active: true
      });

      message.success('복약 정보 추가 완료');
      setModalVisible(false);
      loadMedications(selectedUserId);
    } catch (error) {
      message.error('복약 정보 추가 실패');
    }
  };

  const medicationColumns = [
    {
      title: '어르신',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string) => <strong>{text || '알 수 없음'}</strong>
    },
    {
      title: '약물명',
      dataIndex: 'medication_name',
      key: 'medication_name',
    },
    {
      title: '용량',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: '복용 시간',
      dataIndex: 'schedule_times',
      key: 'schedule_times',
      render: (times: string[]) => (
        <Space>
          {times.map((time, idx) => (
            <Tag key={idx}>{time}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '시작일',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR')
    },
    {
      title: '상태',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '활성' : '비활성'}
        </Tag>
      )
    }
  ];

  const logColumns = [
    {
      title: '시간',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('ko-KR')
    },
    {
      title: '약물',
      dataIndex: 'medication_name',
      key: 'medication_name',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: any = {
          taken: { text: '복용 완료', color: 'success', icon: <CheckCircleOutlined /> },
          missed: { text: '미복용', color: 'error', icon: <CloseCircleOutlined /> },
          pending: { text: '대기중', color: 'warning', icon: null }
        };
        const s = statusMap[status] || statusMap.pending;
        return <Tag icon={s.icon} color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '실제 복용 시간',
      dataIndex: 'actual_time',
      key: 'actual_time',
      render: (text: string) => text ? new Date(text).toLocaleString('ko-KR') : '-'
    },
    {
      title: '메모',
      dataIndex: 'notes',
      key: 'notes',
      render: (text: string) => text || '-'
    }
  ];

  return (
    <div style={{ padding: '12px' }}>
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <MedicineBoxOutlined style={{ fontSize: '20px' }} />
                <span>복약 관리</span>
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
                    loadMedications(value);
                    loadLogs(value);
                  }}
                >
                  {users.map(user => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddMedication}
                >
                  복약 추가
                </Button>
                <Button onClick={() => {
                  loadMedications(selectedUserId);
                  loadLogs(selectedUserId);
                }} loading={loading}>
                  새로고침
                </Button>
              </Space>
            }
          >
            <Table
              columns={medicationColumns}
              dataSource={medications}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="복약 기록">
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="복약 정보 추가"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="user_id"
            label="어르신"
            rules={[{ required: true, message: '어르신을 선택하세요' }]}
          >
            <Select placeholder="선택하세요">
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="medication_name"
            label="약물명"
            rules={[{ required: true, message: '약물명을 입력하세요' }]}
          >
            <Input placeholder="예: 혈압약" />
          </Form.Item>

          <Form.Item
            name="dosage"
            label="용량"
            rules={[{ required: true, message: '용량을 입력하세요' }]}
          >
            <Input placeholder="예: 1정" />
          </Form.Item>

          <Form.Item
            name="frequency"
            label="복용 빈도"
            rules={[{ required: true, message: '복용 빈도를 선택하세요' }]}
          >
            <Select>
              <Select.Option value="daily">매일</Select.Option>
              <Select.Option value="twice_daily">하루 2회</Select.Option>
              <Select.Option value="three_times_daily">하루 3회</Select.Option>
              <Select.Option value="weekly">주 1회</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="schedule_times"
            label="복용 시간"
            rules={[{ required: true, message: '복용 시간을 선택하세요' }]}
          >
            <TimePicker.RangePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="start_date"
            label="시작일"
            rules={[{ required: true, message: '시작일을 입력하세요' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item name="end_date" label="종료일">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="instructions" label="복용 지침">
            <Input.TextArea rows={3} placeholder="식후 30분 복용" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Medications;
