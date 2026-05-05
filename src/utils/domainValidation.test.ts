import { describe, it, expect } from 'vitest'
import { isValidDomain, normalizeDomain, validateAndNormalizeDomain, isLocalhost } from '../utils/domainValidation'

describe('domainValidation', () => {
  describe('normalizeDomain', () => {
    it('should trim whitespace', () => {
      expect(normalizeDomain('  example.com  ')).toBe('example.com')
    })

    it('should convert to lowercase', () => {
      expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com')
    })

    it('should remove protocol prefix', () => {
      expect(normalizeDomain('https://www.example.com')).toBe('example.com')
      expect(normalizeDomain('http://example.com')).toBe('example.com')
    })

    it('should remove www prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com')
    })

    it('should remove trailing slash', () => {
      expect(normalizeDomain('example.com/')).toBe('example.com')
    })

    it('should collapse multiple dots', () => {
      expect(normalizeDomain('example..com')).toBe('example.com')
    })
  })

  describe('isValidDomain', () => {
    it('should return true for valid domains', () => {
      expect(isValidDomain('example.com')).toBe(true)
      expect(isValidDomain('my-site.io')).toBe(true)
      expect(isValidDomain('sub.domain.com')).toBe(true)
    })

    it('should return false for invalid domains', () => {
      expect(isValidDomain('')).toBe(false)
      expect(isValidDomain('ab')).toBe(false) // too short
      expect(isValidDomain('localhost')).toBe(false)
      expect(isValidDomain('.example.com')).toBe(false)
      expect(isValidDomain('example.com.')).toBe(false)
    })
  })

  describe('validateAndNormalizeDomain', () => {
    it('should return valid for good domains', () => {
      const result = validateAndNormalizeDomain('example.com')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBe('example.com')
    })

    it('should return invalid for empty input', () => {
      const result = validateAndNormalizeDomain('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Domain is required')
    })

    it('should normalize domain with http and return valid', () => {
      // normalizeDomain strips the protocol, so it becomes valid
      const result = validateAndNormalizeDomain('http://example.com')
      expect(result.normalized).toBe('example.com')
      expect(result.valid).toBe(true)
    })

    it('should return invalid for email-like input', () => {
      const result = validateAndNormalizeDomain('user@example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('email')
    })

    it('should return invalid for domain without TLD', () => {
      const result = validateAndNormalizeDomain('example')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('valid domain')
    })
  })

  describe('isLocalhost', () => {
    it('should return true for localhost', () => {
      expect(isLocalhost('localhost')).toBe(true)
      expect(isLocalhost('127.0.0.1')).toBe(true)
      expect(isLocalhost('mysite.localhost')).toBe(true)
    })

    it('should return false for regular domains', () => {
      expect(isLocalhost('example.com')).toBe(false)
    })
  })
})
