import { NavLink } from 'react-router-dom'
import { Home, Map, AlertTriangle, Bot, BarChart3 } from 'lucide-react'
import { cn } from '../utils/cn'
import { useFireEchoStore } from '../store/useFireEchoStore'

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/events', icon: AlertTriangle, label: 'Events' },
  { to: '/robot', icon: Bot, label: 'Robot' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
]

export function BottomNav() {
  const unread = useFireEchoStore(s => s.alerts.filter(a => !a.read).length)
  const status = useFireEchoStore(s => s.forestStatus)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-forest-900/95 border-t border-forest-700/50 backdrop-blur-md pb-safe">
      <div className="flex items-stretch justify-around max-w-lg mx-auto h-16">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition relative',
              isActive ? 'text-ember-400' : 'text-white/50 hover:text-white/80'
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.8} />
              {label === 'Events' && unread > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-status-critical text-[9px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {label === 'Home' && (status === 'CRITICAL' || status === 'ELEVATED') && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-critical animate-pulse" />
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
