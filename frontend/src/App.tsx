import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import type { Mesh } from 'three'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type PageId =
  | 'mission-control'
  | 'digital-twin'
  | 'noc'
  | 'wifi'
  | 'soc'
  | 'inventory'
  | 'cctv'
  | 'energy'
  | 'predictive'
  | 'ai-command'
  | 'autopilot'
  | 'executive'
  | 'voice'
  | 'incident'

type RealtimePayload = {
  timestamp: string
  missionControl: {
    campusHealth: number
    subscores: {
      network: number
      security: number
      infrastructure: number
      energy: number
      availability: number
    }
    kpis: {
      connectedDevices: number
      accessPoints: number
      routers: number
      switches: number
      cctvCameras: number
      iotSensors: number
    }
    alerts: string[]
    recommendations: string[]
  }
  noc: {
    bandwidthGbps: number
    throughputGbps: number
    packetLoss: number
    latencyMs: number
    jitterMs: number
    links: Array<{ id: string; from: string; to: string; utilization: number }>
  }
  wifi: {
    coverage: number
    channelUsage: number
    congestion: number
    interference: number
  }
  security: {
    score: number
    threats: {
      ddos: number
      malware: number
      unauthorized: number
      portScan: number
      bruteForce: number
    }
  }
  energy: {
    solarGenerationKw: number
    batteryUsageKw: number
    gridConsumptionKw: number
    predictedCostUsd: number
    renewableShare: number
    savings: number
  }
  executive: {
    networkUptime: number
    securityReadiness: number
    studentConnectivity: number
    energySavings: number
    infrastructureHealth: number
    sustainability: number
  }
  agents: Array<{ name: string; state: string; confidence: number }>
}

type CampusStructure = {
  id: string
  name: string
  position: [number, number]
  size: [number, number, number]
  type: string
  color: string
  roofColor?: string
  rotation?: number
  badge?: string
  labelOffset?: [number, number, number]
  annexes?: Array<{
    position: [number, number, number]
    size: [number, number, number]
    color?: string
    roofColor?: string
  }>
}

type CampusSurface = {
  id: string
  name: string
  position: [number, number]
  size: [number, number]
  color: string
  rotation?: number
  labelOffset?: [number, number, number]
  shape?: 'rect' | 'oval'
}

type RoadSegment = {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  rotation?: number
  laneMarks?: boolean
}

type LinkAnchor = {
  id: string
  position: [number, number, number]
  label: string
}

type TopologyVertex = {
  id: string
  label: string
  subtitle?: string
  position: [number, number, number]
  tone?: 'core' | 'dist' | 'access' | 'edge' | 'building' | 'wifi' | 'firewall'
}

type VoiceCommandRecord = {
  id: number
  command: string
  time: string
  buildingId: string
  intent: string
  status: 'completed' | 'in-progress'
  responseMs: number
}

type SpeechRecognitionResultLike = {
  0: { transcript: string }
  isFinal: boolean
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: SpeechRecognitionResultLike[]
}

type SpeechRecognitionErrorEventLike = {
  error?: string
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
}

const pages: Array<{ id: PageId; label: string; eyebrow: string }> = [
  { id: 'mission-control', label: 'Mission Control Dashboard', eyebrow: 'Page 1' },
  { id: 'digital-twin', label: 'Campus Digital Twin', eyebrow: 'Page 2' },
  { id: 'noc', label: 'Network Operations Center', eyebrow: 'Page 3' },
  { id: 'wifi', label: 'Wi-Fi Intelligence Center', eyebrow: 'Page 4' },
  { id: 'soc', label: 'Security Operations Center', eyebrow: 'Page 5' },
  { id: 'inventory', label: 'Device Inventory Center', eyebrow: 'Page 6' },
  { id: 'cctv', label: 'Smart CCTV Analytics', eyebrow: 'Page 7' },
  { id: 'energy', label: 'Energy Intelligence Center', eyebrow: 'Page 8' },
  { id: 'predictive', label: 'Predictive Analytics Center', eyebrow: 'Page 9' },
  { id: 'ai-command', label: 'AI Command Center', eyebrow: 'Page 10' },
  { id: 'autopilot', label: 'Campus Autopilot', eyebrow: 'Page 11' },
  { id: 'executive', label: 'Executive Analytics Center', eyebrow: 'Page 12' },
  { id: 'voice', label: 'AI Voice Command Center', eyebrow: 'Page 13' },
  { id: 'incident', label: 'Incident Command Center', eyebrow: 'Page 14' },
]

const buildings: CampusStructure[] = [
  {
    id: 'girls-accommodation',
    name: 'Girls Accommodation',
    type: 'Residential',
    position: [-11.7, 0.3],
    size: [1.6, 2.6, 1.3],
    color: '#e6dccd',
    roofColor: '#f2b46f',
    badge: 'GA',
    labelOffset: [-0.3, 3.5, 0],
    annexes: [
      { position: [-0.9, 0, 0.1], size: [0.7, 2.1, 1.2], color: '#e2d4c3', roofColor: '#f2b46f' },
      { position: [0.82, 0, -0.15], size: [0.75, 2.05, 1.05], color: '#e8dcc9', roofColor: '#f2b46f' },
    ],
  },
  {
    id: 'girls-hostel',
    name: 'Girls Hostel',
    type: 'Residential',
    position: [-11.2, 2.3],
    size: [2.3, 1.2, 1.15],
    color: '#f1cfaa',
    roofColor: '#f7b766',
    badge: 'GH',
    labelOffset: [-0.5, 2.2, 0],
  },
  {
    id: 'lara-west',
    name: 'Vignan LARA - West',
    type: 'Academic',
    position: [-5.7, 4.4],
    size: [3.2, 2.8, 2],
    color: '#b68068',
    roofColor: '#d0c1ac',
    badge: 'LW',
    labelOffset: [0, 3.75, 0],
    annexes: [
      { position: [-1.15, 0, 0], size: [0.7, 2.4, 1.85], color: '#a96f58', roofColor: '#d0c1ac' },
      { position: [1.15, 0, 0], size: [0.7, 2.4, 1.85], color: '#a96f58', roofColor: '#d0c1ac' },
    ],
  },
  {
    id: 'lara-east',
    name: 'Vignan LARA',
    type: 'Academic',
    position: [-1.2, 4.55],
    size: [3.6, 3, 2.2],
    color: '#b68068',
    roofColor: '#d0c1ac',
    badge: 'LE',
    labelOffset: [0, 4, 0],
    annexes: [
      { position: [-1.35, 0, 0], size: [0.8, 2.6, 2], color: '#a96f58', roofColor: '#d0c1ac' },
      { position: [1.35, 0, 0], size: [0.8, 2.6, 2], color: '#a96f58', roofColor: '#d0c1ac' },
    ],
  },
  {
    id: 'convocation-hall',
    name: 'Convocation Hall',
    type: 'Events',
    position: [-4.6, -4.35],
    size: [2.1, 1.15, 1.35],
    color: '#cfc9be',
    roofColor: '#e6ded0',
    badge: '12',
  },
  {
    id: 'u-block',
    name: 'U-Block',
    type: 'Academic',
    position: [-0.2, -1.15],
    size: [3.2, 2.2, 2.5],
    color: '#ff5864',
    roofColor: '#75685b',
    badge: '10',
    annexes: [
      { position: [-1.55, 0, 0], size: [0.78, 2.05, 2.25], color: '#ff4c5d', roofColor: '#75685b' },
      { position: [1.55, 0, 0], size: [0.78, 2.05, 2.25], color: '#ff4c5d', roofColor: '#75685b' },
    ],
  },
  {
    id: 'n-block',
    name: 'N-Block',
    type: 'Academic',
    position: [3.9, -0.85],
    size: [3.3, 2.5, 2.5],
    color: '#d5c5b0',
    roofColor: '#ece1d2',
    badge: '8',
    annexes: [{ position: [0, 1.28, 0], size: [1.45, 0.85, 1.1], color: '#c5b398', roofColor: '#efe7db' }],
  },
  {
    id: 'mhp',
    name: 'MHP',
    type: 'Support',
    position: [6.4, -1.1],
    size: [0.85, 1.05, 0.9],
    color: '#6f6f73',
    roofColor: '#86868d',
    badge: '7',
  },
  {
    id: 'pharmacy',
    name: 'Vignan Pharmacy College',
    type: 'Academic',
    position: [9.4, 2.3],
    size: [2.2, 2.7, 1.55],
    color: '#f0d2aa',
    roofColor: '#f3eadb',
    badge: 'P',
    labelOffset: [0.3, 3.1, 0],
    annexes: [
      { position: [0.95, 0, 0.3], size: [0.55, 2.3, 0.55], color: '#dcaa77', roofColor: '#f3eadb' },
      { position: [0.2, 0, -0.15], size: [0.5, 2.15, 0.5], color: '#dcaa77', roofColor: '#f3eadb' },
    ],
  },
  {
    id: 'boys-hostel',
    name: 'Boys Hostel',
    type: 'Residential',
    position: [10.2, -0.15],
    size: [3.6, 3.2, 1.6],
    color: '#ff5762',
    roofColor: '#696972',
    badge: '5',
    annexes: [
      { position: [-1.25, 0, 0], size: [0.72, 3.15, 1.55], color: '#ff5562', roofColor: '#696972' },
      { position: [1.25, 0, 0], size: [0.72, 3.15, 1.55], color: '#ff5562', roofColor: '#696972' },
      { position: [2.1, 0, 0.55], size: [0.66, 2.6, 1.15], color: '#ff5562', roofColor: '#696972' },
    ],
  },
  {
    id: 'h-block',
    name: 'H-Block',
    type: 'Academic',
    position: [8.6, -3.5],
    size: [3.2, 1.65, 2],
    color: '#ff5562',
    roofColor: '#6a5e57',
    badge: '4',
    annexes: [
      { position: [-1.4, 0, 0.75], size: [0.65, 1.45, 0.85], color: '#ff5562', roofColor: '#6a5e57' },
      { position: [1.35, 0, 0.75], size: [0.65, 1.45, 0.85], color: '#ff5562', roofColor: '#6a5e57' },
    ],
  },
  {
    id: 'library',
    name: 'Library',
    type: 'Knowledge Hub',
    position: [6.1, -5.25],
    size: [1.55, 0.75, 1.15],
    color: '#d4ccbf',
    roofColor: '#e8e1d6',
    badge: '3',
  },
  {
    id: 'registrations',
    name: 'Registrations',
    type: 'Support',
    position: [4.2, -5.15],
    size: [1.15, 0.66, 0.9],
    color: '#cfc6ba',
    roofColor: '#e6ddd0',
    badge: '1',
  },
  {
    id: 'a-block',
    name: 'A-Block',
    type: 'Academic',
    position: [10.8, -5.25],
    size: [3.2, 2.15, 2.2],
    color: '#d3c7b8',
    roofColor: '#efdfc4',
    badge: '2',
    annexes: [{ position: [-0.25, 0.7, -0.3], size: [1.2, 0.8, 1.15], color: '#f4d198', roofColor: '#f8ead1' }],
  },
]

