import { createFileRoute } from "@tanstack/react-router"

import FuryDashboard from "@/components/dashboard/FuryDashboard"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  return <FuryDashboard />
}
