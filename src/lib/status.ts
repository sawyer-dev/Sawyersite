export type StatusTone = 'done' | 'active' | 'muted';

export interface StatusInfo {
  label: string;
  tone: StatusTone;
}

/** Labels for every status value across the collections. */
export const statusInfo: Record<string, StatusInfo> = {
  complete: { label: 'Complete', tone: 'done' },
  'in-progress': { label: 'In progress', tone: 'active' },
  archived: { label: 'Archived', tone: 'muted' },
  current: { label: 'Current', tone: 'active' },
  historical: { label: 'Past interest', tone: 'muted' },
  prototype: { label: 'Prototype', tone: 'active' },
  experiment: { label: 'Experiment', tone: 'active' },
  stable: { label: 'Stable', tone: 'done' },
};

export function getStatus(status: string): StatusInfo {
  return statusInfo[status] ?? { label: status, tone: 'muted' };
}
