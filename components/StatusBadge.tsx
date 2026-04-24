/**
 * components/StatusBadge.tsx
 * Reusable status badge for personnel + application statuses.
 */

'use client';

import { Personnel, Application, TaskPriority, TaskStatus, TaskType, SubmissionStatus } from '@/lib/supabase';
import { getStatusColors, getAppStatusColors, getTaskPriorityColors, getTaskStatusColors, getTaskTypeLabel } from '@/lib/utils';

// ── Personnel Status Badge ────────────────────────────────────────────────────

interface PersonnelStatusBadgeProps {
  status: Personnel['status'];
  pulse?: boolean;
  size?:  'sm' | 'md';
}

export function PersonnelStatusBadge({
  status,
  pulse = false,
  size  = 'md',
}: PersonnelStatusBadgeProps) {
  const colors = getStatusColors(status);
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${colors.bg} ${colors.text}
        font-mono ${textSize} font-medium tracking-widest uppercase
        px-2 py-0.5 rounded-sm border border-current/20
        transition-all duration-500
      `}
    >
      <span
        className={`
          inline-block w-1.5 h-1.5 rounded-full ${colors.dot}
          ${pulse ? 'animate-status-pulse' : ''}
        `}
      />
      {status}
    </span>
  );
}

// ── Application Status Badge ──────────────────────────────────────────────────

interface AppStatusBadgeProps {
  status: Application['status'];
}

export function AppStatusBadge({ status }: AppStatusBadgeProps) {
  const colors = getAppStatusColors(status);

  return (
    <span
      className={`
        inline-flex items-center
        ${colors.bg} ${colors.text}
        font-mono text-[10px] font-medium tracking-widest uppercase
        px-2 py-0.5 rounded-sm border border-current/20
      `}
    >
      {status}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus | SubmissionStatus }) {
  const colors = getTaskStatusColors(status);
  return (
    <span className={`inline-flex items-center ${colors.bg} ${colors.text} font-mono text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm border border-current/20`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors = getTaskPriorityColors(priority);
  return (
    <span className={`inline-flex items-center ${colors.bg} ${colors.text} font-mono text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm border border-current/20`}>
      {priority}
    </span>
  );
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  return (
    <span className="inline-flex items-center bg-surface border border-border font-mono text-[10px] text-text tracking-widest uppercase px-2 py-0.5 rounded-sm">
      {getTaskTypeLabel(type)}
    </span>
  );
}
