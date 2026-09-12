import { useState } from 'react'
import { useFireEchoStore } from '../store/useFireEchoStore'
import { Header } from '../components/Header'
import { NodeStateDot } from '../components/StatusBadge'
import { cn } from '../utils/cn'
import { X, Layers, Info } from 'lucide-react'
import type { NodeState } from '../types'

const LAYERS = [
  { id: 'network', label: 'Node Network' },
  { id: 'temperature', label: 'Temperature' },
  { id: 'humidity', label: 'Humidity' },
  { id: 'air', label: 'Air Quality' },
  { id: 'particulate', label: 'Particulate' },
  { id: 'risk', label: 'Risk' },
  { id: 'robot', label: 'Robot' },
]

function nodeColor(state: NodeState, layer: string, reading: { temperature: number; humidity: number; airQuality: number; particulate: number }) {
  if (layer === 'network' || layer === 'robot') {
    const map: Record<NodeState, string> = {
      normal: '#22c55e', watch: '#eab308', suspicious: '#f97316', critical: '#ef4444', offline: '#6b7280',
    }
    return map[state]
  }
  if (layer === 'temperature') {
    const t = reading.temperature
    if (t > 38) return '#ef4444'
    if (t > 34) return '#f97316'
    if (t > 30) return '#eab308'
    return '#22c55e'
  }
  if (layer === 'humidity') {
    const h = reading.humidity
    if (h < 25) return '#ef4444'
    if (h < 35) return '#f97316'
    if (h < 45) return '#eab308'
    return '#3b82f6'
  }
  if (layer === 'air' || layer === 'particulate') {
    const v = layer === 'air' ? reading.airQuality : reading.particulate
    if (v > 50) return '#ef4444'
    if (v > 30) return '#f97316'
    if (v > 18) return '#eab308'
    return '#22c55e'
  }
  if (layer === 'risk') {
    if (state === 'critical') return '#ef4444'
    if (state === 'suspicious') return '#f97316'
    if (state === 'watch') return '#eab308'
    return '#22c55e'
  }
  return '#22c55e'
}

