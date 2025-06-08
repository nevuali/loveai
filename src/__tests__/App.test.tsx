import { describe, it, expect } from 'vitest'

describe('App Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })
  
  it('should have working test environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})