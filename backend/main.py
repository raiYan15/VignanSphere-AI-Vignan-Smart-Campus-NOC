import os
import random
from datetime import datetime
import asyncio
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load both project-root and backend-local env files. backend/.env overrides root values.
load_dotenv(ROOT_DIR / ".env", override=False)
load_dotenv(BASE_DIR / ".env", override=True)


def _fallback_mongo_uri() -> str:
    """Recover Mongo URI from plain one-line .env content when key=value is missing."""
    for env_path in (BASE_DIR / ".env", ROOT_DIR / ".env"):
        if not env_path.exists():
            continue
        try:
            for raw in env_path.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("MONGODB_URI="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
                if line.startswith("mongodb+srv://") or line.startswith("mongodb://"):
                    return line
        except OSError:
            continue
    return ""

MONGODB_URI = os.getenv("MONGODB_URI", "").strip() or _fallback_mongo_uri()
MONGODB_DB = os.getenv("MONGODB_DB", "CampusSphere").strip() or "CampusSphere"

mongo_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=7000) if MONGODB_URI else None
mongo_db = mongo_client.get_database(MONGODB_DB) if mongo_client else None

app = FastAPI(title="CampusSphere AI API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AutopilotRequest(BaseModel):
    mode: str = "optimize"
    scope: str = "campus"


def _nudge(value: float, spread: float, low: float, high: float, precision: int = 2) -> float:
    updated = value + random.uniform(-spread, spread)
    bounded = max(low, min(high, updated))
    return round(bounded, precision)


def _build_realtime_payload():
    health = random.randint(92, 98)
    latency = random.randint(11, 23)
    packet_loss = round(random.uniform(0.09, 0.39), 2)
    connected_devices = random.randint(24100, 24650)
    renewable = random.randint(28, 42)
    security_score = random.randint(89, 96)
    energy_savings = round(random.uniform(11.2, 19.6), 1)
    uptime = round(random.uniform(99.92, 99.99), 2)

    links = [
        {"id": "internet-isp", "from": "Internet", "to": "ISP Router", "utilization": random.randint(54, 82)},
        {"id": "isp-edge", "from": "ISP Router", "to": "Edge Router", "utilization": random.randint(47, 78)},
        {"id": "edge-fw", "from": "Edge Router", "to": "Firewall Cluster", "utilization": random.randint(52, 84)},
        {"id": "fw-core", "from": "Firewall Cluster", "to": "Core Switch", "utilization": random.randint(44, 76)},
        {"id": "core-dist", "from": "Core Switch", "to": "Distribution", "utilization": random.randint(61, 91)},
        {"id": "dist-access", "from": "Distribution", "to": "Access Layer", "utilization": random.randint(58, 95)},
        {"id": "access-ap", "from": "Access Layer", "to": "Wireless APs", "utilization": random.randint(48, 88)},
    ]

    alerts = [
        "⚠ High Latency Detected in Academic Block A",
        "🚨 Rogue Device Connected on Hostel VLAN",
        "🔥 Server Room Temperature Spike",
        "📶 AP Congestion near Auditorium",
    ]

    recommendations = [
        "Move 18% traffic from AP-12 to AP-09",
        "Predicted router failure for ISR-EDGE-02 in 4 days",
        "Upgrade Catalyst 9200 SW-44 firmware",
        "Reduce power usage by 12% in labs after 9 PM",
    ]

    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "missionControl": {
            "campusHealth": health,
            "subscores": {
                "network": max(88, health - random.randint(0, 4)),
                "security": security_score,
                "infrastructure": random.randint(88, 97),
                "energy": random.randint(82, 96),
                "availability": int(uptime),
            },
            "kpis": {
                "connectedDevices": connected_devices,
                "accessPoints": random.randint(532, 558),
                "routers": random.randint(80, 88),
                "switches": random.randint(226, 239),
                "cctvCameras": random.randint(798, 824),
                "iotSensors": random.randint(1380, 1458),
            },
            "alerts": random.sample(alerts, k=4),
            "recommendations": recommendations,
        },
        "noc": {
            "bandwidthGbps": round(random.uniform(8.4, 12.1), 2),
            "throughputGbps": round(random.uniform(6.2, 10.6), 2),
            "packetLoss": packet_loss,
            "latencyMs": latency,
            "jitterMs": random.randint(2, 8),
            "links": links,
        },
        "wifi": {
            "coverage": random.randint(88, 97),
            "channelUsage": random.randint(64, 92),
            "congestion": random.randint(18, 51),
            "interference": random.randint(9, 37),
        },
        "security": {
            "score": security_score,
            "threats": {
                "ddos": random.randint(0, 3),
                "malware": random.randint(0, 4),
                "unauthorized": random.randint(1, 5),
                "portScan": random.randint(2, 8),
                "bruteForce": random.randint(1, 6),
            },
        },
        "energy": {
            "solarGenerationKw": round(random.uniform(340, 570), 1),
            "batteryUsageKw": round(random.uniform(120, 250), 1),
            "gridConsumptionKw": round(random.uniform(610, 980), 1),
            "predictedCostUsd": round(random.uniform(38120, 46380), 2),
            "renewableShare": renewable,
            "savings": energy_savings,
        },
        "executive": {
            "networkUptime": uptime,
            "securityReadiness": security_score,
            "studentConnectivity": random.randint(91, 99),
            "energySavings": energy_savings,
            "infrastructureHealth": random.randint(89, 97),
            "sustainability": random.randint(82, 94),
        },
        "agents": [
            {"name": "Network Agent", "state": "Optimizing traffic", "confidence": _nudge(95, 2.5, 80, 99)},
            {"name": "Security Agent", "state": "Analyzing threats", "confidence": _nudge(92, 2.8, 80, 99)},
            {"name": "Energy Agent", "state": "Reducing consumption", "confidence": _nudge(90, 3.2, 77, 99)},
            {"name": "Infrastructure Agent", "state": "Monitoring equipment", "confidence": _nudge(88, 3.8, 72, 99)},
            {"name": "Campus Assistant Agent", "state": "Responding to admins", "confidence": _nudge(96, 2.2, 84, 99)},
        ],
    }


