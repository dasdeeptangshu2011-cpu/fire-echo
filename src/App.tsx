import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Battery, Bot, Cpu, Flame, Gauge, Globe2, Map, Radio, Satellite, ShieldCheck, Signal, Thermometer, Wifi, WifiOff } from 'lucide-react'
import './App.css'

type Source = 'SIMULATION' | 'REAL' | 'OFFLINE/REPLAY'
type EventState = 'NORMAL' | 'ENVIRONMENTAL ANOMALY' | 'SUSPICIOUS EVENT' | 'CORROBORATED EVENT' | 'PROBABLE FIRE EVENT' | 'LOCALIZED EVENT'
type Page = 'Home' | 'Live Map' | '3D Digital Twin' | 'Events' | 'Incident Command' | 'Robot Control' | 'Sentinel Network' | 'Hardware Center' | 'Simulation Lab' | 'Analytics' | 'System Health'

type Sentinel = { id: string; x: number; y: number; temp: number; humidity: number; smoke: number; flame: number; battery: number; signal: number; health: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; baseline: number; source: Source }
type Robot = { x: number; y: number; battery: number; connected: boolean; mission: string; ack: string }

const initialSentinels: Sentinel[] = [
  { id: 'S-01', x: 18, y: 25, temp: 29.4, humidity: 68, smoke: 7, flame: 0, battery: 96, signal: 91, health: 'ONLINE', baseline: 29, source: 'SIMULATION' },
  { id: 'S-02', x: 43, y: 22, temp: 30.1, humidity: 64, smoke: 9, flame: 0, battery: 91, signal: 88, health: 'ONLINE', baseline: 30, source: 'SIMULATION' },
  { id: 'S-03', x: 69, y: 28, temp: 31, humidity: 61, smoke: 12, flame: 0, battery: 87, signal: 82, health: 'ONLINE', baseline: 30.5, source: 'SIMULATION' },
  { id: 'S-04', x: 28, y: 62, temp: 28.7, humidity: 71, smoke: 6, flame: 0, battery: 94, signal: 94, health: 'ONLINE', baseline: 29, source: 'SIMULATION' },
  { id: 'S-05', x: 56, y: 58, temp: 30.4, humidity: 63, smoke: 10, flame: 0, battery: 89, signal: 86, health: 'ONLINE', baseline: 30, source: 'SIMULATION' },
  { id: 'S-06', x: 82, y: 66, temp: 29.8, humidity: 66, smoke: 8, flame: 0, battery: 92, signal: 90, health: 'ONLINE', baseline: 30, source: 'SIMULATION' },
]

