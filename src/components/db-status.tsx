"use client"

import { useEffect, useState } from "react"

type Status = "loading" | "connected" | "disconnected"

export function DbStatus() {
  const [status, setStatus] = useState<Status>("loading")

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status === "ok" ? "connected" : "disconnected")
      })
      .catch(() => {
        setStatus("disconnected")
      })
  }, [])

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="size-2 rounded-full bg-zinc-400 animate-pulse" />
        <span>Connecting...</span>
      </div>
    )
  }

  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <span className="size-2 rounded-full bg-emerald-500" />
        <span>Connected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
      <span className="size-2 rounded-full bg-red-500" />
      <span>Disconnected</span>
    </div>
  )
}
