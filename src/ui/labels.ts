import type { PauseReason } from '../domain/types'

export const PAUSE_LABELS: Record<PauseReason, string> = {
  systemfel: 'Systemfel',
  mote: 'Möte',
  olycka: 'Olycka',
  annat: 'Annat',
}
