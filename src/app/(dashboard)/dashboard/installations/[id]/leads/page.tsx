"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Download, Mail, User, Phone, Calendar, ExternalLink, Loader2 } from "lucide-react"

interface Lead {
  id: string
  email: string
  name: string | null
  customFields: Record<string, unknown> | null
  ipHash: string | null
  createdAt: string
}

interface Installation {
  id: string
  domain: string
}

export default function LeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/installations/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setInstallation(data)
      }

      const leadsResponse = await fetch(`/api/leads?installationId=${resolvedParams.id}`)
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeads(leadsData.leads || [])
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    setIsExporting(true)

    const headers = ["Email", "Name", "Phone", "Date", "URL"]
    const rows = leads.map((lead) => {
      const phone = lead.customFields?.phone || ""
      return [
        lead.email,
        lead.name || "",
        phone,
        new Date(lead.createdAt).toLocaleString(),
        "",
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-${installation?.domain || "export"}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    setIsExporting(false)
  }

  const getPhone = (lead: Lead) => {
    if (typeof lead.customFields === "string") {
      try {
        const parsed = JSON.parse(lead.customFields)
        return parsed.phone || ""
      } catch {
        return ""
      }
    }
    return lead.customFields?.phone || ""
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard/installations/${resolvedParams.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-gray-500 mt-1">
            {installation?.domain} • {leads.length} total leads
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={isExporting || leads.length === 0}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{leads.length}</p>
            <p className="text-sm text-gray-500">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {leads.filter((l) => l.name).length}
            </p>
            <p className="text-sm text-gray-500">With Name</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {leads.filter((l) => getPhone(l)).length}
            </p>
            <p className="text-sm text-gray-500">With Phone</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-lg mb-2">No leads yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              When visitors submit the lead capture form from your videos, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-600">Email</th>
                    <th className="text-left p-4 font-medium text-gray-600">Name</th>
                    <th className="text-left p-4 font-medium text-gray-600">Phone</th>
                    <th className="text-left p-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {lead.email}
                          </a>
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.name ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {lead.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {getPhone(lead) ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {getPhone(lead)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
