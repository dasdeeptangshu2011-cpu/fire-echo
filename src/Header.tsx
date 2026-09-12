import { Wifi, WifiOff } from 'lucide-react'
import { format } from 'date-fns'
import { useFireEchoStore } from '../store/useFireEchoStore'
import { ForestStatusBadge } from './StatusBadge'

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const isOnline = useFireEchoStore(s => s.isOnline)
  const status = useFireEchoStore(s => s.forestStatus)

  return (
    <header className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-white">
            {title || 'FIRE-ECHO'}
          </h1>
          <ForestStatusBadge status={status} />
        </div>
        <p className="text-xs text-white/50 mt-0.5">
          {subtitle || 'Forest Intelligence System'} · {format(new Date(), 'HH:mm:ss')}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {isOnline ? (
          <>
            <Wifi size={14} className="text-status-normal" />
            <span className="text-status-normal font-medium">ONLINE</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-status-critical" />
            <span className="text-status-critical font-medium">LOCAL ONLY</span>
          </>
        )}
      </div>
    </header>
  )
}