const pages: Page[] = ['Home', 'Live Map', '3D Digital Twin', 'Events', 'Incident Command', 'Robot Control', 'Sentinel Network', 'Hardware Center', 'Simulation Lab', 'Analytics', 'System Health']

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function score(s: Sentinel) { return clamp((s.temp - s.baseline) * 10 + Math.max(0, s.smoke - 12) * 2 + s.flame * 55 + Math.max(0, 65 - s.humidity) * 0.7, 0, 100) }
function App() {
  const [page, setPage] = useState<Page>('Home')
  const [sentinels, setSentinels] = useState(initialSentinels)
  const [simulation, setSimulation] = useState(true)
  const [hardware, setHardware] = useState<'DISCONNECTED' | 'SCANNING' | 'CONNECTED'>('DISCONNECTED')
  const [robot, setRobot] = useState<Robot>({ x: 49, y: 84, battery: 78, connected: false, mission: 'STANDBY', ack: 'No command sent' })
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!simulation) return
    const timer = window.setInterval(() => {
      setSentinels(prev => prev.map((s, i) => {
        const hotspot = i === 4 || i === 2
        const wave = Math.sin(Date.now() / 1700 + i) * 0.7
        return {
          ...s,
          temp: hotspot ? clamp(s.temp + 0.1 + wave * 0.08, 30, 38) : clamp(s.temp + wave * 0.05, 27, 33),
          humidity: hotspot ? clamp(s.humidity - 0.18, 48, 70) : clamp(s.humidity + wave * 0.03, 55, 75),
          smoke: hotspot ? clamp(s.smoke + 0.7, 5, 42) : clamp(s.smoke + wave * 0.2, 4, 16),
          flame: hotspot && s.temp > 33 ? Math.min(1, s.flame + 0.03) : Math.max(0, s.flame - 0.02),
        }
      }))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [simulation])

  const scores = useMemo(() => sentinels.map(score), [sentinels])
  const maxScore = Math.max(...scores)
  const event: EventState = maxScore < 18 ? 'NORMAL' : maxScore < 35 ? 'ENVIRONMENTAL ANOMALY' : maxScore < 50 ? 'SUSPICIOUS EVENT' : maxScore < 68 ? 'CORROBORATED EVENT' : maxScore < 82 ? 'PROBABLE FIRE EVENT' : 'LOCALIZED EVENT'
  const eventPosition = useMemo(() => {
    const weights = sentinels.map(s => Math.max(score(s), 1))
    const total = weights.reduce((a, b) => a + b, 0)
    return { x: sentinels.reduce((a, s, i) => a + s.x * weights[i], 0) / total, y: sentinels.reduce((a, s, i) => a + s.y * weights[i], 0) / total, uncertainty: Math.max(4, 22 - maxScore * 0.17) }
  }, [sentinels, maxScore])

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2500) }
  const connectHardware = async () => {
    const bluetooth = (navigator as Navigator & { bluetooth?: { requestDevice: (options: unknown) => Promise<{ name?: string; gatt?: { connect: () => Promise<unknown> } }> } }).bluetooth
    if (!bluetooth) { notify('Web Bluetooth is unavailable in this browser.'); return }
    try {
      setHardware('SCANNING')
      const device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['7b6f0001-6d1e-4e5a-9a31-464952452d01'] })
      await device.gatt?.connect()
      setHardware('CONNECTED')
      notify(`Connected: ${device.name || 'FIRE-ECHO gateway'}`)
    } catch { setHardware('DISCONNECTED'); notify('Hardware connection cancelled or failed.') }
  }
  const sendMission = () => {
    const mission = `VERIFY ${Math.round(eventPosition.x)},${Math.round(eventPosition.y)}`
    setRobot(r => ({ ...r, mission, ack: 'MISSION_ACK (simulation)' }))
    notify('Verification mission queued in simulation mode.')
  }

  const card = (title: string, value: string, icon: React.ReactNode) => <div className="card"><div className="cardIcon">{icon}</div><div><div className="muted">{title}</div><strong>{value}</strong></div></div>
  const map = <div className="map"><div className="mapGrid" />{sentinels.map(s => <div key={s.id} className="node" style={{ left: `${s.x}%`, top: `${s.y}%` }} title={s.id}>{s.id.replace('S-', '')}</div>)}<div className="eventPoint" style={{ left: `${eventPosition.x}%`, top: `${eventPosition.y}%` }} /> <div className="robotPoint" style={{ left: `${robot.x}%`, top: `${robot.y}%` }}>R</div></div>

  return <div className="app">
    <header><div className="brand"><Flame size={24} /> FIRE-ECHO <span>2.0</span></div><div className="topStatus"><span className={`dot ${event === 'NORMAL' ? 'ok' : 'danger'}`} /> {event} <span className="source">{hardware === 'CONNECTED' ? 'REAL' : simulation ? 'SIMULATION' : 'OFFLINE/REPLAY'}</span></div></header>
    <aside>{pages.map(p => <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>)}</aside>
    <main><div className="pageTitle"><div><h1>{page}</h1><p>Distributed environmental intelligence • safe digital simulation</p></div><button className="primary" onClick={() => setSimulation(v => !v)}>{simulation ? 'Pause Simulation' : 'Start Simulation'}</button></div>
      {page === 'Home' && <><section className="cards">{card('Network Nodes', `${sentinels.length}`, <Satellite />)}{card('Online', `${sentinels.filter(s => s.health === 'ONLINE').length}`, <Wifi />)}{card('Event Confidence', `${Math.round(maxScore)} / 100`, <ShieldCheck />)}{card('Localization', `${Math.round(eventPosition.uncertainty)} units`, <Map />)}</section><section className="panel"><h2>Live Forest Overview</h2>{map}</section><section className="cards two">{card('Temperature Peak', `${Math.max(...sentinels.map(s => s.temp)).toFixed(1)} °C`, <Thermometer />)}{card('Smoke Peak', `${Math.max(...sentinels.map(s => s.smoke)).toFixed(0)}`, <Activity />)}{card('Robot', robot.mission, <Bot />)}{card('Gateway', hardware, hardware === 'CONNECTED' ? <Wifi /> : <WifiOff />)}</section></>}
      {page === 'Live Map' && <section className="panel"><h2>Live Map & Localization</h2>{map}<p className="note">Estimated event center: ({eventPosition.x.toFixed(1)}, {eventPosition.y.toFixed(1)}) • uncertainty radius: {eventPosition.uncertainty.toFixed(1)} units.</p></section>}
      {page === '3D Digital Twin' && <section className="panel"><div className="twin"><div className="forestTitle">FIRE-ECHO DIGITAL TWIN</div>{sentinels.map(s => <div key={s.id} className="tree" style={{ left: `${s.x}%`, top: `${s.y}%` }}>🌲</div>)}<div className="hotspot" style={{ left: `${eventPosition.x}%`, top: `${eventPosition.y}%` }}>⚠</div></div><p className="note">This first deployment uses a lightweight data-driven twin; the live coordinate system is shared with the map and robot mission planner.</p></section>}
      {page === 'Events' && <section className="panel"><h2>Event State Machine</h2><div className="pipeline">{['NORMAL','ENVIRONMENTAL ANOMALY','SUSPICIOUS EVENT','CORROBORATED EVENT','PROBABLE FIRE EVENT','LOCALIZED EVENT'].map(s => <div className={s === event ? 'stage selected' : 'stage'} key={s}>{s}</div>)}</div><p className="note">Current classification is calculated from multiple simulated sensor signals and is not a scientifically validated probability.</p></section>}
      {page === 'Incident Command' && <section className="panel"><h2>Incident Command</h2><div className="command"><strong>{event}</strong><p>Estimated center: {eventPosition.x.toFixed(1)}, {eventPosition.y.toFixed(1)}</p><p>Uncertainty: ±{eventPosition.uncertainty.toFixed(1)} units</p><button className="primary" onClick={sendMission}>Dispatch Verification Robot</button></div></section>}
      {page === 'Robot Control' && <section className="panel"><h2>Mobile Verification Robot</h2><div className="robotStats">{card('Connection', robot.connected ? 'CONNECTED' : 'SIMULATION', <Bot />)}{card('Battery', `${robot.battery}%`, <Battery />)}{card('Mission', robot.mission, <Map />)}{card('Acknowledgement', robot.ack, <Signal />)}</div><button className="primary" onClick={sendMission}>Send Verification Mission</button></section>}
      {page === 'Sentinel Network' && <section className="panel"><h2>Sentinel Network</h2><div className="table">{sentinels.map((s, i) => <div className="row" key={s.id}><b>{s.id}</b><span>{s.temp.toFixed(1)}°C</span><span>{s.humidity.toFixed(0)}% RH</span><span>Smoke {s.smoke.toFixed(0)}</span><span>Risk {scores[i].toFixed(0)}</span><span>{s.battery}%</span></div>)}</div></section>}
      {page === 'Hardware Center' && <section className="panel"><h2>Hardware Center</h2><p>Phone ↔ ESP32 gateway over Web Bluetooth.</p><div className="hardwareState"><Cpu /><strong>{hardware}</strong></div><button className="primary" onClick={connectHardware}>{hardware === 'SCANNING' ? 'Scanning…' : 'Connect ESP32 Gateway'}</button><p className="note">No hardware is claimed to be connected unless the browser reports a real BLE connection.</p></section>}
      {page === 'Simulation Lab' && <section className="panel"><h2>Simulation Lab</h2><p>Simulation feeds the same normalized telemetry, fusion, localization, and interface pipeline.</p><button className="primary" onClick={() => setSimulation(v => !v)}>{simulation ? 'Pause' : 'Run'} environmental simulation</button></section>}
      {page === 'Analytics' && <section className="panel"><h2>Analytics</h2><div className="cards two">{card('Average Temperature', `${(sentinels.reduce((a,s) => a+s.temp,0)/sentinels.length).toFixed(1)} °C`, <Thermometer />)}{card('Average Humidity', `${(sentinels.reduce((a,s) => a+s.humidity,0)/sentinels.length).toFixed(1)}%`, <Gauge />)}{card('Average Signal', `${(sentinels.reduce((a,s) => a+s.signal,0)/sentinels.length).toFixed(0)}%`, <Signal />)}{card('Highest Risk', `${maxScore.toFixed(0)}`, <AlertTriangle />)}</div></section>}
      {page === 'System Health' && <section className="panel"><h2>System Health</h2><p>Sentinels: {sentinels.length} configured / {sentinels.filter(s => s.health === 'ONLINE').length} online</p><p>Gateway: {hardware}</p><p>Simulation: {simulation ? 'RUNNING' : 'PAUSED'}</p><p>Data source: {hardware === 'CONNECTED' ? 'REAL' : simulation ? 'SIMULATION' : 'OFFLINE/REPLAY'}</p></section>}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>
}

export default App