const campusSurfaces: CampusSurface[] = [
  { id: 'pond', name: 'Vignan Pond', position: [-11.5, -2.55], size: [2.25, 1.55], color: '#84a8bf', shape: 'oval', labelOffset: [0, 0.35, 0] },
  { id: 'cricket', name: 'Cricket Ground', position: [-0.25, 0.05], size: [5.8, 3.6], color: '#2c372b', shape: 'oval', labelOffset: [0, 0.35, 0] },
  { id: 'amusement', name: 'Amusement Arena', position: [-8.1, 0.95], size: [2.4, 1.2], color: '#d9916c', rotation: 0.02 },
  { id: 'flea', name: 'Flea Market', position: [-8.0, -0.45], size: [2.65, 1.15], color: '#d9916c', rotation: 0.02 },
  { id: 'throwball', name: 'Throwball Courts', position: [-8.05, -2.25], size: [1.55, 1.45], color: '#d68f67', rotation: 0.02 },
  { id: 'basketball', name: 'Basketball Courts', position: [-6.2, -2.1], size: [1.55, 1.55], color: '#d68f67', rotation: 0.02 },
  { id: 'volleyball', name: 'Volleyball Courts', position: [-6.9, -4.0], size: [2.5, 0.72], color: '#cc865d', rotation: 0.02 },
  { id: 'long-jump', name: 'Long Jump', position: [-4.4, 0.05], size: [1.1, 0.42], color: '#db9668', rotation: 0.1 },
  { id: 'sports-1', name: 'Sports Arena - 1', position: [5.55, 1.0], size: [2.25, 1.2], color: '#da8f67', rotation: 0.04 },
  { id: 'badminton', name: 'Badminton Courts', position: [7.25, 0.2], size: [1.25, 0.78], color: '#ddb08a', rotation: 0.08 },
  { id: 'hockey', name: 'Hockey Field', position: [13.05, -4.05], size: [3.7, 3.55], color: '#cf8d66', rotation: 0.02 },
]

const roadSegments: RoadSegment[] = [
  { id: 'main-road', position: [1.15, 0.02, -7.42], size: [30, 0.05, 1.18], rotation: -0.18, laneMarks: true },
  { id: 'left-spine', position: [-8.4, 0.02, -0.35], size: [0.74, 0.05, 8.6], rotation: 0.2 },
  { id: 'center-spine', position: [-3.9, 0.02, 1.4], size: [0.74, 0.05, 7.9], rotation: -0.4 },
  { id: 'top-road', position: [-1.6, 0.02, 2.15], size: [13.8, 0.05, 0.52], rotation: 0.05 },
  { id: 'mid-road', position: [3.35, 0.02, -0.25], size: [10.8, 0.05, 0.46], rotation: 0.12 },
  { id: 'right-spine', position: [7.65, 0.02, -3.05], size: [0.66, 0.05, 5.55], rotation: 0.48 },
  { id: 'hostel-connector', position: [10.25, 0.02, -2.05], size: [0.58, 0.05, 2.85], rotation: 0.23 },
  { id: 'library-turn', position: [5.1, 0.02, -5.05], size: [3.2, 0.05, 0.5], rotation: 0.1 },
]

const networkAnchors: LinkAnchor[] = [
  { id: 'girls-hostel', label: 'Girls Hostel', position: [-10.65, 1.85, 2.2] },
  { id: 'lara-west', label: 'LARA West', position: [-5.7, 3.7, 4.4] },
  { id: 'lara-east', label: 'LARA Main', position: [-1.1, 4.0, 4.55] },
  { id: 'sports', label: 'Sports Arena', position: [3.8, 1.8, 1.45] },
  { id: 'u-block', label: 'U-Block', position: [-0.2, 2.75, -1.05] },
  { id: 'n-block', label: 'N-Block', position: [3.9, 3.0, -0.8] },
  { id: 'boys-hostel', label: 'Boys Hostel', position: [10.25, 4.05, -0.15] },
  { id: 'library', label: 'Library', position: [6.15, 1.25, -5.2] },
  { id: 'a-block', label: 'A-Block', position: [10.8, 2.85, -5.2] },
]

const networkLinks = [
  ['girls-hostel', 'lara-west'],
  ['girls-hostel', 'u-block'],
  ['lara-west', 'lara-east'],
  ['lara-east', 'sports'],
  ['sports', 'n-block'],
  ['sports', 'boys-hostel'],
  ['u-block', 'n-block'],
  ['u-block', 'library'],
  ['n-block', 'boys-hostel'],
  ['n-block', 'library'],
  ['library', 'a-block'],
  ['a-block', 'boys-hostel'],
] as const

const topologyVertices: TopologyVertex[] = [
  { id: 'internet', label: 'Internet', position: [0, 6.7, -1.8], tone: 'edge' },
  { id: 'isp', label: 'ISP Router', position: [0, 5.5, -1.2], tone: 'edge' },
  { id: 'edge', label: 'Edge Router', position: [0, 4.3, -0.6], tone: 'edge' },
  { id: 'fw1', label: 'Firewall 1', position: [-2.0, 3.7, 0], tone: 'firewall' },
  { id: 'fw2', label: 'Firewall 2', position: [2.0, 3.7, 0], tone: 'firewall' },
  { id: 'core', label: 'Core Switch', subtitle: 'Catalyst 9500', position: [0, 2.9, 0.4], tone: 'core' },
  { id: 'dist1', label: 'Dist. Switch 1', subtitle: 'Catalyst 9300', position: [-3.1, 1.6, 1.2], tone: 'dist' },
  { id: 'dist2', label: 'Dist. Switch 2', subtitle: 'Catalyst 9300', position: [0, 1.4, 1.35], tone: 'dist' },
  { id: 'dist3', label: 'Dist. Switch 3', subtitle: 'Catalyst 9300', position: [3.1, 1.6, 1.2], tone: 'dist' },
  { id: 'acc1', label: 'Access Switch 1', subtitle: 'Catalyst 9200', position: [-5.0, 0.2, 2.3], tone: 'access' },
  { id: 'acc2', label: 'Access Switch 2', subtitle: 'Catalyst 9200', position: [-3.1, 0.2, 2.2], tone: 'access' },
  { id: 'acc3', label: 'Access Switch 3', subtitle: 'Catalyst 9200', position: [-1.1, 0.0, 2.45], tone: 'access' },
  { id: 'acc4', label: 'Access Switch 4', subtitle: 'Catalyst 9200', position: [1.2, 0.0, 2.45], tone: 'access' },
  { id: 'acc5', label: 'Access Switch 5', subtitle: 'Catalyst 9200', position: [3.2, 0.2, 2.2], tone: 'access' },
  { id: 'acc6', label: 'Access Switch 6', subtitle: 'Catalyst 9200', position: [5.0, 0.2, 2.25], tone: 'access' },
  { id: 'wifi-left', label: 'Meraki AP Cluster', position: [-3.8, -0.9, 3.1], tone: 'wifi' },
  { id: 'wifi-right', label: 'Meraki AP Cluster', position: [3.9, -0.9, 3.1], tone: 'wifi' },
]

const topologyEdges: Array<[string, string, 'fiber' | 'wireless' | 'health']> = [
  ['internet', 'isp', 'fiber'],
  ['isp', 'edge', 'fiber'],
  ['edge', 'core', 'fiber'],
  ['fw1', 'core', 'fiber'],
  ['fw2', 'core', 'fiber'],
  ['core', 'dist1', 'fiber'],
  ['core', 'dist2', 'fiber'],
  ['core', 'dist3', 'fiber'],
  ['dist1', 'acc1', 'health'],
  ['dist1', 'acc2', 'health'],
  ['dist2', 'acc3', 'health'],
  ['dist2', 'acc4', 'health'],
  ['dist3', 'acc5', 'health'],
  ['dist3', 'acc6', 'health'],
  ['acc2', 'wifi-left', 'wireless'],
  ['acc5', 'wifi-right', 'wireless'],
]

const applications = ['Zoom', 'Teams', 'Moodle', 'ERP', 'LMS']
const workflowSteps = ['Detect', 'Analyze', 'Decide', 'Execute', 'Validate', 'Report']
const twinLayerNames = [
  'Network',
  'WiFi Coverage',
  'Security',
  'CCTV',
  'Energy',
  'Occupancy',
  'IoT Sensors',
  'Traffic Flow',
  'Fiber Backbone',
  'Device Status',
  'Threat Detection',
] as const

const trafficSeries = [
  { t: '00:00', bw: 5.1, throughput: 4.2, latency: 13 },
  { t: '04:00', bw: 4.4, throughput: 3.8, latency: 12 },
  { t: '08:00', bw: 8.2, throughput: 6.7, latency: 18 },
  { t: '12:00', bw: 10.3, throughput: 8.8, latency: 21 },
  { t: '16:00', bw: 9.6, throughput: 7.9, latency: 19 },
  { t: '20:00', bw: 7.8, throughput: 6.4, latency: 16 },
]

