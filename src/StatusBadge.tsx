import { cn } from '../utils/cn'
import type { ForestStatus, NodeState, RobotStatus } from '../types'

const forestStyles: Record<ForestStatus, string> = {
  NORMAL: 'bg-status-normal/20 text-status-normal border-status-normal/40',
  WATCH: 'bg-status-watch/20 text-status-watch border-status-watch/40',
  ELEVATED: 'bg-status-elevated/20 text-status-elevated border-status-elevated/40',
  CRITICAL: 'bg-status-critical/20 text-status-critical border-status-critical/40',
}

const nodeStyles: Record<NodeState, string> = {
  normal: 'bg-status-normal text-forest-950',
  watch: 'bg-status-watch text-forest-950',
  suspicious: 'bg-status-elevated text-white',
  critical: 'bg-status-critical text-white',
  offline: 'bg-gray-500 text-white',
}

export function ForestStatusBadge({ status, large }: { status: ForestStatus; large?: boolean }) {
  return (
    <span className={cn(
      'status-pill border font-bold tracking-wide',
      forestStyles[status],
      large && 'text-sm px-4 py-1.5'
    )}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {status}
    </span>
  )
}

export function NodeStateDot({ state }: { state: NodeState }) {
  return (
    <span className={cn('inline-block w-2.5 h-2.5 rounded-full', nodeStyles[state])} title={state} />
  )
}

export function RobotStatusBadge({ status }: { status: RobotStatus }) {
  const map: Record<RobotStatus, string> = {
    STANDBY: 'text-status-normal',
    EN_ROUTE: 'text-ember-400',
    VERIFYING: 'text-status-watch',
    RETURNING: 'text-blue-400',
    OFFLINE: 'text-gray-400',
  }
  return <span className={cn('font-semibold text-sm', map[status])}>{status.replace('_', ' ')}</span>
}
