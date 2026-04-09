"use client"

import { useState } from "react"
import { Plus, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateAndNormalizeDomain } from "@/utils/domainValidation"

interface DomainInputProps {
  existingDomains: string[]
  onAdd: (domain: string) => void
  disabled?: boolean
}

export function DomainInput({ existingDomains, onAdd, disabled }: DomainInputProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!value.trim()) {
      setError("Enter a domain")
      return
    }

    const result = validateAndNormalizeDomain(value)

    if (!result.valid) {
      setError(result.error || "Invalid domain")
      return
    }

    if (existingDomains.includes(result.normalized)) {
      setError("Domain already added")
      return
    }

    onAdd(result.normalized)
    setValue("")
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            placeholder="example.com"
            disabled={disabled}
            className={error ? "border-red-500" : success ? "border-green-500" : ""}
          />
          {success && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
        <Button type="submit" disabled={disabled || !value.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Enter domain without http:// or https:// (e.g., example.com)
      </p>
    </form>
  )
}
