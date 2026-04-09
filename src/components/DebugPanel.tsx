"use client"

import { useEffect, useState, useCallback } from "react"
import { useDebugStore, DebugLog } from "@/hooks/useDebugStore"
import { X, Copy, Trash2, Zap, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

export function DebugPanel() {
  const { enabled, logs, clearLogs, toggle, ga4Id, pixelId, isDebugActive } = useDebugStore()
  const [isMinimized, setIsMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [hasPlayer, setHasPlayer] = useState(true)

  const checkForPlayer = useCallback(() => {
    const hasYtShell = document.querySelector('.yt-shell-wrapper')
    setHasPlayer(!!hasYtShell)
  }, [])

  useEffect(() => {
    setMounted(true)
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "YT_SHELL_DEBUG") {
        useDebugStore.getState().addLog({
          event: event.data.payload.event,
          data: event.data.payload.data,
          ga4Status: event.data.payload.ga4Status,
          pixelStatus: event.data.payload.pixelStatus,
          timestamp: new Date(event.data.payload.timestamp),
        })
      }
    }

    window.addEventListener("message", handleMessage)
    
    checkForPlayer()
    const interval = setInterval(checkForPlayer, 2000)
    
    return () => {
      window.removeEventListener("message", handleMessage)
      clearInterval(interval)
    }
  }, [checkForPlayer])

  const shouldShow = mounted && isDebugActive()
  if (!shouldShow) return null

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString()
  }

  const copyLogs = () => {
    const text = logs.map((log) => {
      return `[${formatTime(log.timestamp)}] ${log.event} | GA4: ${log.ga4Status} | Pixel: ${log.pixelStatus}`
    }).join("\n")
    navigator.clipboard.writeText(text)
  }

  const sendTestEvent = () => {
    setTestSent(true)
    window.postMessage({
      type: "YT_SHELL_DEBUG_TEST",
    }, "*")
    
    setTimeout(() => setTestSent(false), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "text-green-400"
      case "failed": return "text-red-400"
      case "pending": return "text-yellow-400"
      case "not_configured": return "text-gray-500"
      default: return "text-gray-400"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 text-white rounded-lg shadow-2xl z-[9999] font-mono text-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-semibold">Tracking Debug Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={toggle} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Active IDs */}
          <div className="p-3 border-b border-gray-700 space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Active IDs</div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">GA4:</span>
              <span className={ga4Id ? "text-green-400 text-xs" : "text-gray-500 text-xs"}>
                {ga4Id || "Not configured"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pixel:</span>
              <span className={pixelId ? "text-green-400 text-xs" : "text-gray-500 text-xs"}>
                {pixelId || "Not configured"}
              </span>
            </div>
          </div>

          {/* Player Status */}
          {!hasPlayer && (
            <div className="p-3 border-b border-gray-700 bg-yellow-900/30">
              <div className="flex items-center gap-2 text-yellow-400 text-xs">
                <RefreshCw className="w-3 h-3" />
                <span>No player detected on this page</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Add the embed code to this page to test tracking
              </p>
            </div>
          )}

          {/* Event Log */}
          <div className="max-h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                <p className="text-xs mb-2">No events yet</p>
                {!hasPlayer && (
                  <p className="text-xs text-gray-600">
                    Make sure the YouTube Shell script is installed on this page
                  </p>
                )}
                {hasPlayer && (
                  <p className="text-xs text-gray-600">
                    Click "Test Event" to verify tracking
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {logs.map((log) => (
                  <div key={log.id} className="p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                        <span className={`font-medium ${log.event === 'test_event' ? 'text-blue-400' : 'text-white'}`}>
                          {log.event}
                        </span>
                      </div>
                      {log.event === 'test_event' && (
                        <span className="text-blue-400 text-[10px] bg-blue-900/50 px-1.5 py-0.5 rounded">
                          TEST
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className={getStatusColor(log.ga4Status)}>
                        GA4 {log.ga4Status === "sent" ? "✓" : log.ga4Status === "failed" ? "✗" : log.ga4Status === "pending" ? "..." : "—"}
                      </span>
                      <span className={getStatusColor(log.pixelStatus)}>
                        PX {log.pixelStatus === "sent" ? "✓" : log.pixelStatus === "failed" ? "✗" : log.pixelStatus === "pending" ? "..." : "—"}
                      </span>
                    </div>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-gray-500 cursor-pointer text-[10px]">View data</summary>
                        <pre className="text-gray-600 text-[10px] mt-1 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-2 border-t border-gray-700 flex gap-2">
            <button
              onClick={sendTestEvent}
              disabled={testSent}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                testSent
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Zap className="w-3 h-3" />
              {testSent ? "Sent!" : "Test Event"}
            </button>
            <button
              onClick={copyLogs}
              disabled={logs.length === 0}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy logs"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
