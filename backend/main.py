from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
import json
import secrets
from pathlib import Path
from models import (
    User, Admin, LoginRequest, LoginResponse,
    HealthData, Medication, MedicationLog,
    EmergencyAlert, HealthReport
)

app = FastAPI(title="Silver Healthcare API - Extended")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 저장 경로
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# 데이터 파일
USERS_FILE = DATA_DIR / "users.json"
ADMINS_FILE = DATA_DIR / "admins.json"
HEALTH_DATA_FILE = DATA_DIR / "health_data.json"
MEDICATIONS_FILE = DATA_DIR / "medications.json"
MEDICATION_LOGS_FILE = DATA_DIR / "medication_logs.json"
EMERGENCY_ALERTS_FILE = DATA_DIR / "emergency_alerts.json"
HEALTH_REPORTS_FILE = DATA_DIR / "health_reports.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"

# 데이터 로드/저장 함수
def load_json(file_path: Path, default=None):
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default if default is not None else []

def save_json(file_path: Path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 초기 데이터 설정
def initialize_data():
    # 사용자 데이터
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

    # 관리자 데이터
    if not ADMINS_FILE.exists():
        admins = [
            {
                "id": "admin1",
                "username": "admin",
                "password": "admin123",  # 실제 운영시 해싱 필요
                "name": "관리자",
                "role": "admin",
                "email": "admin@silverhealthcare.com",
                "assigned_users": ["user1", "user2"]
            },
            {
                "id": "guardian1",
                "username": "guardian",
                "password": "guard123",
                "name": "보호자",
                "role": "guardian",
                "email": "guardian@silverhealthcare.com",
                "assigned_users": ["user1"]
            }
        ]
        save_json(ADMINS_FILE, admins)

    # 빈 파일들 초기화
    for file in [HEALTH_DATA_FILE, MEDICATIONS_FILE, MEDICATION_LOGS_FILE,
                 EMERGENCY_ALERTS_FILE, HEALTH_REPORTS_FILE, SESSIONS_FILE]:
        if not file.exists():
            save_json(file, [])

initialize_data()

# 인증 관련
def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

    token = authorization.replace("Bearer ", "")
    sessions = load_json(SESSIONS_FILE)
    session = next((s for s in sessions if s["token"] == token), None)

    if not session:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")

    # 토큰 만료 확인 (24시간)
    created_at = datetime.fromisoformat(session["created_at"])
    if datetime.now() - created_at > timedelta(hours=24):
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다")

    return session

# ===== 인증 API =====
@app.post("/api/auth/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """로그인"""
    admins = load_json(ADMINS_FILE)
    admin = next((a for a in admins if a["username"] == request.username and
                  a["password"] == request.password), None)

    if not admin:
        raise HTTPException(status_code=401, detail="사용자명 또는 비밀번호가 잘못되었습니다")

    # 세션 생성
    token = secrets.token_urlsafe(32)
    sessions = load_json(SESSIONS_FILE)
    session = {
        "token": token,
        "admin_id": admin["id"],
        "username": admin["username"],
        "role": admin["role"],
        "created_at": datetime.now().isoformat()
    }
    sessions.append(session)
    save_json(SESSIONS_FILE, sessions)

    return LoginResponse(
        token=token,
        user={"id": admin["id"], "name": admin["name"], "username": admin["username"]},
        role=admin["role"]
    )

@app.post("/api/auth/logout")
def logout(session: dict = Depends(verify_token)):
    """로그아웃"""
    sessions = load_json(SESSIONS_FILE)
    sessions = [s for s in sessions if s["token"] != session["token"]]
    save_json(SESSIONS_FILE, sessions)
    return {"message": "로그아웃되었습니다"}

@app.get("/api/auth/me")
def get_current_user(session: dict = Depends(verify_token)):
    """현재 로그인한 사용자 정보"""
    admins = load_json(ADMINS_FILE)
    admin = next((a for a in admins if a["id"] == session["admin_id"]), None)
    if not admin:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    # 비밀번호 제외
    admin_copy = admin.copy()
    admin_copy.pop("password", None)
    return admin_copy

# ===== 사용자 API (기존) =====
@app.get("/api/users", response_model=List[User])
def get_users(session: dict = Depends(verify_token)):
    """모든 사용자 조회"""
    admins = load_json(ADMINS_FILE)
    admin = next((a for a in admins if a["id"] == session["admin_id"]), None)

    users = load_json(USERS_FILE)

    # guardian인 경우 담당 사용자만 반환
    if admin and admin["role"] == "guardian":
        users = [u for u in users if u["id"] in admin.get("assigned_users", [])]

    return users

@app.get("/api/users/{user_id}", response_model=User)
def get_user(user_id: str, session: dict = Depends(verify_token)):
    """특정 사용자 조회"""
    users = load_json(USERS_FILE)
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return user

# ===== 건강 데이터 API (기존) =====
@app.get("/api/health-data/{user_id}", response_model=List[HealthData])
def get_user_health_data(user_id: str, limit: Optional[int] = 50,
                         session: dict = Depends(verify_token)):
    """특정 사용자의 건강 데이터 조회"""
    all_data = load_json(HEALTH_DATA_FILE)
    user_data = [d for d in all_data if d["user_id"] == user_id]
    return user_data[-limit:] if limit else user_data

@app.get("/api/health-data/{user_id}/latest")
def get_latest_health_data(user_id: str, session: dict = Depends(verify_token)):
    """최신 건강 데이터"""
    all_data = load_json(HEALTH_DATA_FILE)
    user_data = [d for d in all_data if d["user_id"] == user_id]
    return user_data[-1] if user_data else None

@app.post("/api/health-data", response_model=HealthData)
def create_health_data(health_data: HealthData, session: dict = Depends(verify_token)):
    """건강 데이터 생성"""
    all_data = load_json(HEALTH_DATA_FILE)
    all_data.append(health_data.model_dump())
    save_json(HEALTH_DATA_FILE, all_data)

    # 응급 상황 체크 및 알림 생성
    check_emergency_conditions(health_data)

    return health_data

@app.get("/api/health-data/{user_id}/alerts")
def get_health_alerts(user_id: str, session: dict = Depends(verify_token)):
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

# ===== 복약 관리 API =====
@app.get("/api/medications/{user_id}")
def get_user_medications(user_id: str, session: dict = Depends(verify_token)):
    """사용자의 복약 목록"""
    medications = load_json(MEDICATIONS_FILE)
    users = load_json(USERS_FILE)

    # 사용자 이름 매핑
    user_map = {u["id"]: u["name"] for u in users}

    user_meds = [m for m in medications if m["user_id"] == user_id]

    # 사용자 이름 추가
    for med in user_meds:
        med["user_name"] = user_map.get(med["user_id"], "알 수 없음")

    return user_meds

@app.post("/api/medications", response_model=Medication)
def create_medication(medication: Medication, session: dict = Depends(verify_token)):
    """복약 정보 생성"""
    medications = load_json(MEDICATIONS_FILE)
    medications.append(medication.model_dump())
    save_json(MEDICATIONS_FILE, medications)
    return medication

@app.get("/api/medication-logs/{user_id}")
def get_medication_logs(user_id: str, date: Optional[str] = None,
                        session: dict = Depends(verify_token)):
    """복약 기록 조회"""
    logs = load_json(MEDICATION_LOGS_FILE)
    user_logs = [l for l in logs if l["user_id"] == user_id]

    if date:
        user_logs = [l for l in user_logs if l["scheduled_time"].startswith(date)]

    return user_logs

@app.post("/api/medication-logs", response_model=MedicationLog)
def create_medication_log(log: MedicationLog, session: dict = Depends(verify_token)):
    """복약 기록 생성"""
    logs = load_json(MEDICATION_LOGS_FILE)
    logs.append(log.model_dump())
    save_json(MEDICATION_LOGS_FILE, logs)
    return log

@app.put("/api/medication-logs/{log_id}")
def update_medication_log(log_id: str, status: str, taken_time: Optional[str] = None,
                          session: dict = Depends(verify_token)):
    """복약 기록 업데이트"""
    logs = load_json(MEDICATION_LOGS_FILE)
    log = next((l for l in logs if l["id"] == log_id), None)

    if not log:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다")

    log["status"] = status
    if taken_time:
        log["taken_time"] = taken_time

    save_json(MEDICATION_LOGS_FILE, logs)
    return log

# ===== 응급 알림 API =====
@app.get("/api/emergency-alerts")
def get_emergency_alerts(status: Optional[str] = None,
                        session: dict = Depends(verify_token)):
    """응급 알림 목록"""
    alerts = load_json(EMERGENCY_ALERTS_FILE)
    users = load_json(USERS_FILE)
    health_data = load_json(HEALTH_DATA_FILE)

    # 사용자 이름 매핑
    user_map = {u["id"]: u["name"] for u in users}

    if status:
        alerts = [a for a in alerts if a["status"] == status]

    # 사용자 이름 및 생체 신호 추가
    for alert in alerts:
        alert["user_name"] = user_map.get(alert["user_id"], "알 수 없음")

        # 해당 사용자의 최신 건강 데이터 가져오기
        user_health_data = [d for d in health_data if d["user_id"] == alert["user_id"]]
        if user_health_data:
            latest_health = user_health_data[-1]
            alert["vital_signs"] = {
                "heart_rate": latest_health.get("heart_rate"),
                "blood_pressure_high": latest_health.get("blood_pressure_high"),
                "blood_pressure_low": latest_health.get("blood_pressure_low"),
                "blood_sugar": latest_health.get("blood_sugar"),
                "temperature": latest_health.get("temperature"),
                "oxygen_saturation": latest_health.get("oxygen_saturation")
            }

    # 최신순 정렬
    alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    return alerts

@app.post("/api/emergency-alerts", response_model=EmergencyAlert)
def create_emergency_alert(alert: EmergencyAlert, session: dict = Depends(verify_token)):
    """응급 알림 생성"""
    alerts = load_json(EMERGENCY_ALERTS_FILE)
    alerts.append(alert.model_dump())
    save_json(EMERGENCY_ALERTS_FILE, alerts)
    return alert

@app.put("/api/emergency-alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, session: dict = Depends(verify_token)):
    """알림 확인"""
    alerts = load_json(EMERGENCY_ALERTS_FILE)
    alert = next((a for a in alerts if a["id"] == alert_id), None)

    if not alert:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")

    alert["acknowledged"] = True
    alert["acknowledged_by"] = session.get("admin_id", session.get("username", "관리자"))
    alert["acknowledged_at"] = datetime.now().isoformat()

    save_json(EMERGENCY_ALERTS_FILE, alerts)
    return alert

def check_emergency_conditions(health_data: HealthData):
    """응급 상황 체크"""
    alerts = []

    # 심박수 체크
    if health_data.heart_rate > 120 or health_data.heart_rate < 50:
        alerts.append({
            "type": "heart_rate",
            "severity": "high" if (health_data.heart_rate > 140 or health_data.heart_rate < 45) else "medium",
            "message": f"비정상 심박수 감지: {health_data.heart_rate}bpm"
        })

    # 혈압 체크
    if health_data.blood_pressure_high > 160 or health_data.blood_pressure_low > 100:
        alerts.append({
            "type": "blood_pressure",
            "severity": "high",
            "message": f"고혈압 감지: {health_data.blood_pressure_high}/{health_data.blood_pressure_low}mmHg"
        })

    # 산소포화도 체크
    if health_data.oxygen_saturation < 90:
        alerts.append({
            "type": "oxygen_saturation",
            "severity": "high",
            "message": f"낮은 산소포화도 감지: {health_data.oxygen_saturation}%"
        })

    # 알림 생성
    all_alerts = load_json(EMERGENCY_ALERTS_FILE)
    for alert_info in alerts:
        alert = EmergencyAlert(
            id=f"alert-{datetime.now().timestamp()}",
            user_id=health_data.user_id,
            timestamp=datetime.now().isoformat(),
            alert_type="critical_vital",
            severity=alert_info["severity"],
            message=alert_info["message"],
            vital_signs=health_data.model_dump(),
            status="active"
        )
        all_alerts.append(alert.model_dump())

    if alerts:
        save_json(EMERGENCY_ALERTS_FILE, all_alerts)

# ===== 건강 리포트 API =====
@app.get("/api/health-reports/{user_id}")
def get_health_reports(user_id: str, session: dict = Depends(verify_token)):
    """건강 리포트 목록"""
    reports = load_json(HEALTH_REPORTS_FILE)
    users = load_json(USERS_FILE)

    # 사용자 이름 매핑
    user_map = {u["id"]: u["name"] for u in users}

    user_reports = [r for r in reports if r["user_id"] == user_id]

    # 사용자 이름 추가
    for report in user_reports:
        report["user_name"] = user_map.get(report["user_id"], "알 수 없음")

    return user_reports

@app.post("/api/health-reports/generate/{user_id}")
def generate_health_report(user_id: str, period_days: int = 7,
                          session: dict = Depends(verify_token)):
    """건강 리포트 자동 생성"""
    # 최근 period_days 일간의 데이터 수집
    end_date = datetime.now()
    start_date = end_date - timedelta(days=period_days)

    all_data = load_json(HEALTH_DATA_FILE)
    period_data = []
    for d in all_data:
        if d["user_id"] == user_id:
            try:
                timestamp = datetime.fromisoformat(d["timestamp"])
                # timezone 정보를 제거하여 비교
                if timestamp.tzinfo:
                    timestamp = timestamp.replace(tzinfo=None)
                if start_date <= timestamp <= end_date:
                    period_data.append(d)
            except (ValueError, KeyError):
                continue

    if not period_data:
        raise HTTPException(status_code=404, detail="기간 내 데이터가 없습니다")

    # 통계 계산
    summary = {
        "avg_heart_rate": sum(d["heart_rate"] for d in period_data) / len(period_data),
        "avg_blood_pressure_high": sum(d['blood_pressure_high'] for d in period_data) / len(period_data),
        "avg_blood_pressure_low": sum(d['blood_pressure_low'] for d in period_data) / len(period_data),
        "avg_blood_sugar": sum(d["blood_sugar"] for d in period_data) / len(period_data),
        "avg_temperature": sum(d["temperature"] for d in period_data) / len(period_data),
        "avg_oxygen_saturation": sum(d["oxygen_saturation"] for d in period_data) / len(period_data),
        "alerts_count": sum(1 for d in period_data if d.get("status") != "normal")
    }

    # 권장사항 생성
    recommendations = []
    if summary["avg_heart_rate"] > 90:
        recommendations.append("심박수가 평균보다 높습니다. 휴식을 취하고 스트레스를 줄이세요.")
    if summary["avg_blood_sugar"] > 150:
        recommendations.append("혈당 수치가 높습니다. 식단 관리에 주의하세요.")
    if summary["alerts_count"] > len(period_data) * 0.3:
        recommendations.append("비정상 수치가 자주 발생합니다. 의사와 상담하세요.")

    if not recommendations:
        recommendations.append("건강 상태가 양호합니다. 현재의 생활 습관을 유지하세요.")

    # 리포트 저장
    report = HealthReport(
        id=f"report-{datetime.now().timestamp()}",
        user_id=user_id,
        report_date=datetime.now().date().isoformat(),
        period_start=start_date.isoformat(),
        period_end=end_date.isoformat(),
        summary=summary,
        recommendations=recommendations,
        generated_at=datetime.now().isoformat()
    )

    reports = load_json(HEALTH_REPORTS_FILE)
    reports.append(report.model_dump())
    save_json(HEALTH_REPORTS_FILE, reports)

    return report

# ===== 대시보드 API =====
@app.get("/api/dashboard/overview")
def get_dashboard_overview(session: dict = Depends(verify_token)):
    """보호자/운영자 대시보드 개요"""
    admins = load_json(ADMINS_FILE)
    admin = next((a for a in admins if a["id"] == session["admin_id"]), None)

    users = load_json(USERS_FILE)
    if admin["role"] == "guardian":
        users = [u for u in users if u["id"] in admin.get("assigned_users", [])]

    health_data = load_json(HEALTH_DATA_FILE)
    alerts = load_json(EMERGENCY_ALERTS_FILE)
    medications = load_json(MEDICATIONS_FILE)
    med_logs = load_json(MEDICATION_LOGS_FILE)

    # 통계 계산
    active_alerts = [a for a in alerts if a["status"] == "active"]
    today = datetime.now().date().isoformat()
    today_medications = [l for l in med_logs if l["scheduled_time"].startswith(today)]
    missed_medications = [l for l in today_medications if l["status"] == "missed"]

    user_statuses = []
    for user in users:
        latest_data = next((d for d in reversed(health_data) if d["user_id"] == user["id"]), None)
        user_alerts = [a for a in active_alerts if a["user_id"] == user["id"]]

        user_statuses.append({
            "user": user,
            "latest_health_data": latest_data,
            "active_alerts": len(user_alerts),
            "status": "critical" if user_alerts else ("warning" if latest_data and latest_data.get("status") != "normal" else "normal")
        })

    return {
        "total_users": len(users),
        "active_alerts": len(active_alerts),
        "today_medications": len(today_medications),
        "missed_medications": len(missed_medications),
        "user_statuses": user_statuses
    }

@app.get("/")
def read_root():
    return {
        "message": "Silver Healthcare API - Extended",
        "version": "2.0.0",
        "features": ["인증", "복약 관리", "응급 알림", "건강 리포트", "대시보드"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
