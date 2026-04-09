"use client"

import { X, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DomainListProps {
  domains: string[]
  onRemove: (domain: string) => void
  disabled?: boolean
}

export function DomainList({ domains, onRemove, disabled }: DomainListProps) {
  if (domains.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>No domains added yet</p>
        <p className="text-xs mt-1">Add your first domain below</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {domains.map((domain) => (
        <div
          key={domain}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border group"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-mono">{domain}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(domain)}
            disabled={disabled}
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