function Packet({ from, to, color, speed = 0.28 }: { from: [number, number, number]; to: [number, number, number]; color: string; speed?: number }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime * speed) % 1
    const x = from[0] + (to[0] - from[0]) * t
    const y = from[1] + (to[1] - from[1]) * t
    const z = from[2] + (to[2] - from[2]) * t
    ref.current.position.set(x, y, z)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  )
}

function Road({ segment }: { segment: RoadSegment }) {
  const dashCount = segment.laneMarks ? 12 : 0

  return (
    <group position={segment.position} rotation={[0, segment.rotation ?? 0, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={segment.size} />
        <meshStandardMaterial color="#5f6367" roughness={0.88} metalness={0.1} />
      </mesh>
      {dashCount
        ? Array.from({ length: dashCount }).map((_, index) => (
            <mesh key={`${segment.id}-${index}`} position={[-segment.size[0] / 2 + 1.35 + index * 2.2, 0.04, 0]}>
              <boxGeometry args={[1.1, 0.03, 0.08]} />
              <meshStandardMaterial color="#f5f5f5" emissive="#f5f5f5" emissiveIntensity={0.12} />
            </mesh>
          ))
        : null}
    </group>
  )
}

function SurfaceFeature({ feature }: { feature: CampusSurface }) {
  const position: [number, number, number] = [feature.position[0], 0.03, feature.position[1]]

  return (
    <group position={position} rotation={[0, feature.rotation ?? 0, 0]}>
      {feature.shape === 'oval' ? (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[feature.size[0] / 2, feature.size[0] / 2, 0.08, 48]} />
          <meshStandardMaterial color={feature.color} />
        </mesh>
      ) : (
        <mesh receiveShadow>
          <boxGeometry args={[feature.size[0], 0.08, feature.size[1]]} />
          <meshStandardMaterial color={feature.color} />
        </mesh>
      )}
      <Html center distanceFactor={15} position={feature.labelOffset ?? [0, 0.28, 0]}>
        <div className="campus-surface-label">{feature.name}</div>
      </Html>
    </group>
  )
}

function TwinBuilding({ item, selected, onSelect }: { item: CampusStructure; selected: boolean; onSelect: (id: string) => void }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = item.size[1] / 2 + Math.sin(clock.elapsedTime + item.position[0]) * 0.05
  })

  return (
    <group position={[item.position[0], 0, item.position[1]]} rotation={[0, item.rotation ?? 0, 0]}>
      <mesh ref={ref} castShadow receiveShadow onClick={() => onSelect(item.id)}>
        <boxGeometry args={item.size} />
        <meshStandardMaterial color={item.color} metalness={0.22} roughness={0.54} emissive={selected ? item.color : '#09162a'} emissiveIntensity={selected ? 0.34 : 0.08} />
      </mesh>
      <mesh position={[0, item.size[1] + 0.12, 0]} castShadow>
        <boxGeometry args={[item.size[0] * 1.04, 0.18, item.size[2] * 1.04]} />
        <meshStandardMaterial color={item.roofColor ?? '#d9d0c7'} metalness={0.14} roughness={0.72} />
      </mesh>
      {item.annexes?.map((annex, index) => (
        <group key={`${item.id}-annex-${index}`} position={annex.position}>
          <mesh castShadow receiveShadow position={[0, annex.size[1] / 2, 0]}>
            <boxGeometry args={annex.size} />
            <meshStandardMaterial color={annex.color ?? item.color} metalness={0.22} roughness={0.54} emissive={selected ? annex.color ?? item.color : '#09162a'} emissiveIntensity={selected ? 0.24 : 0.05} />
          </mesh>
          <mesh position={[0, annex.size[1] + 0.1, 0]} castShadow>
            <boxGeometry args={[annex.size[0] * 1.03, 0.16, annex.size[2] * 1.03]} />
            <meshStandardMaterial color={annex.roofColor ?? item.roofColor ?? '#d9d0c7'} roughness={0.72} />
          </mesh>
        </group>
      ))}
      <Html center position={item.labelOffset ?? [0, item.size[1] + 0.95, 0]} distanceFactor={14}>
        <div className="twin-label-stack">
          <button className={`twin-chip ${selected ? 'selected' : ''}`} onClick={() => onSelect(item.id)}>
            {item.name}
          </button>
          {item.badge ? <span className="campus-badge">{item.badge}</span> : null}
        </div>
      </Html>
    </group>
  )
}

function TopologyNode({ label, position, color }: { label: string; position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
      </mesh>
      <Html center position={[0, 0.35, 0]} distanceFactor={11}>
        <div className="node-pill">{label}</div>
      </Html>
    </group>
  )
}

function CoveragePulse({ position, color, radius, speed = 1.8 }: { position: [number, number, number]; color: string; radius: number; speed?: number }) {
  const ringRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const pulse = 1 + Math.sin(clock.elapsedTime * speed + position[0]) * 0.12
    ringRef.current.scale.set(pulse, pulse, pulse)
  })

  return (
    <mesh ref={ringRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.88, radius, 40]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} transparent opacity={0.55} side={2} />
    </mesh>
  )
}

function TopologyDeviceNode({ node }: { node: TopologyVertex }) {
  const toneColor =
    node.tone === 'core'
      ? '#00d4ff'
      : node.tone === 'dist'
      ? '#5bc7ff'
      : node.tone === 'access'
      ? '#3fa6f2'
      : node.tone === 'firewall'
      ? '#ff3b5c'
      : node.tone === 'wifi'
      ? '#00ff9d'
      : '#93c9ff'

  return (
    <group position={node.position}>
      <mesh>
        <boxGeometry args={[0.72, 0.24, 0.56]} />
        <meshStandardMaterial color="#2b394d" emissive={toneColor} emissiveIntensity={0.16} metalness={0.5} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.25, 0.07, 0.2]} />
        <meshStandardMaterial color={toneColor} emissive={toneColor} emissiveIntensity={0.34} />
      </mesh>
      <Html center position={[0, -0.52, 0]} distanceFactor={12}>
        <div className="topology-tag">
          <strong>{node.label}</strong>
          {node.subtitle ? <small>{node.subtitle}</small> : null}
        </div>
      </Html>
    </group>
  )
}

function CampusBuildingModel({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.7, 1.1, 1.25]} />
        <meshStandardMaterial color={color} roughness={0.46} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.78, 0.14, 1.33]} />
        <meshStandardMaterial color="#bfae97" roughness={0.78} />
      </mesh>
      <Html center position={[0, -0.9, 0]} distanceFactor={13}>
        <div className="building-tag">{label}</div>
      </Html>
    </group>
  )
}

function TopologyModelScene() {
  const byId = useMemo(() => Object.fromEntries(topologyVertices.map((n) => [n.id, n])), [])

  return (
    <Canvas camera={{ position: [0, 6.8, 11.2], fov: 44 }}>
      <ambientLight intensity={0.75} />
      <pointLight color="#00d4ff" intensity={1.1} position={[-5, 5, 3]} />
      <pointLight color="#7b61ff" intensity={1.2} position={[5, 5, 3]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]}>
        <planeGeometry args={[19, 12]} />
        <meshStandardMaterial color="#081629" />
      </mesh>

      {topologyEdges.map(([fromId, toId, type], idx) => {
        const from = byId[fromId].position
        const to = byId[toId].position
        const color = type === 'fiber' ? '#24a7ff' : type === 'wireless' ? '#00ff9d' : '#59d97e'

        return (
          <group key={`${fromId}-${toId}`}>
            <Line points={[from, to]} color={color} lineWidth={2.1} transparent opacity={0.85} />
            <Packet from={from} to={to} color={idx % 2 === 0 ? '#00d4ff' : '#00ff9d'} speed={0.21 + idx * 0.01} />
          </group>
        )
      })}

      {topologyVertices.map((node) => (
        <TopologyDeviceNode key={node.id} node={node} />
      ))}

      <CampusBuildingModel position={[-6.5, 3.3, 1.2]} color="#ab785b" label="Vignan LARA" />
      <CampusBuildingModel position={[6.6, 3.25, 1.25]} color="#b88c61" label="Vignan Pharmacy College" />
      <CampusBuildingModel position={[-6.9, 1.6, 1.8]} color="#d0a87c" label="Accommodation" />
      <CampusBuildingModel position={[7.3, 1.6, 1.8]} color="#be9f7b" label="Boys Hostel" />
      <CampusBuildingModel position={[-4.9, -1.65, 3]} color="#d14d4d" label="U-Block" />
      <CampusBuildingModel position={[-1.8, -1.45, 2.95]} color="#b99b79" label="N-Block" />
      <CampusBuildingModel position={[2.0, -1.7, 2.95]} color="#cc4a4a" label="H-Block" />
      <CampusBuildingModel position={[5.5, -1.55, 3.0]} color="#c5af8f" label="A-Block" />

      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.25} />
    </Canvas>
  )
}

function TwinCameraRig({
  focus,
}: {
  focus: [number, number, number]
}) {
  const { camera } = useThree()

  useFrame(() => {
    const desiredX = focus[0] * 0.78
    const desiredY = 11.2
    const desiredZ = focus[2] + 11.2

    camera.position.x += (desiredX - camera.position.x) * 0.065
    camera.position.y += (desiredY - camera.position.y) * 0.065
    camera.position.z += (desiredZ - camera.position.z) * 0.065

  })

  return null
}