export function MapScreen() {
  const { nodes, robot, mapLayer, setMapLayer, selectedNodeId, selectNode, dispatchRobot } = useFireEchoStore()
  const [showLayers, setShowLayers] = useState(false)
  const selected = nodes.find(n => n.id === selectedNodeId)

  return (
    <div className="h-full flex flex-col pb-20 fade-in">
      <Header title="Live Map" subtitle="Monitored region · Estimated spatial visualization" />

      <div className="flex-1 relative mx-3 mb-2 panel overflow-hidden min-h-[320px]">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(45,106,45,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,45,0.4) 1px, transparent 1px)`,
            backgroundSize: '33.33% 33.33%',
          }}
        />
        <div className="absolute top-3 left-3 text-xs font-mono text-white/40 z-10">N ↑</div>
        <button onClick={() => setShowLayers(!showLayers)} className="absolute top-3 right-3 z-20 btn-ghost flex items-center gap-1.5 text-xs py-1.5">
          <Layers size={14} /> Layers
        </button>
        {showLayers && (
          <div className="absolute top-12 right-3 z-30 panel p-2 w-44 space-y-0.5 shadow-xl">
            {LAYERS.map(l => (
              <button key={l.id} onClick={() => { setMapLayer(l.id); setShowLayers(false) }}
                className={cn('w-full text-left px-2.5 py-1.5 rounded text-xs transition', mapLayer === l.id ? 'bg-ember-500/20 text-ember-400' : 'hover:bg-forest-800')}>
                {l.label}
              </button>
            ))}
          </div>
        )}
        {(mapLayer === 'temperature' || mapLayer === 'humidity' || mapLayer === 'air' || mapLayer === 'particulate' || mapLayer === 'risk') && (
          <div className="absolute bottom-3 left-3 right-3 z-10 text-[10px] text-white/40 flex items-center gap-1">
            <Info size={10} /> Estimated spatial visualization · Not direct measurement at every point
          </div>
        )}
        <div className="absolute inset-0">
          {nodes.map(node => {
            const color = nodeColor(node.state, mapLayer, node.reading)
            const isPrimary = node.priority === 'PRIMARY'
            const isSecondary = node.priority === 'SECONDARY'
            return (
              <button key={node.id} onClick={() => selectNode(node.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}>
                {(isPrimary || node.state === 'critical') && (
                  <span className="absolute rounded-full pulse-ring" style={{ background: color, width: 28, height: 28, margin: -6, left: 0, top: 0 }} />
                )}
                <span className={cn('relative flex items-center justify-center rounded-full border-2 border-forest-950 shadow-lg transition-transform group-hover:scale-110', selectedNodeId === node.id && 'ring-2 ring-white scale-110')}
                  style={{ width: isPrimary ? 22 : isSecondary ? 18 : 14, height: isPrimary ? 22 : isSecondary ? 18 : 14, backgroundColor: color }} />
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition">{node.label}</span>
              </button>
            )
          })}
          {(mapLayer === 'robot' || mapLayer === 'network' || mapLayer === 'risk') && (
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${robot.x * 100}%`, top: `${robot.y * 100}%` }}>
              <div className="w-5 h-5 rounded-sm bg-blue-500 border-2 border-white rotate-45 shadow-lg" />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 flex flex-wrap gap-3 text-[10px] text-white/50 mb-2">
        <span className="flex items-center gap-1"><NodeStateDot state="normal" /> Normal</span>
        <span className="flex items-center gap-1"><NodeStateDot state="watch" /> Watch</span>
        <span className="flex items-center gap-1"><NodeStateDot state="suspicious" /> Suspicious</span>
        <span className="flex items-center gap-1"><NodeStateDot state="critical" /> Critical</span>
        <span className="flex items-center gap-1"><NodeStateDot state="offline" /> Offline</span>
      </div>

      {selected && (
        <div className="fixed inset-x-0 bottom-16 z-40 p-3 fade-in">
          <div className="panel p-4 max-h-[50vh] overflow-y-auto shadow-2xl border-forest-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-lg">{selected.label}</div>
                <div className="text-xs text-white/50">Sector {selected.sector} · {selected.state.toUpperCase()}</div>
              </div>
              <button onClick={() => selectNode(null)} className="p-1.5 rounded-lg hover:bg-forest-800"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-forest-800/60 rounded-lg p-2.5"><div className="metric-label">Temperature</div><div className="font-semibold tabular-nums">{selected.reading.temperature.toFixed(1)}°C</div></div>
              <div className="bg-forest-800/60 rounded-lg p-2.5"><div className="metric-label">Humidity</div><div className="font-semibold tabular-nums">{selected.reading.humidity.toFixed(0)}%</div></div>
              <div className="bg-forest-800/60 rounded-lg p-2.5"><div className="metric-label">Air Quality</div><div className="font-semibold tabular-nums">{selected.reading.airQuality.toFixed(0)}</div></div>
              <div className="bg-forest-800/60 rounded-lg p-2.5"><div className="metric-label">Particulate</div><div className="font-semibold tabular-nums">{selected.reading.particulate.toFixed(0)}</div></div>
            </div>
            <div className="text-xs space-y-1 text-white/60 mb-3">
              <div>Confidence: <span className="text-white font-medium">{selected.confidence.toFixed(0)}%</span></div>
              <div>Battery: <span className="text-white font-medium">{selected.battery.toFixed(0)}%</span> · Signal {selected.signal.toFixed(0)}%</div>
              <div>Priority: <span className="text-white font-medium">{selected.priority}</span></div>
              <div className="text-[10px] text-white/40">MEASURED values</div>
            </div>
            {(selected.state === 'watch' || selected.state === 'suspicious' || selected.state === 'critical') && (
              <button onClick={() => { dispatchRobot(selected.sector); selectNode(null) }} className="btn-primary w-full text-sm">
                Send Verification Robot to Sector {selected.sector}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
