import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../services/api';
import type { LoginRequest, LoginResponse } from '../types/index';

interface LoginProps {
  onLoginSuccess: (token: string, user: any, role: string) => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', values);
      const { token, user, role } = response.data;

      // 토큰 저장
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', role);

      message.success('로그인 성공!');
      onLoginSuccess(token, user, role);
    } catch (error: any) {
      message.error(error.response?.data?.detail || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
            silver health care
          </div>
        }
      >
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '사용자명을 입력하세요' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="사용자명"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: '45px' }}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            <strong>테스트 계정:</strong>
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            <div>관리자: admin / admin123</div>
            <div>보호자: guardian / guard123</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
