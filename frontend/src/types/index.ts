export interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  emergency_contact: string;
}

export interface Admin {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'guardian';
  email: string;
  assigned_users: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
  role: string;
}

export interface HealthData {
  id: string;
  user_id: string;
  timestamp: string;
  heart_rate: number;
  blood_pressure_high: number;
  blood_pressure_low: number;
  blood_sugar: number;
  temperature: number;
  oxygen_saturation: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface HealthAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_slots: string[];
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_time: string;
  taken_time?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  notes?: string;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  timestamp: string;
  alert_type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  vital_signs?: HealthData;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface HealthReport {
  id: string;
  user_id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  summary: {
    average_heart_rate: number;
    average_blood_pressure: string;
    average_blood_sugar: number;
    average_temperature: number;
    average_oxygen_saturation: number;
    total_measurements: number;
    abnormal_readings: number;
  };
  recommendations: string[];
  generated_at: string;
}

export interface DashboardOverview {
  total_users: number;
  active_alerts: number;
  today_medications: number;
  missed_medications: number;
  user_statuses: {
    user: User;
    latest_health_data?: HealthData;
    active_alerts: number;
    status: 'normal' | 'warning' | 'critical';
  }[];
}

export interface Device {
  id: string;
  user_id: string;
  device_type: string;
  model: string;
  serial_number: string;
  battery_level: number;
  connection_status: 'online' | 'offline' | 'error';
  firmware_version: string;
  last_sync: string;
  location?: string;
}

export interface Staff {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department?: string;
  assigned_users: string[];
  permissions: string[];
  active: boolean;
  created_at: string;
  last_login?: string;
}

export interface ActivityLog {
  id: string;
  staff_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: any;
  timestamp: string;
  ip_address?: string;
}
