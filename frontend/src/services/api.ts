import axios from 'axios';
import type { User, HealthData } from '../types/index';

// 프로덕션에서는 상대 경로 사용 (nginx 프록시)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 자동으로 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const userApi = {
  getUsers: () => api.get<User[]>('/api/users'),
  getUser: (userId: string) => api.get<User>(`/api/users/${userId}`),
  createUser: (user: User) => api.post<User>('/api/users', user),
};

export const healthApi = {
  getAllHealthData: (limit?: number) =>
    api.get<HealthData[]>('/api/health-data', { params: { limit } }),
  getUserHealthData: (userId: string, limit?: number) =>
    api.get<HealthData[]>(`/api/health-data/${userId}`, { params: { limit } }),
  getLatestHealthData: (userId: string) =>
    api.get<HealthData>(`/api/health-data/${userId}/latest`),
  createHealthData: (data: HealthData) =>
    api.post<HealthData>('/api/health-data', data),
  getHealthAlerts: (userId: string) =>
    api.get(`/api/health-data/${userId}/alerts`),
};

export default api;
