/** The fill colours of a `Meter`: the brand colour while there is room, the status colours as the value nears its end. */
export type MeterTone = 'primary' | 'success' | 'warning' | 'danger'

/** The value a meter shows: rounded and held inside `0..max`, so a reading past the end never overflows the track. */
export function meterValue(value: number, max: number): number {
  if (!Number.isFinite(value) || !(max > 0)) {
    return 0
  }

  return Math.min(max, Math.max(0, Math.round(value)))
}
