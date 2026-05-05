import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const condition = true
      const result = cn('base', condition && 'conditional')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
    })

    it('should handle undefined and false values', () => {
      const result = cn('foo', undefined, false, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle tailwind-merge special classes', () => {
      const result = cn('mx-4 mx-2', 'p-4')
      expect(result).toContain('p-4')
    })
  })
})
