// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Meter from './Meter.vue'

describe('Meter', () => {
  it('is a meter with its value, range and label for assistive technology', () => {
    const meter = mount(Meter, { props: { value: 82.4, tone: 'warning', label: 'Assistants, 82% used' } }).get('[role="meter"]')

    expect(meter.attributes('aria-valuenow')).toBe('82')
    expect(meter.attributes('aria-valuemin')).toBe('0')
    expect(meter.attributes('aria-valuemax')).toBe('100')
    expect(meter.attributes('aria-label')).toBe('Assistants, 82% used')
    expect(meter.attributes('data-tone')).toBe('warning')
    expect(meter.get('div').classes()).toContain('bg-warning-dot')
    expect(meter.get('div').attributes('style')).toContain('width: 82%')
  })

  it('fills in the brand colour by default', () => {
    const meter = mount(Meter, { props: { value: 10, label: 'x' } }).get('[role="meter"]')

    expect(meter.attributes('data-tone')).toBe('primary')
    expect(meter.get('div').classes()).toContain('bg-primary')
  })

  it('never goes past the ends of the range', () => {
    expect(mount(Meter, { props: { value: 140, tone: 'danger', label: 'x' } }).get('[role="meter"]').attributes('aria-valuenow')).toBe('100')
    expect(mount(Meter, { props: { value: -3, label: 'x' } }).get('[role="meter"]').attributes('aria-valuenow')).toBe('0')
  })

  it('fills its share of a range other than a hundred', () => {
    const meter = mount(Meter, { props: { value: 3, max: 4, label: '3 of 4' } }).get('[role="meter"]')

    expect(meter.attributes('aria-valuemax')).toBe('4')
    expect(meter.get('div').attributes('style')).toContain('width: 75%')
  })

  it('takes a class for its track', () => {
    expect(mount(Meter, { props: { value: 1, label: 'x', class: 'h-1' } }).get('[role="meter"]').classes()).toContain('h-1')
  })
})