@app.get("/api/status")
def status():
    return {
        "system": "CampusSphere AI",
        "status": "online",
        "uptime": "99.94%",
        "networkHealth": 94,
        "activeAlerts": 7,
        "activeAgents": [
            "Network Agent",
            "Security Agent",
            "Energy Agent",
            "Infrastructure Agent",
            "Campus Assistant Agent",
        ],
    }


@app.get("/api/mongo-status")
async def mongo_status():
    if not mongo_client:
        return {"connected": False, "error": "MONGODB_URI is not configured"}
    try:
        await mongo_client.admin.command("ping")
        info = await mongo_client.server_info()
        return {
            "connected": True,
            "serverVersion": info.get("version"),
            "database": MONGODB_DB,
        }
    except Exception as exc:
        return {"connected": False, "error": str(exc)}


@app.get("/api/devices")
async def devices():
    if not mongo_db:
        return {"devices": []}
    devices = await mongo_db.device_inventory.find().to_list(20)
    return {"devices": devices}


@app.get("/api/overview")
def overview():
    return {
        "connectedDevices": 4286,
        "activeStudents": 12407,
        "energySavedPercent": 18.2,
        "preventedIncidents": 23,
        "campusEfficiencyScore": 92,
        "networkReliabilityScore": 96,
        "energySustainabilityScore": 88,
        "securityReadinessScore": 94,
    }


@app.get("/api/dashboard")
def dashboard():
    return {
        "network": {
            "accessPoints": 138,
            "connectedDevices": 4286,
            "bandwidthUsage": "1.8 Tbps",
            "packetLoss": "0.21%",
            "latencyMs": 18,
            "healthScore": 94,
        },
        "buildings": [
            {"name": "Academic Block A", "devices": 642, "energy": 68, "wifi": 91, "occupancy": 82, "security": "Secure"},
            {"name": "Innovation Labs", "devices": 538, "energy": 81, "wifi": 74, "occupancy": 66, "security": "Watch"},
            {"name": "Central Library", "devices": 318, "energy": 52, "wifi": 88, "occupancy": 71, "security": "Secure"},
            {"name": "Hostel Cluster", "devices": 1094, "energy": 87, "wifi": 79, "occupancy": 94, "security": "Secure"},
        ],
        "security": {
            "threatLevel": "Low",
            "containedIncidents": 4,
            "rogueDevicesIsolated": 1,
            "suspiciousLoginsChallenged": 2,
        },
        "energy": {
            "monthlyCostForecast": 42800,
            "renewableSharePercent": 31,
            "wastageFindings": ["6 labs idle with HVAC active", "Hostel peak load projected at 8:40 PM"],
        },
    }


@app.get("/api/agents")
def agents():
    return [
        {"name": "Network Agent", "task": "Channel plan recalculated", "health": 96},
        {"name": "Security Agent", "task": "Two anomalies contained", "health": 91},
        {"name": "Energy Agent", "task": "HVAC load shifted", "health": 88},
        {"name": "Infrastructure Agent", "task": "Switch fan risk flagged", "health": 84},
        {"name": "Campus Assistant Agent", "task": "Troubleshooting report ready", "health": 94},
    ]


@app.get("/api/realtime")
def realtime_snapshot():
    return _build_realtime_payload()


@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(_build_realtime_payload())
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return


@app.get("/api/predictions")
def predictions():
    return [
        {"risk": "Network failure", "confidence": 87, "impact": "High", "window": "Next 36 hours"},
        {"risk": "Energy spike", "confidence": 79, "impact": "Medium", "window": "Tonight 8 PM"},
        {"risk": "Device failure", "confidence": 72, "impact": "Medium", "window": "3 days"},
        {"risk": "Overcrowding", "confidence": 64, "impact": "Low", "window": "Tomorrow noon"},
    ]


@app.get("/api/reports")
def reports():
    return {
        "availableExports": [
            "PDF Network Performance Report",
            "Excel Device Inventory",
            "Security Audit",
            "Energy Optimization Report",
            "Incident Timeline",
        ],
        "latestGenerated": "AI troubleshooting report",
    }


@app.post("/api/autopilot")
def autopilot(request: AutopilotRequest):
    return {
        "mode": request.mode,
        "scope": request.scope,
        "status": "engaged",
        "actions": [
            "Optimized AP channel plan",
            "Isolated rogue device",
            "Shifted HVAC load from peak tariff window",
            "Queued preventive maintenance for low-health switch",
            "Generated executive summary report",
        ],
        "result": "Campus Autopilot engaged. AI agents are optimizing coverage, security, energy, and infrastructure health.",
    }
