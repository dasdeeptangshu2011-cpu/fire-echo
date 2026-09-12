import { useFireEchoStore } from '../store/useFireEchoStore'
import { Header } from '../components/Header'
import { ForestStatusBadge } from '../components/StatusBadge'
import { Thermometer, Droplets, Wind, Activity, Radio, Bot, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

export function HomeScreen() {
  const {
    forestStatus, forestIndex, nodes, robot, events, health, alerts
  } = useFireEchoStore()

  const active = nodes.filter(n => n.state !== 'offline')
  const avgTemp = active.length
    ? (active.reduce((s, n) => s + n.reading.temperature, 0) / active.length).toFixed(1)
    : '—'
  const avgHum = active.length
    ? Math.round(active.reduce((s, n) => s + n.reading.humidity, 0) / active.length)
    : '—'
  const avgAQ = active.length
    ? active.reduce((s, n) => s + n.reading.airQuality, 0) / active.length
    : 0
  const avgPart = active.length
    ? active.reduce((s, n) => s + n.reading.particulate, 0) / active.length
    : 0
  const riskZones = nodes.filter(n => n.state === 'watch' || n.state === 'suspicious' || n.state === 'critical').length
  const activeEvent = events.find(e => e.status !== 'RESOLVED')

  return (
    <div className="h-full overflow-y-auto pb-24 fade-in">
      <Header />

      {/* Main Status Card */}
      <div className="px-4 mt-2">
        <div className={cn(
          'panel p-5 relative overflow-hidden',
          forestStatus === 'CRITICAL' && 'border-status-critical/50',
          forestStatus === 'ELEVATED' && 'border-status-elevated/50'
        )}>
          <div className="panel-header mb-2">Forest Status</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold tracking-tight mb-1">{forestStatus}</div>
              <p className="text-sm text-white/60">
                {forestStatus === 'NORMAL' && 'All observation nodes within baseline ranges.'}
                {forestStatus === 'WATCH' && 'Elevated readings detected. Monitoring intensified.'}
                {forestStatus === 'ELEVATED' && 'Multi-node anomaly. Verification recommended.'}
                {forestStatus === 'CRITICAL' && 'High-confidence environmental event in progress.'}
              </p>
            </div>
            <ForestStatusBadge status={forestStatus} large />
          </div>
          {activeEvent && (
            <Link
              to="/events"
              className="mt-4 flex items-center justify-between bg-forest-800/80 rounded-lg px-3 py-2.5 text-sm border border-forest-600/40"
            >
              <span>
                <span className="text-ember-400 font-semibold">{activeEvent.id}</span>
                <span className="text-white/60"> · Sector {activeEvent.sector}</span>
              </span>
              <span className="text-white/80 font-medium">{activeEvent.confidence}% conf.</span>
            </Link>
          )}
        </div>
      </div>

      {/* Live Environment */}
      <div className="px-4 mt-4">
        <div className="panel-header mb-2 px-1">Live Environment</div>
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard icon={<Thermometer size={16} />} label="Temperature" value={`${avgTemp}°C`} />
          <MetricCard icon={<Droplets size={16} />} label="Humidity" value={`${avgHum}%`} />
          <MetricCard
            icon={<Wind size={16} />}
            label="Air Quality"
            value={avgAQ < 25 ? 'Normal' : avgAQ < 45 ? 'Elevated' : 'High'}
            sub={`${avgAQ.toFixed(0)} idx`}
          />
          <MetricCard
            icon={<Activity size={16} />}
            label="Particulate"
            value={avgPart < 20 ? 'Normal' : avgPart < 40 ? 'Rising' : 'High'}
            sub={`${avgPart.toFixed(0)}`}
          />
          <MetricCard icon={<Radio size={16} />} label="Active Nodes" value={`${health.nodesOnline}/${health.nodesTotal}`} />
          <MetricCard icon={<Shield size={16} />} label="Risk Zones" value={String(riskZones)} />
        </div>
      </div>

      {/* Forest Environmental Index */}
      <div className="px-4 mt-4">
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="panel-header">Forest Environmental Index</div>
              <div className="text-3xl font-bold mt-1 tabular-nums">{forestIndex.overall}<span className="text-lg text-white/40">/100</span></div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-forest-600 flex items-center justify-center relative">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#245224"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeDasharray={`${forestIndex.overall}, 100`}
                />
              </svg>
              <span className="text-sm font-bold">{forestIndex.overall}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <IndexBar label="Thermal condition" value={forestIndex.thermal} />
            <IndexBar label="Atmospheric condition" value={forestIndex.atmospheric} />
            <IndexBar label="Dryness condition" value={forestIndex.dryness} />
            <IndexBar label="Anomaly stability" value={forestIndex.anomalyStability} />
            <IndexBar label="Network confidence" value={forestIndex.networkConfidence} />
          </div>
          <p className="text-[10px] text-white/40 mt-3">
            Application-specific indicator · Not an official wildfire probability score
          </p>
        </div>
      </div>

      {/* Robot + Quick status */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-2.5">
        <Link to="/robot" className="panel p-3.5 hover:bg-forest-800/60 transition">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
            <Bot size={14} /> Verification Robot
          </div>
          <div className="font-semibold text-ember-400">{robot.status.replace('_', ' ')}</div>
          <div className="text-xs text-white/50 mt-0.5">Battery {Math.round(robot.battery)}%</div>
        </Link>
        <div className="panel p-3.5">
          <div className="text-xs text-white/60 mb-1">System Health</div>
          <div className="font-semibold text-status-normal">
            {health.nodesOnline === health.nodesTotal ? 'ALL SYSTEMS NOMINAL' : 'DEGRADED'}
          </div>
          <div className="text-xs text-white/50 mt-0.5">Gateway {health.gateway}</div>
        </div>
      </div>

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <div className="px-4 mt-4 mb-6">
          <div className="panel-header mb-2 px-1">Recent Alerts</div>
          <div className="space-y-2">
            {alerts.slice(0, 4).map(a => (
              <div key={a.id} className={cn(
                'panel px-3 py-2.5 text-sm border-l-2',
                a.level === 'CRITICAL' && 'border-l-status-critical',
                a.level === 'HIGH_PRIORITY' && 'border-l-status-elevated',
                a.level === 'WARNING' && 'border-l-status-watch',
                a.level === 'INFORMATION' && 'border-l-forest-500'
              )}>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-white/50 mt-0.5">{a.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-1.5 text-white/50 text-[11px] uppercase tracking-wide mb-1">
        {icon} {label}
      </div>
      <div className="metric-value text-xl">{value}</div>
      {sub && <div className="text-[10px] text-white/40">{sub}</div>}
    </div>
  )
}

function IndexBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 text-white/60 text-xs truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-forest-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest-500 to-status-normal"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium tabular-nums">{value}</span>
    </div>
  )
}