function DigitalTwinScene({
  selectedBuildingId,
  onSelectBuilding,
  layerVisibility,
  viewMode = 'ground',
  traceActive = false,
}: {
  selectedBuildingId: string
  onSelectBuilding: (id: string) => void
  layerVisibility: Record<(typeof twinLayerNames)[number], boolean>
  viewMode?: '3d' | 'ground' | 'floor'
  traceActive?: boolean
}) {
  const byId = useMemo(() => Object.fromEntries(networkAnchors.map((n) => [n.id, n])), [])
  const selected = buildings.find((b) => b.id === selectedBuildingId) ?? buildings[0]

  const tracePoints: Array<[number, number, number]> = [
    [selected.position[0], 2.4, selected.position[1]],
    [selected.position[0] + 0.8, 3.0, selected.position[1] - 0.4],
    [selected.position[0] * 0.55, 3.4, selected.position[1] - 1.0],
    [0.8, 3.8, -0.9],
    [0, 4.6, -2.1],
    [0, 5.4, -3.2],
  ]

  return (
    <Canvas camera={{ position: [0.5, 13.5, 19], fov: 36 }} shadows>
      <TwinCameraRig focus={[selected.position[0], 0.15, selected.position[1]]} />
      <fog attach="fog" args={['#0a1625', 18, 36]} />
      <ambientLight intensity={0.95} />
      <directionalLight castShadow intensity={1.55} position={[-8, 14, 10]} />
      <pointLight color="#00D4FF" intensity={1.6} position={[-11, 4, -1]} />
      <pointLight color="#7B61FF" intensity={1.3} position={[11, 5, 2]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[34, 24]} />
        <meshStandardMaterial color={viewMode === 'floor' ? '#0c2238' : '#0a1a2d'} />
      </mesh>
      <gridHelper args={[34, 34, '#123a5a', '#0c2538']} position={[0, 0.01, 0]} visible={viewMode !== '3d'} />

      {roadSegments.map((road) => (
        <Road key={road.id} segment={road} />
      ))}

      {viewMode !== '3d'
        ? campusSurfaces.map((feature) => <SurfaceFeature key={feature.id} feature={feature} />)
        : null}

      {buildings.map((b) => (
        <TwinBuilding key={b.id} item={b} selected={selectedBuildingId === b.id} onSelect={onSelectBuilding} />
      ))}

      {layerVisibility['Fiber Backbone']
        ? networkLinks.map(([fromId, toId], idx) => {
            const from = byId[fromId].position
            const to = byId[toId].position
            return (
              <group key={`${fromId}-${toId}`}>
                <Line points={[from, to]} color="#2d8cff" lineWidth={2.2} opacity={0.92} transparent />
                <Packet from={from} to={to} color={idx % 4 === 0 ? '#00FF9D' : idx % 3 === 0 ? '#FFC107' : '#00D4FF'} speed={0.22 + idx * 0.018} />
              </group>
            )
          })
        : null}

      {layerVisibility['Traffic Flow']
        ? networkLinks.map(([fromId, toId], idx) => {
            if (idx % 2 !== 0) return null
            const from = byId[fromId].position
            const to = byId[toId].position
            return <Line key={`wireless-${fromId}-${toId}`} points={[from, to]} color="#00ff9d" lineWidth={1.3} dashed dashScale={6} opacity={0.82} transparent />
          })
        : null}

      {layerVisibility['Device Status']
        ? networkAnchors.map((node) => <TopologyNode key={node.id} label={node.label} position={node.position} color="#2d8cff" />)
        : null}

      {layerVisibility['WiFi Coverage']
        ? buildings.map((building) => {
            const quality = (building.id.charCodeAt(0) + building.id.length) % 4
            const color = quality === 0 ? '#00a7ff' : quality === 1 ? '#00ff9d' : quality === 2 ? '#ffc107' : '#ff3b5c'
            return <CoveragePulse key={`wifi-${building.id}`} position={[building.position[0], 0.05, building.position[1]]} color={color} radius={building.size[0] * 0.72} />
          })
        : null}

      {layerVisibility['CCTV']
        ? buildings.map((building) => (
            <mesh key={`cctv-${building.id}`} position={[building.position[0] + 0.45, 0.42, building.position[1] - 0.42]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color="#9ecbf2" emissive="#9ecbf2" emissiveIntensity={0.85} />
            </mesh>
          ))
        : null}

      {layerVisibility['IoT Sensors']
        ? buildings.map((building) => (
            <mesh key={`iot-${building.id}`} position={[building.position[0] - 0.48, 0.34, building.position[1] + 0.35]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshStandardMaterial color="#7b61ff" emissive="#7b61ff" emissiveIntensity={0.72} />
            </mesh>
          ))
        : null}

      {layerVisibility['Threat Detection']
        ? ['h-block', 'u-block'].map((id) => {
            const target = buildings.find((b) => b.id === id)
            if (!target) return null
            return <CoveragePulse key={`threat-${id}`} position={[target.position[0], 0.07, target.position[1]]} color="#ff3b5c" radius={target.size[0] * 0.9} speed={2.8} />
          })
        : null}

      {traceActive ? (
        <>
          <Line points={tracePoints} color="#00d4ff" lineWidth={3.2} opacity={0.95} transparent />
          {tracePoints.slice(0, -1).map((from, idx) => (
            <Packet key={`trace-${idx}`} from={from} to={tracePoints[idx + 1]} color={idx % 2 === 0 ? '#00d4ff' : '#00ff9d'} speed={0.35 + idx * 0.04} />
          ))}
        </>
      ) : null}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 3.35}
        maxPolarAngle={Math.PI / 2.15}
        enableZoom={false}
        minAzimuthAngle={-0.42}
        maxAzimuthAngle={0.42}
      />
    </Canvas>
  )
}

function KPI({ title, value, tone = 'cyan' }: { title: string; value: string; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'purple' }) {
  return (
    <motion.div className={`kpi-card tone-${tone}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <span>{title}</span>
      <strong>{value}</strong>
    </motion.div>
  )
}

function Meter({ value, tone = 'cyan' }: { value: number; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'purple' }) {
  return (
    <progress className={`meter tone-${tone}`} value={Math.max(0, Math.min(100, value))} max={100} />
  )
}

function ThreatRadar({ threats }: { threats: RealtimePayload['security']['threats'] }) {
  const points = [
    { label: 'DDoS', value: threats.ddos },
    { label: 'Malware', value: threats.malware },
    { label: 'Unauthorized', value: threats.unauthorized },
    { label: 'Port Scan', value: threats.portScan },
    { label: 'Brute Force', value: threats.bruteForce },
  ]
  return (
    <div className="threat-radar">
      <div className="radar-rings" />
      {points.map((t, i) => (
        <div key={t.label} className={`radar-point p${i}`}>
          <span>{t.label}</span>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState<PageId>('digital-twin')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [autopilot, setAutopilot] = useState(true)
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildings[0].id)
  const [voiceQuery, setVoiceQuery] = useState('Show Block A status')
  const [cliInput, setCliInput] = useState('show campus topology')
  const [chatInput, setChatInput] = useState('Find disconnected APs')
  const [layerVisibility, setLayerVisibility] = useState<Record<(typeof twinLayerNames)[number], boolean>>(() =>
    Object.fromEntries(twinLayerNames.map((name) => [name, true])) as Record<(typeof twinLayerNames)[number], boolean>,
  )
  const [twinViewMode, setTwinViewMode] = useState<'3d' | 'ground' | 'floor'>('ground')
  const [realtime, setRealtime] = useState<RealtimePayload | null>(null)
  const [streamStatus, setStreamStatus] = useState('Initializing telemetry...')
  const [wsError, setWsError] = useState<string | null>(null)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechStatus, setSpeechStatus] = useState('Voice capture offline')
  const [voiceStage, setVoiceStage] = useState(0)
  const [voiceRunId, setVoiceRunId] = useState(1)
  const [commandStatus, setCommandStatus] = useState<'idle' | 'processing' | 'executing' | 'complete'>('idle')
  const [activeIntent, setActiveIntent] = useState('status')
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldKeepListeningRef = useRef(false)
  const [voiceHistory, setVoiceHistory] = useState<VoiceCommandRecord[]>([
    { id: 1, command: 'Show H-Block status', time: '11:23 AM', buildingId: 'h-block', intent: 'status', status: 'completed', responseMs: 880 },
    { id: 2, command: 'Generate security report', time: '11:25 AM', buildingId: 'u-block', intent: 'security', status: 'completed', responseMs: 960 },
    { id: 3, command: 'Find AP congestion', time: '11:28 AM', buildingId: 'n-block', intent: 'wifi', status: 'completed', responseMs: 790 },
    { id: 4, command: 'Show occupancy heatmap', time: '11:31 AM', buildingId: 'a-block', intent: 'occupancy', status: 'completed', responseMs: 920 },
  ])

  const selectedBuilding = useMemo(() => buildings.find((b) => b.id === selectedBuildingId) ?? buildings[0], [selectedBuildingId])

  const voiceSteps = useMemo(
    () => [
      'Processing command',
      `Identifying target: ${selectedBuilding.name}`,
      'Checking AP and switch health',
      'Analyzing traffic and latency',
      'Correlating security + occupancy telemetry',
      'Generating response and action plan',
    ],
    [selectedBuilding.name],
  )

  const waveformBars = useMemo(() => Array.from({ length: 28 }).map((_, idx) => 30 + ((idx * 17 + voiceRunId * 11) % 70)), [voiceRunId])

  const voiceLayers = useMemo(
    () =>
      Object.fromEntries(
        twinLayerNames.map((name) => [name, activeIntent === 'security' ? name !== 'Energy' : true]),
      ) as Record<(typeof twinLayerNames)[number], boolean>,
    [activeIntent],
  )

  const commandMetrics = useMemo(() => {
    const seed = selectedBuilding.id.length * 13 + selectedBuilding.name.length * 7
    return {
      networkHealth: Math.max(86, Math.min(99, (realtime?.missionControl.subscores.network ?? 96) - (seed % 4))),
      users: 290 + (seed % 170),
      bandwidth: (1.3 + (seed % 9) * 0.11).toFixed(1),
      threats: activeIntent === 'security' ? (realtime?.security.threats.unauthorized ?? 1) : 0,
      occupancy: Math.max(44, Math.min(97, Math.round(((realtime?.missionControl.subscores.infrastructure ?? 91) + (seed % 12)) * 0.86))),
      wifi: Math.max(65, Math.min(99, (realtime?.wifi.coverage ?? 90) - (seed % 8))),
      latency: Math.max(9, Math.round((realtime?.noc.latencyMs ?? 16) + (seed % 5) - 2)),
    }
  }, [selectedBuilding, activeIntent, realtime])

  const voiceActions = useMemo(() => {
    if (activeIntent === 'security') {
      return ['Isolate suspicious endpoint', 'Apply temporary ACL rule', 'Run endpoint malware sweep', 'Generate SOC escalation report']
    }
    if (activeIntent === 'wifi') {
      return ['Rebalance AP-04 load', 'Optimize channel allocation', 'Reduce AP transmit power by 8%', 'Push RF profile update']
    }
    if (activeIntent === 'occupancy') {
      return ['Activate crowd-control cameras', 'Increase Wi-Fi QoS for lecture halls', 'Optimize HVAC for occupancy surge', 'Alert campus operations lead']
    }
    return ['Trace end-to-end network path', 'Run firmware compliance check', 'Generate executive summary', 'Create incident-ready report']
  }, [activeIntent])

  const predictiveInsights = useMemo(
    () => [
      { title: 'Tomorrow Wi-Fi Load', value: `+${Math.max(8, 12 + Math.floor((realtime?.wifi.congestion ?? 28) / 6))}%`, note: 'Peak expected 10:30 AM' },
      { title: 'Probable Bottleneck', value: 'Dist-2 uplink 82%', note: 'Preemptive balancing recommended' },
      { title: 'Security Risk Window', value: 'Low to Medium', note: 'Elevated scan attempts at 8 PM' },
    ],
    [realtime?.wifi.congestion],
  )

  const traceChain = `${selectedBuilding.name} Laptop → Meraki AP → Catalyst 9200 → Catalyst 9300 → Catalyst 9500 → Firewall → ISP → Internet`

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light')
  }, [theme])

  useEffect(() => {
    let socket: WebSocket | null = null
    let polling: number | null = null

    async function pullSnapshot() {
      try {
        const res = await fetch('/api/realtime')
        if (!res.ok) throw new Error('Realtime snapshot unavailable')
        const json = (await res.json()) as RealtimePayload
        setRealtime(json)
        setStreamStatus('Live polling telemetry')
        setWsError(null)
      } catch (error: unknown) {
        setWsError(error instanceof Error ? error.message : 'Telemetry unavailable')
      }
    }

    function startPolling() {
      pullSnapshot()
      polling = window.setInterval(pullSnapshot, 3000)
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const backendHost = `${window.location.hostname}:8000`
      socket = new WebSocket(`${protocol}://${backendHost}/ws/telemetry`)
      socket.onopen = () => {
        setStreamStatus('WebSocket telemetry live')
        setWsError(null)
      }
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as RealtimePayload
        setRealtime(payload)
      }
      socket.onerror = () => {
        setStreamStatus('WebSocket failed, switching to polling')
      }
      socket.onclose = () => {
        if (!polling) startPolling()
      }
    } catch {
      startPolling()
    }

    if (!socket) startPolling()

    return () => {
      socket?.close()
      if (polling) window.clearInterval(polling)
    }
  }, [])

  useEffect(() => {
    if (commandStatus === 'idle' || commandStatus === 'complete') return
    const stageTimer = window.setInterval(() => {
      setVoiceStage((current) => {
        if (current >= voiceSteps.length - 1) {
          setCommandStatus('complete')
          return current
        }
        if (current >= 2) setCommandStatus('executing')
        return current + 1
      })
    }, 500)

    return () => window.clearInterval(stageTimer)
  }, [commandStatus, voiceSteps.length])

  useEffect(() => {
    if (activePage === 'voice') return
    shouldKeepListeningRef.current = false
    speechRecognitionRef.current?.stop()
    setIsVoiceListening(false)
  }, [activePage])

  const mission = realtime?.missionControl
  const noc = realtime?.noc
  const wifi = realtime?.wifi
  const security = realtime?.security
  const energy = realtime?.energy
  const executive = realtime?.executive

  const appPerformance = useMemo(
    () =>
      applications.map((name, idx) => ({
        app: name,
        response: Math.round((noc?.latencyMs ?? 16) + idx * 3 + (idx % 2 ? 4 : 0)),
        availability: 98 - idx,
      })),
    [noc?.latencyMs],
  )

  const wifiHeat = useMemo(
    () => Array.from({ length: 56 }).map((_, i) => 40 + ((i * 17 + (wifi?.coverage ?? 88)) % 60)),
    [wifi?.coverage],
  )

  const predictiveData = useMemo(
    () => [
      { item: 'Router Failure', confidence: 94, eta: '4 days' },
      { item: 'AP Failure', confidence: 81, eta: '2 days' },
      { item: 'Switch Failure', confidence: 76, eta: '6 days' },
      { item: 'Security Incident', confidence: 69, eta: '24 hrs' },
      { item: 'Power Outage', confidence: 58, eta: '12 hrs' },
    ],
    [],
  )

  const voiceResult = useMemo(() => {
    const query = voiceQuery.toLowerCase()
    if (query.includes('block a')) return 'Block A status: Network 96%, Security 93%, Occupancy 82%, Internet Quality 91%.'
    if (query.includes('disconnected')) return 'Detected 14 disconnected AP clients and 3 unstable AP uplinks in Hostel South.'
    if (query.includes('security report')) return 'Security report prepared with timeline, IOC summary, and containment actions.'
    if (query.includes('bottleneck')) return 'Primary bottleneck detected on Distribution → Access uplink at 91% utilization.'
    return 'Command parsed and delegated to relevant AI agents.'
  }, [voiceQuery])

  function detectBuildingFromCommand(command: string) {
    const q = command.toLowerCase()

    const directMap: Array<[string, string]> = [
      ['h block', 'h-block'],
      ['n block', 'n-block'],
      ['u block', 'u-block'],
      ['a block', 'a-block'],
      ['library', 'library'],
      ['pharmacy', 'pharmacy'],
      ['boys hostel', 'boys-hostel'],
      ['girls hostel', 'girls-hostel'],
    ]

    const found = directMap.find(([token]) => q.includes(token))
    if (found) return found[1]

    return selectedBuildingId
  }

  function detectIntent(command: string) {
    const q = command.toLowerCase()
    if (q.includes('security') || q.includes('rogue') || q.includes('threat')) return 'security'
    if (q.includes('wifi') || q.includes('ap') || q.includes('channel')) return 'wifi'
    if (q.includes('occupancy') || q.includes('crowd') || q.includes('cctv')) return 'occupancy'
    if (q.includes('trace') || q.includes('path') || q.includes('internet')) return 'trace'
    if (q.includes('predict')) return 'predictive'
    return 'status'
  }

  function executeVoiceCommand(command: string) {
    const buildingId = detectBuildingFromCommand(command)
    const intent = detectIntent(command)
    setVoiceQuery(command)
    setSelectedBuildingId(buildingId)
    setActiveIntent(intent)
    setVoiceStage(0)
    setCommandStatus('processing')
    setVoiceRunId((id) => id + 1)

    const now = new Date()
    const stamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const responseMs = 760 + ((command.length * 13) % 290)

    setVoiceHistory((history) => [
      {
        id: history.length + 1,
        command,
        time: stamp,
        buildingId,
        intent,
        status: 'completed' as const,
        responseMs,
      },
      ...history,
    ].slice(0, 10))

    setTimeout(() => {
      setCommandStatus('complete')
    }, 3400)
  }

  function toggleVoiceCapture() {
    const recognition = speechRecognitionRef.current
    if (!recognition) {
      setSpeechStatus('Web Speech API unavailable in this browser')
      return
    }

    if (shouldKeepListeningRef.current) {
      shouldKeepListeningRef.current = false
      recognition.stop()
      setSpeechStatus('Microphone paused')
      setIsVoiceListening(false)
      return
    }

    shouldKeepListeningRef.current = true
    setSpeechStatus('Initializing microphone...')
    try {
      recognition.start()
    } catch {
      setSpeechStatus('Microphone busy, retry in a moment')
    }
  }

  useEffect(() => {
    const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false)
      setSpeechStatus('Web Speech API unavailable in this browser')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setSpeechSupported(true)
      setIsVoiceListening(true)
      setSpeechStatus('Live speech capture')
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let idx = event.resultIndex; idx < event.results.length; idx += 1) {
        const current = event.results[idx]
        const spoken = current?.[0]?.transcript?.trim() ?? ''
        if (!spoken) continue

        if (current.isFinal) {
          finalTranscript += `${spoken} `
        } else {
          interimTranscript += `${spoken} `
        }
      }

      if (interimTranscript.trim()) {
        setVoiceQuery(interimTranscript.trim())
      }

      const cleanFinal = finalTranscript.trim()
      if (cleanFinal.length > 3) {
        executeVoiceCommand(cleanFinal)
      }
    }

    recognition.onerror = (event) => {
      const reason = event?.error ?? 'unknown'
      if (reason === 'not-allowed' || reason === 'service-not-allowed') {
        setSpeechSupported(false)
        setSpeechStatus('Mic permission denied')
      } else {
        setSpeechStatus(`Mic error: ${reason}`)
      }
      setIsVoiceListening(false)
      shouldKeepListeningRef.current = false
    }

    recognition.onend = () => {
      setIsVoiceListening(false)
      if (shouldKeepListeningRef.current) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {
            setSpeechStatus('Mic reconnecting...')
          }
        }, 220)
      }
    }

    speechRecognitionRef.current = recognition
    setSpeechSupported(true)
    setSpeechStatus('Microphone ready')

    return () => {
      shouldKeepListeningRef.current = false
      recognition.stop()
      speechRecognitionRef.current = null
      setIsVoiceListening(false)
    }
  }, [])

  const chatResponse = useMemo(() => {
    const query = chatInput.toLowerCase()
    if (query.includes('rogue')) return 'Security Agent isolated rogue MAC 34:9A:0D:11:FF:42 and applied NAC policy.'
    if (query.includes('wifi')) return 'Wi-Fi Agent recommends shifting 22% load from AP-12 to AP-18 and reducing channel overlap.'
    if (query.includes('energy')) return 'Energy Agent recommends reducing HVAC setpoint by 1.5°C in empty lab zones after 8 PM.'
    return 'Campus Assistant: anomaly investigation started. Correlating telemetry across NOC, SOC, and Energy modules.'
  }, [chatInput])

  const routePath = `${selectedBuilding.name} Device → Meraki AP → Catalyst 9200 → Catalyst 9300 → Catalyst 9500 → Firepower Firewall → ISP → Internet`

  function renderPage() {
    if (!realtime) {
      return <div className="panel">Booting enterprise telemetry fabric...</div>
    }

    switch (activePage) {
      case 'mission-control':
        return (
          <div className="page-grid">
            <section className="panel hero">
              <span className="eyebrow">Mission Control Dashboard</span>
              <h2>Campus Health Score {mission?.campusHealth ?? 96}/100</h2>
              <div className="subscore-grid">
                {Object.entries(mission?.subscores ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                    <Meter value={value as number} tone="green" />
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h3>Live KPI Cards</h3>
              <div className="kpi-grid">
                <KPI title="Connected Devices" value={mission?.kpis.connectedDevices.toLocaleString() ?? '24,356'} tone="cyan" />
                <KPI title="Access Points" value={`${mission?.kpis.accessPoints ?? 542}`} tone="purple" />
                <KPI title="Routers" value={`${mission?.kpis.routers ?? 84}`} tone="green" />
                <KPI title="Switches" value={`${mission?.kpis.switches ?? 233}`} tone="amber" />
                <KPI title="CCTV Cameras" value={`${mission?.kpis.cctvCameras ?? 812}`} tone="red" />
                <KPI title="IoT Sensors" value={`${mission?.kpis.iotSensors ?? 1428}`} tone="cyan" />
              </div>
            </section>

            <section className="panel two-col">
              <div>
                <h3>Real-Time Alerts Feed</h3>
                <ul className="feed-list">
                  {(mission?.alerts ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>AI Recommendation Feed</h3>
                <ul className="feed-list">
                  {(mission?.recommendations ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )

      case 'digital-twin':
        return (
          <div className="page-grid">
            <section className="panel kpi-grid twin-kpis">
              <KPI title="Network Health" value={`${mission?.subscores.network ?? 96}%`} tone="green" />
              <KPI title="Connected Devices" value={`${mission?.kpis.connectedDevices.toLocaleString() ?? '24,356'}`} tone="cyan" />
              <KPI title="Access Points" value={`${mission?.kpis.accessPoints ?? 542}`} tone="cyan" />
              <KPI title="Active Users" value={`${Math.max(12000, (mission?.kpis.connectedDevices ?? 24356) - 11874).toLocaleString()}`} tone="green" />
              <KPI title="Bandwidth Usage" value={`${noc?.bandwidthGbps.toFixed(2) ?? '2.35'} Tbps`} tone="cyan" />
              <KPI title="Security Score" value={`${security?.score ?? 92}/100`} tone="green" />
              <KPI title="Energy Usage" value={`${Math.round(energy?.renewableShare ?? 68)}%`} tone="amber" />
            </section>

            <section className="panel twin-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Vignan Campus Digital Twin</span>
                  <h2>Campus-First Real-Time Overlay Visualization</h2>
                </div>
                <div className="pill-stack">
                  <span className="pill success">● Live</span>
                  <div className="twin-view-tabs">
                    <button className={`view-tab ${twinViewMode === '3d' ? 'active' : ''}`} onClick={() => setTwinViewMode('3d')}>3D View</button>
                    <button className={`view-tab ${twinViewMode === 'ground' ? 'active' : ''}`} onClick={() => setTwinViewMode('ground')}>Ground View</button>
                    <button className={`view-tab ${twinViewMode === 'floor' ? 'active' : ''}`} onClick={() => setTwinViewMode('floor')}>Floor View</button>
                  </div>
                </div>
              </div>
              <div className="twin-mini-toolbar">
                <span>◉ Layers</span>
                <span>⌖ Geo</span>
                <span>◎ Topology</span>
                <span>⛨ Security</span>
              </div>
              <div className="twin-canvas">
                <DigitalTwinScene selectedBuildingId={selectedBuildingId} onSelectBuilding={setSelectedBuildingId} layerVisibility={layerVisibility} viewMode={twinViewMode} />
                <aside className="twin-assistant-panel">
                  <h4>AI CAMPUS ASSISTANT</h4>
                  <p>How can I help you today?</p>
                  <button onClick={() => executeVoiceCommand('Show Wi-Fi issues in H-Block')}>Show Wi-Fi issues in H-Block</button>
                  <button onClick={() => executeVoiceCommand('Why is Block A internet slow?')}>Why is Block A internet slow?</button>
                  <button onClick={() => executeVoiceCommand('Show disconnected devices')}>Show disconnected devices</button>
                  <button onClick={() => executeVoiceCommand('Generate network report')}>Generate network report</button>
                  <div className="assistant-input">Ask anything...</div>
                </aside>
                <aside className="twin-right-panel">
                  <h4>Layers</h4>
                  {twinLayerNames.map((name) => (
                    <label key={name} className="layer-toggle">
                      <input
                        type="checkbox"
                        checked={layerVisibility[name]}
                        onChange={() =>
                          setLayerVisibility((current) => ({
                            ...current,
                            [name]: !current[name],
                          }))
                        }
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                  <div className="twin-legend">
                    <h5>Legend</h5>
                    <p><i className="fiber" /> Fiber Backbone</p>
                    <p><i className="wireless" /> Wireless Link</p>
                    <p><i className="warn" /> Warning / Congested</p>
                    <p><i className="critical" /> Critical</p>
                  </div>
                </aside>
              </div>
            </section>

            <section className="panel chart-card">
              <h3>Live Traffic</h3>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={trafficSeries.map((d) => ({ ...d, bw: d.bw + (noc?.bandwidthGbps ?? 8) * 0.03 }))}>
                  <defs>
                    <linearGradient id="live-inbound" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="t" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip contentStyle={{ background: '#07111F', border: '1px solid rgba(255,255,255,0.15)' }} />
                  <Area type="monotone" dataKey="bw" stroke="#00d4ff" fill="url(#live-inbound)" name="Inbound" />
                  <Area type="monotone" dataKey="throughput" stroke="#00ff9d" fill="rgba(0,255,157,0.08)" name="Outbound" />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="panel">
              <h3>Top Applications</h3>
              <div className="app-rows">
                {appPerformance.map((app) => (
                  <div className="app-row" key={app.app}>
                    <strong>{app.app}</strong>
                    <div className="app-bar"><progress className="meter tone-cyan app-meter" value={Math.max(8, 30 - app.app.length)} max={30} /></div>
                    <span>{Math.max(8, 30 - app.app.length)}%</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h3>Real Time Alerts</h3>
              <ul className="feed-list compact">
                <li>🔴 Critical — Rogue Device Detected (H-Block) • 10:24 AM</li>
                <li>🟠 Warning — High Latency Detected (N-Block) • 10:23 AM</li>
                <li>🟡 Warning — AP Congestion (U-Block) • 10:22 AM</li>
                <li>🟢 Info — Access policy sync completed</li>
              </ul>
              <button className="action-btn alerts-btn">View All Alerts</button>
            </section>

            <section className="panel chart-card">
              <h3>Network Utilization</h3>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Normal', value: 62 },
                      { name: 'Moderate', value: 22 },
                      { name: 'High', value: 12 },
                      { name: 'Critical', value: 4 },
                    ]}
                    dataKey="value"
                    innerRadius={56}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#00ff9d" />
                    <Cell fill="#ffc107" />
                    <Cell fill="#ff9f43" />
                    <Cell fill="#ff3b5c" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </section>

            <section className="panel">
              <h3>AI Recommendations</h3>
              <div className="mini-card">
                <strong>AI Recommendations</strong>
                <ul className="feed-list compact">
                  <li>✅ Shift 18% traffic to AP-12 (H-Block)</li>
                  <li>✅ Replace switch SW-44 in N-Block</li>
                  <li>✅ Update AP firmware in U-Block</li>
                  <li>✅ Reduce power usage in Library by 10%</li>
                </ul>
                <button className="action-btn apply-ai-btn">Apply All Recommendations</button>
              </div>
            </section>
          </div>
        )

      case 'noc':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>Traffic Analytics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trafficSeries.map((d) => ({ ...d, bw: d.bw + (noc?.bandwidthGbps ?? 8) * 0.05 }))}>
                  <defs>
                    <linearGradient id="gbw" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="gthrough" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#00FF9D" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#00FF9D" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="t" stroke="rgba(255,255,255,0.6)" />
                  <YAxis stroke="rgba(255,255,255,0.6)" />
                  <Tooltip contentStyle={{ background: '#07111F', border: '1px solid rgba(255,255,255,0.15)' }} />
                  <Area type="monotone" dataKey="bw" stroke="#00D4FF" fill="url(#gbw)" name="Bandwidth" />
                  <Area type="monotone" dataKey="throughput" stroke="#00FF9D" fill="url(#gthrough)" name="Throughput" />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="panel two-col">
              <div>
                <h3>ThousandEyes-Style Path Analysis</h3>
                <p className="route-flow">Student Device ↓ Access Point ↓ Switch ↓ Firewall ↓ ISP ↓ Cloud Service</p>
                <ul className="feed-list compact">
                  {(noc?.links ?? []).map((link) => (
                    <li key={link.id}>{link.from} → {link.to} : {link.utilization}% utilization</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Application Monitoring</h3>
                <div className="app-grid">
                  {appPerformance.map((app) => (
                    <div className="mini-card" key={app.app}>
                      <strong>{app.app}</strong>
                      <span>Response: {app.response}ms</span>
                      <span>Availability: {app.availability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel">
              <h3>Cisco-style CLI Terminal + Config Generator</h3>
              <div className="cli-shell">
                <div className="cli-output">
                  <p>CampusSphere-NOC# {cliInput}</p>
                  <p>Topology: Catalyst 9500 core, dual Firepower cluster, Meraki AP mesh, ISR WAN edge.</p>
                  <p>Bandwidth: {noc?.bandwidthGbps ?? 8.6} Gbps | Latency: {noc?.latencyMs ?? 14} ms | Jitter: {noc?.jitterMs ?? 3} ms</p>
                </div>
                <input value={cliInput} onChange={(e) => setCliInput(e.target.value)} placeholder="show route path campus-a" />
                <button className="action-btn">Generate Network Configuration Template</button>
              </div>
            </section>
          </div>
        )

      case 'wifi':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>Meraki-Inspired Campus Heatmap</h3>
              <div className="heatmap-grid">
                {wifiHeat.map((value, idx) => (
                  <div key={idx} className={`heat-cell ${value > 85 ? 'h-cyan' : value > 68 ? 'h-green' : value > 50 ? 'h-amber' : 'h-red'} ${idx % 5 === 0 ? 'heat-glow' : ''}`} />
                ))}
              </div>
            </section>
            <section className="panel kpi-grid">
              <KPI title="Coverage" value={`${wifi?.coverage ?? 94}%`} tone="cyan" />
              <KPI title="Channel Usage" value={`${wifi?.channelUsage ?? 78}%`} tone="green" />
              <KPI title="Congestion" value={`${wifi?.congestion ?? 29}%`} tone="amber" />
              <KPI title="Interference" value={`${wifi?.interference ?? 17}%`} tone="red" />
            </section>
            <section className="panel">
              <h3>AI Recommendations</h3>
              <ul className="feed-list compact">
                <li>Install AP near Hostel South west corridor</li>
                <li>Change channel from 6 → 11 for high-overlap zone</li>
                <li>Reduce power level by 9% near Auditorium AP cluster</li>
              </ul>
            </section>
          </div>
        )

      case 'soc':
        return (
          <div className="page-grid">
            <section className="panel two-col">
              <div>
                <h3>Threat Radar</h3>
                {security ? <ThreatRadar threats={security.threats} /> : null}
              </div>
              <div>
                <h3>Threat Timeline</h3>
                <ul className="feed-list compact">
                  <li>10:02 • Port Scan detected</li>
                  <li>10:05 • Unauthorized Device identified</li>
                  <li>10:06 • AI Quarantine executed</li>
                  <li>10:09 • Lateral movement attempt blocked</li>
                  <li>10:12 • Firewall policy auto-tuned</li>
                </ul>
                <KPI title="Security Score" value={`${security?.score ?? 92}/100`} tone="red" />
              </div>
            </section>
          </div>
        )

      case 'inventory':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>Device Inventory Center</h3>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Device</th><th>Status</th><th>Firmware</th><th>CPU</th><th>Memory</th><th>Temp</th><th>Location</th><th>Last Seen</th><th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['ISR-EDGE-01', 'Online', '17.12.4', '44%', '58%', '48°C', 'Data Center', '7s', 97],
                    ['C9300-DIST-04', 'Online', '17.9.5', '62%', '66%', '52°C', 'Block A', '3s', 91],
                    ['MR-AP-212', 'Congested', '8.10.220', '72%', '69%', '57°C', 'Auditorium', '11s', 74],
                    ['Firepower-02', 'Online', '7.4.1', '38%', '42%', '46°C', 'Core Zone', '2s', 96],
                    ['CCTV-LIB-17', 'Online', '5.9.2', '28%', '34%', '39°C', 'Library', '6s', 94],
                  ].map((row) => (
                    <tr key={String(row[0])}>
                      <td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td>{row[6]}</td><td>{row[7]}</td>
                      <td>
                        <Meter value={Number(row[8])} tone={Number(row[8]) > 90 ? 'green' : Number(row[8]) > 80 ? 'cyan' : 'amber'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )

      case 'cctv':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>AI Video Analytics Wall</h3>
              <div className="camera-grid">
                {[
                  'Crowd Detection',
                  'Intrusion Detection',
                  'Loitering Detection',
                  'Fire Detection',
                  'Object Tracking',
                  'Perimeter Breach',
                ].map((item, idx) => (
                  <div className="camera-card" key={item}>
                    <span>CAM-{idx + 1}</span>
                    <strong>{item}</strong>
                    <p>Confidence {(90 - idx * 4)}%</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )

      case 'energy':
        return (
          <div className="page-grid">
            <section className="panel two-col">
              <div>
                <h3>Energy Flow Analytics</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { area: 'Buildings', usage: 78 },
                    { area: 'Labs', usage: 88 },
                    { area: 'Hostels', usage: 92 },
                  ]}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="area" stroke="rgba(255,255,255,0.65)" />
                    <YAxis stroke="rgba(255,255,255,0.65)" />
                    <Tooltip contentStyle={{ background: '#07111F', border: '1px solid rgba(255,255,255,0.15)' }} />
                    <Bar dataKey="usage" fill="#00D4FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="stat-list">
                <div><span>Solar Generation</span><strong>{energy?.solarGenerationKw ?? 442} kW</strong></div>
                <div><span>Battery Usage</span><strong>{energy?.batteryUsageKw ?? 182} kW</strong></div>
                <div><span>Grid Consumption</span><strong>{energy?.gridConsumptionKw ?? 804} kW</strong></div>
                <div><span>Predicted Cost</span><strong>${Math.round(energy?.predictedCostUsd ?? 42420)}</strong></div>
                <div><span>Renewable Share</span><strong>{energy?.renewableShare ?? 34}%</strong></div>
                <div><span>Savings</span><strong>{energy?.savings ?? 14.2}%</strong></div>
              </div>
            </section>
          </div>
        )

      case 'predictive':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>Predictive Analytics Engine</h3>
              <div className="predictive-grid">
                {predictiveData.map((p) => (
                  <div className="mini-card" key={p.item}>
                    <strong>{p.item}</strong>
                    <span>Confidence {p.confidence}%</span>
                    <span>Expected in {p.eta}</span>
                    <Meter value={p.confidence} tone={p.confidence > 85 ? 'red' : p.confidence > 70 ? 'amber' : 'cyan'} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )

      case 'ai-command':
        return (
          <div className="page-grid">
            <section className="panel two-col">
              <div>
                <h3>Autonomous Agent Mesh</h3>
                <div className="agent-grid">
                  {realtime.agents.map((a) => (
                    <div className="mini-card" key={a.name}>
                      <strong>{a.name}</strong>
                      <span>{a.state}</span>
                      <Meter value={a.confidence} tone="purple" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3>Inter-Agent Communication</h3>
                <ul className="feed-list compact">
                  <li>Network Agent → Security Agent: Investigating anomaly</li>
                  <li>Security Agent → Infrastructure Agent: Check switch SW-44</li>
                  <li>Infrastructure Agent → Network Agent: Confirmed issue</li>
                  <li>Campus Assistant → NOC Team: Executive summary generated</li>
                </ul>
                <div className="chat-box">
                  <label htmlFor="ai-command-input">AI Chat Assistant</label>
                  <input id="ai-command-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask the Campus Assistant" />
                  <p>{chatResponse}</p>
                </div>
              </div>
            </section>
          </div>
        )

      case 'autopilot':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>Campus Autopilot</h3>
              <div className="autopilot-row">
                <button className={`autopilot-toggle ${autopilot ? 'on' : ''}`} onClick={() => setAutopilot((v) => !v)}>
                  {autopilot ? 'AUTOPILOT ON' : 'AUTOPILOT OFF'}
                </button>
                <span>{autopilot ? 'AI is actively self-healing campus operations.' : 'Manual mode enabled. AI suggestions only.'}</span>
              </div>
              <div className="workflow-grid">
                {workflowSteps.map((step, idx) => (
                  <div className="workflow-step" key={step}>
                    <strong>{idx + 1}. {step}</strong>
                    <p>
                      {step === 'Detect' && 'Detect anomalies across network, security, and energy telemetry.'}
                      {step === 'Analyze' && 'Correlate telemetry and infer root cause confidence.'}
                      {step === 'Decide' && 'Select optimal policy actions with risk constraints.'}
                      {step === 'Execute' && 'Apply routing, RF, NAC, and power optimization changes.'}
                      {step === 'Validate' && 'Run post-change health checks and packet path tests.'}
                      {step === 'Report' && 'Generate executive and engineering reports automatically.'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )

      case 'executive':
        return (
          <div className="page-grid">
            <section className="panel two-col">
              <div>
                <h3>Executive KPI Spectrum</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={[
                    { kpi: 'Uptime', value: executive?.networkUptime ?? 99 },
                    { kpi: 'Security', value: executive?.securityReadiness ?? 93 },
                    { kpi: 'Connectivity', value: executive?.studentConnectivity ?? 96 },
                    { kpi: 'Energy', value: executive?.energySavings ?? 88 },
                    { kpi: 'Infra', value: executive?.infrastructureHealth ?? 92 },
                    { kpi: 'Sustainability', value: executive?.sustainability ?? 90 },
                  ]}>
                    <PolarGrid stroke="rgba(255,255,255,0.16)" />
                    <PolarAngleAxis dataKey="kpi" stroke="rgba(255,255,255,0.7)" />
                    <Radar dataKey="value" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.35} />
                    <Tooltip contentStyle={{ background: '#07111F', border: '1px solid rgba(255,255,255,0.15)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="kpi-grid">
                <KPI title="Network Uptime" value={`${executive?.networkUptime ?? 99.96}%`} tone="green" />
                <KPI title="Security Readiness" value={`${executive?.securityReadiness ?? 92}%`} tone="red" />
                <KPI title="Student Connectivity" value={`${executive?.studentConnectivity ?? 97}%`} tone="cyan" />
                <KPI title="Energy Savings" value={`${executive?.energySavings ?? 14}%`} tone="amber" />
                <KPI title="Infrastructure Health" value={`${executive?.infrastructureHealth ?? 93}%`} tone="purple" />
                <KPI title="Sustainability" value={`${executive?.sustainability ?? 90}%`} tone="green" />
              </div>
            </section>
          </div>
        )

      case 'voice':
        return (
          <div className="page-grid voice-center-grid">
            <section className="panel voice-hero">
              <div>
                <span className="eyebrow">Jarvis Mode • Conversational Campus Control</span>
                <h2>AI Voice Command Center</h2>
                <p className="muted-note">Speak naturally. CampusSphere orchestrates Network + Security + Energy + Infrastructure agents in real time.</p>
              </div>
              <div className="voice-hero-metrics">
                <KPI title="Commands Today" value={`${280 + voiceHistory.length}`} tone="cyan" />
                <KPI title="Avg Response Time" value={`${(0.86 + (voiceHistory.length % 3) * 0.04).toFixed(2)}s`} tone="green" />
                <KPI title="Successful Actions" value="98%" tone="green" />
                <KPI title="AI Accuracy" value="96%" tone="purple" />
              </div>
            </section>

            <section className="panel voice-input-panel">
              <div
                className={`mic-orb ${isVoiceListening ? 'live' : ''}`}
                onClick={toggleVoiceCapture}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleVoiceCapture()
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Toggle voice capture"
              >
                <span>🎤</span>
              </div>
              <div>
                <h3>{isVoiceListening ? 'Listening...' : 'Microphone Paused'}</h3>
                <p className="voice-transcript">“{voiceQuery}”</p>
                <p className="muted-note">{speechStatus} {speechSupported ? '• Speech-to-text active' : '• Fallback to typed commands'}</p>
                <div className="voice-control-row">
                  <button className="action-btn" onClick={toggleVoiceCapture}>{isVoiceListening ? 'Stop Mic' : 'Start Mic'}</button>
                  {!speechSupported ? <span className="pill warn">Allow microphone in browser permissions</span> : null}
                </div>
                <div className="waveform-wrap">
                  {waveformBars.map((value, idx) => (
                    <i key={`wf-${idx}`} className={`wf-bar h-${value % 7} d-${idx % 8}`} />
                  ))}
                </div>
                <label className="voice-input">
                  <span>Speak / Type command</span>
                  <input
                    value={voiceQuery}
                    onChange={(e) => setVoiceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') executeVoiceCommand(voiceQuery)
                    }}
                  />
                </label>
                <div className="voice-suggestions">
                  {[
                    'Show internet issues in H Block',
                    'Find disconnected APs in N Block',
                    'Generate security report for U Block',
                    'Predict tomorrow network load in A Block',
                    'Trace internet path for Library',
                    'Show CCTV status in Boys Hostel',
                  ].map((item) => (
                    <button key={item} onClick={() => executeVoiceCommand(item)}>{item}</button>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel voice-execution-panel">
              <h3>AI Command Execution</h3>
              <div className="status-row">
                <span className={`pill ${commandStatus === 'complete' ? 'success' : commandStatus === 'executing' ? 'warn' : ''}`}>Status: {commandStatus.toUpperCase()}</span>
                <span className="pill">Intent: {activeIntent}</span>
                <span className="pill">Target: {selectedBuilding.name}</span>
              </div>
              <p className="voice-response-line">{voiceResult}</p>
              <div className="action-cards">
                {voiceActions.map((action) => (
                  <button key={action} className="action-card">✓ {action}</button>
                ))}
              </div>
              <div className="trace-strip">
                <strong>Live Network Trace</strong>
                <p>{traceChain}</p>
              </div>
            </section>

            <section className="panel voice-thinking-panel">
              <h3>AI Reasoning Pipeline</h3>
              <div className="thinking-list">
                {voiceSteps.map((step, idx) => (
                  <div key={step} className={`thinking-step ${idx <= voiceStage ? 'done' : ''}`}>
                    <span>{idx <= voiceStage ? '✓' : '•'}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
              <h4>AI Agents Collaboration</h4>
              <div className="agent-grid">
                {[
                  ['Network Agent', 'Active'],
                  ['Security Agent', 'Active'],
                  ['Energy Agent', 'Active'],
                  ['Infrastructure Agent', 'Active'],
                ].map(([name, state]) => (
                  <div className="mini-card" key={name}>
                    <strong>{name}</strong>
                    <span>🟢 {state}</span>
                    <span>Working on {selectedBuilding.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel voice-twin-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Synchronized Campus Digital Twin</span>
                  <h3>Auto-Zoom + Live Overlay Reaction</h3>
                </div>
                <div className="pill-stack">
                  <span className="pill success">Twin Synced</span>
                  <span className="pill">{selectedBuilding.name}</span>
                </div>
              </div>
              <div className="twin-canvas voice-twin-canvas">
                <DigitalTwinScene
                  selectedBuildingId={selectedBuildingId}
                  onSelectBuilding={setSelectedBuildingId}
                  layerVisibility={voiceLayers}
                  traceActive={commandStatus !== 'idle'}
                />
              </div>
              <div className="voice-response-kpis">
                <KPI title="Network Health" value={`${commandMetrics.networkHealth}%`} tone="green" />
                <KPI title="Connected Users" value={`${commandMetrics.users}`} tone="cyan" />
                <KPI title="Bandwidth" value={`${commandMetrics.bandwidth} Gbps`} tone="cyan" />
                <KPI title="Threats" value={`${commandMetrics.threats}`} tone={commandMetrics.threats > 0 ? 'red' : 'green'} />
                <KPI title="Occupancy" value={`${commandMetrics.occupancy}%`} tone="amber" />
                <KPI title="Wi-Fi Quality" value={`${commandMetrics.wifi}%`} tone="green" />
              </div>
            </section>

            <section className="panel">
              <h3>Troubleshooting Workflow + Predictive Insights</h3>
              <div className="two-col">
                <div className="mini-card">
                  <strong>Root Cause Analysis</strong>
                  <p>AP-12 congestion detected in {selectedBuilding.name}. Estimated affected users: {Math.max(42, Math.round(commandMetrics.users * 0.2))}.</p>
                  <p>Recommended action: Move 30% clients to AP-13. Expected improvement: +24% throughput.</p>
                </div>
                <div className="predictive-grid">
                  {predictiveInsights.map((insight) => (
                    <div className="mini-card" key={insight.title}>
                      <strong>{insight.title}</strong>
                      <span>{insight.value}</span>
                      <span>{insight.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel voice-history-panel">
              <h3>Command History</h3>
              <div className="history-log">
                {voiceHistory.map((item) => (
                  <button key={`${item.id}-${item.time}`} className="history-item" onClick={() => executeVoiceCommand(item.command)}>
                    <span>{item.time}</span>
                    <strong>{item.command}</strong>
                    <small>{item.intent} • {item.responseMs}ms • {buildings.find((b) => b.id === item.buildingId)?.name ?? 'Campus'}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )

      case 'incident':
        return (
          <div className="page-grid">
            <section className="panel">
              <h3>Incident Command Center</h3>
              <div className="incident-grid">
                {[
                  ['Fire', 'Response Plan: Trigger fire protocol, isolate power zones, dispatch emergency teams.'],
                  ['Flood', 'Resource Allocation: reroute power and network, protect server zones, deploy safety team.'],
                  ['Network Failure', 'Communication Strategy: emergency SSID, alternate WAN route, stakeholder notifications.'],
                  ['Power Failure', 'Response Plan: activate UPS hierarchy, shift non-critical load, issue continuity brief.'],
                ].map(([title, msg]) => (
                  <div className="incident-card" key={title}>
                    <strong>{title}</strong>
                    <p>{msg}</p>
                    <button className="action-btn">Generate AI Playbook</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )

      default:
        return null
    }
  }

  const pageMeta = pages.find((p) => p.id === activePage) ?? pages[0]

  return (
    <div className="shell">
      <div className="particles" />
      <aside className="sidebar">
        <div className="brand">
          <span>CS</span>
          <div>
            <strong>CampusSphere AI</strong>
            <small>Enterprise Smart Campus OS</small>
          </div>
        </div>

        <nav>
          {pages.map((page) => (
            <button key={page.id} className={`nav-btn ${activePage === page.id ? 'active' : ''}`} onClick={() => setActivePage(page.id)}>
              <small>{page.eyebrow}</small>
              <strong>{page.label}</strong>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Ultra Modern Cyber Operations Center</span>
            <h1>{activePage === 'digital-twin' ? 'VIGNAN CAMPUS NETWORK OPERATIONS CENTER' : pageMeta.label}</h1>
          </div>
          <div className="top-actions">
            <label className="top-search">
              <input placeholder="Search (Devices, Users, Apps...)" />
            </label>
            <span className="pill">{streamStatus}</span>
            {wsError ? <span className="pill danger">{wsError}</span> : null}
            <button className="action-btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
            <span className={`pill ${autopilot ? 'success' : 'warn'}`}>{autopilot ? 'Autopilot Enabled' : 'Manual Control'}</span>
            <div className="admin-chip">
              <span>Admin</span>
              <small>Super Admin</small>
            </div>
          </div>
        </header>

        {renderPage()}

        <footer className="footer-line">
          CampusSphere AI is a self-healing, AI-driven Smart Campus Operating System combining Cisco-grade networking, cybersecurity,
          observability, digital twin simulation, predictive analytics, and autonomous AI agents.
        </footer>
      </main>
    </div>
  )
}

export default App
