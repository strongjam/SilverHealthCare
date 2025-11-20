from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 사용자 관련 모델
class User(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    phone: str
    emergency_contact: str

class Admin(BaseModel):
    id: str
    username: str
    password: str  # 실제 운영시 해싱 필요
    name: str
    role: str  # admin, guardian
    email: str
    assigned_users: List[str] = []  # 담당하는 어르신 ID 목록

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict
    role: str

# 건강 데이터 모델
class HealthData(BaseModel):
    id: str
    user_id: str
    timestamp: str
    heart_rate: int
    blood_pressure_high: int
    blood_pressure_low: int
    blood_sugar: int
    temperature: float
    oxygen_saturation: int
    status: str

# 복약 관리 모델
class Medication(BaseModel):
    id: str
    user_id: str
    medication_name: str
    dosage: str
    frequency: str  # daily, twice_daily, three_times_daily
    schedule_times: List[str]  # ["08:00", "12:00", "18:00"]
    start_date: str
    end_date: Optional[str] = None
    instructions: Optional[str] = None
    active: bool = True

class MedicationLog(BaseModel):
    id: str
    medication_id: str
    user_id: str
    scheduled_time: str
    actual_time: Optional[str] = None
    status: str  # pending, taken, missed, skipped
    notes: Optional[str] = None

# 응급 알림 모델
class EmergencyAlert(BaseModel):
    id: str
    user_id: str
    timestamp: str
    alert_type: str  # critical_vital, fall_detection, manual
    severity: str  # high, medium, low
    message: str
    vital_signs: Optional[dict] = None
    status: str  # active, acknowledged, resolved
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None

# 건강 리포트 모델
class HealthReport(BaseModel):
    id: str
    user_id: str
    report_date: str
    period_start: str
    period_end: str
    summary: dict  # 평균값, 이상 징후 등
    recommendations: List[str]
    generated_at: str

# 디바이스 관리 모델
class Device(BaseModel):
    id: str
    user_id: str
    device_type: str  # wearable, sensor, gateway
    model: str
    serial_number: str
    battery_level: int  # 0-100
    connection_status: str  # online, offline, error
    firmware_version: str
    last_sync: str
    location: Optional[str] = None

# 사용자(직원) 계정 관리 모델
class Staff(BaseModel):
    id: str
    username: str
    password: str
    name: str
    role: str  # admin, doctor, nurse, caregiver
    email: str
    phone: str
    department: Optional[str] = None
    assigned_users: List[str] = []
    permissions: List[str] = []
    active: bool = True
    created_at: str
    last_login: Optional[str] = None

class ActivityLog(BaseModel):
    id: str
    staff_id: str
    action: str
    target_type: str  # user, device, alert, etc
    target_id: str
    details: Optional[dict] = None
    timestamp: str
    ip_address: Optional[str] = None
