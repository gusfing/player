export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length < 4 || domain.length > 253) {
    return false
  }

  const normalized = normalizeDomain(domain)
  
  const domainRegex = /^(?!:\/\/)(?=.*[a-z0-9-]+\.)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i
  
  if (!domainRegex.test(normalized)) {
    return false
  }

  const invalidPatterns = [
    /localhost/,
    /\.\./,
    /^\./,
    /\.$/,
  ]

  for (const pattern of invalidPatterns) {
    if (pattern.test(normalized)) {
      return false
    }
  }

  return true
}

export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/$/, '')
    .replace(/\.\.+/g, '.')
}

export function validateAndNormalizeDomain(domain: string): { valid: boolean; normalized: string; error?: string } {
  const trimmed = domain.trim()
  
  if (!trimmed) {
    return { valid: false, normalized: '', error: 'Domain is required' }
  }

  const normalized = normalizeDomain(trimmed)

  if (isValidDomain(normalized)) {
    return { valid: true, normalized }
  }

  const errors = []

  if (normalized.includes('://') || normalized.includes('http')) {
    errors.push('Remove http:// or https://')
  }

  if (normalized.includes('@')) {
    errors.push('Enter a domain, not an email')
  }

  if (!normalized.includes('.')) {
    errors.push('Enter a valid domain (e.g., example.com)')
  }

  const tld = normalized.split('.').pop()
  if (!tld || tld.length < 2) {
    errors.push('Invalid domain extension')
  }

  return {
    valid: false,
    normalized,
    error: errors.length > 0 ? errors[0] : 'Invalid domain format',
  }
}

export function isLocalhost(domain: string): boolean {
  const normalized = normalizeDomain(domain)
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized.endsWith('.localhost')
  )
}

export function shouldSkipDomainValidation(): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  return false
}
