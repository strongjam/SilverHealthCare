from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
from pathlib import Path

app = FastAPI(title="Silver Healthcare API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 저장 경로
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
USERS_FILE = DATA_DIR / "users.json"
HEALTH_DATA_FILE = DATA_DIR / "health_data.json"

# 데이터 모델
class User(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    phone: str
    emergency_contact: str

class HealthData(BaseModel):
    id: str
    user_id: str
    timestamp: str
    heart_rate: int  # 심박수
    blood_pressure_high: int  # 수축기 혈압
    blood_pressure_low: int  # 이완기 혈압
    blood_sugar: int  # 혈당
    temperature: float  # 체온
    oxygen_saturation: int  # 산소포화도
    status: str  # normal, warning, critical

# 데이터 로드 함수
def load_json(file_path: Path, default=None):
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default if default is not None else []

# 데이터 저장 함수
def save_json(file_path: Path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 초기 데이터 설정
def initialize_data():
    if not USERS_FILE.exists():
        users = [
            {
                "id": "user1",
                "name": "김영희",
                "age": 75,
                "gender": "여성",
                "phone": "010-1234-5678",
                "emergency_contact": "010-9876-5432"
            },
            {
                "id": "user2",
                "name": "이철수",
                "age": 68,
                "gender": "남성",
                "phone": "010-2345-6789",
                "emergency_contact": "010-8765-4321"
            }
        ]
        save_json(USERS_FILE, users)

    if not HEALTH_DATA_FILE.exists():
        save_json(HEALTH_DATA_FILE, [])

initialize_data()

@app.get("/")
def read_root():
    return {"message": "Silver Healthcare API", "version": "1.0.0"}

# 사용자 관련 API
@app.get("/api/users", response_model=List[User])
def get_users():
    """모든 사용자 조회"""
    users = load_json(USERS_FILE)
    return users

@app.get("/api/users/{user_id}", response_model=User)
def get_user(user_id: str):
    """특정 사용자 조회"""
    users = load_json(USERS_FILE)
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return user

@app.post("/api/users", response_model=User)
def create_user(user: User):
    """새 사용자 생성"""
    users = load_json(USERS_FILE)
    # 중복 확인
    if any(u["id"] == user.id for u in users):
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자 ID입니다")
    users.append(user.model_dump())
    save_json(USERS_FILE, users)
    return user

# 건강 데이터 관련 API
@app.get("/api/health-data", response_model=List[HealthData])
def get_all_health_data(limit: Optional[int] = 100):
    """모든 건강 데이터 조회"""
    data = load_json(HEALTH_DATA_FILE)
    return data[-limit:] if limit else data

@app.get("/api/health-data/{user_id}", response_model=List[HealthData])
def get_user_health_data(user_id: str, limit: Optional[int] = 50):
    """특정 사용자의 건강 데이터 조회"""
    all_data = load_json(HEALTH_DATA_FILE)
    user_data = [d for d in all_data if d["user_id"] == user_id]
    return user_data[-limit:] if limit else user_data

@app.get("/api/health-data/{user_id}/latest", response_model=Optional[HealthData])
def get_latest_health_data(user_id: str):
    """특정 사용자의 최신 건강 데이터 조회"""
    all_data = load_json(HEALTH_DATA_FILE)
    user_data = [d for d in all_data if d["user_id"] == user_id]
    return user_data[-1] if user_data else None

@app.post("/api/health-data", response_model=HealthData)
def create_health_data(health_data: HealthData):
    """새 건강 데이터 생성"""
    all_data = load_json(HEALTH_DATA_FILE)
    all_data.append(health_data.model_dump())
    save_json(HEALTH_DATA_FILE, all_data)
    return health_data

@app.get("/api/health-data/{user_id}/alerts")
def get_health_alerts(user_id: str):
    """사용자의 건강 알림 조회"""
    all_data = load_json(HEALTH_DATA_FILE)
    user_data = [d for d in all_data if d["user_id"] == user_id]

    if not user_data:
        return {"alerts": []}

    latest = user_data[-1]
    alerts = []

    # 건강 상태 체크
    if latest["heart_rate"] > 100 or latest["heart_rate"] < 60:
        alerts.append({"type": "heart_rate", "message": "심박수가 정상 범위를 벗어났습니다", "severity": "warning"})

    if latest["blood_pressure_high"] > 140 or latest["blood_pressure_low"] > 90:
        alerts.append({"type": "blood_pressure", "message": "혈압이 높습니다", "severity": "warning"})

    if latest["blood_sugar"] > 180 or latest["blood_sugar"] < 70:
        alerts.append({"type": "blood_sugar", "message": "혈당이 정상 범위를 벗어났습니다", "severity": "warning"})

    if latest["temperature"] > 37.5 or latest["temperature"] < 36.0:
        alerts.append({"type": "temperature", "message": "체온이 정상 범위를 벗어났습니다", "severity": "warning"})

    if latest["oxygen_saturation"] < 95:
        alerts.append({"type": "oxygen", "message": "산소포화도가 낮습니다", "severity": "critical"})

    return {"alerts": alerts}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
