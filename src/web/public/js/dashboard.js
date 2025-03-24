import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Connect to Socket.io
  const socket = io()

  // Get DOM elements
  const totalScans = document.getElementById("total-scans")
  const totalThreats = document.getElementById("total-threats")
  const mitigatedThreats = document.getElementById("mitigated-threats")
  const activeTraces = document.getElementById("active-traces")
  const activityBody = document.getElementById("activity-body")

  // Load dashboard data
  loadDashboardData()

  // Socket.io event handlers
  socket.on("scan:completed", (data) => {
    console.log("New scan completed:", data)
    loadDashboardData()
    addActivity("Scan Completed", `Found ${data.results.length} potential issues`, "Completed")
  })

  socket.on("miner:terminated", (data) => {
    console.log("Miner terminated:", data)
    loadDashboardData()
    addActivity("Miner Terminated", `${data.source}`, "Completed")
  })

  socket.on("trace:initiated", (data) => {
    console.log("Trace initiated:", data)
    loadDashboardData()
    addActivity("Trace Initiated", `${data.source} (Trace ID: ${data.traceId})`, "In Progress")
  })

  // Load dashboard data
  function loadDashboardData() {
    // In a real app, you would fetch this from the server
    // For now, we'll use localStorage or generate mock data

    // Get scan results
    const results = JSON.parse(localStorage.getItem("scanResults")) || []

    // Update counts
    totalScans.textContent = Math.floor(Math.random() * 50) + 10 // Mock data
    totalThreats.textContent = results.length
    mitigatedThreats.textContent = Math.floor(Math.random() * results.length)
    activeTraces.textContent = Math.floor(Math.random() * 5)

    // Create charts
    createSeverityChart(results)
    createSourceChart(results)

    // Load recent activity
    loadRecentActivity()
  }

  // Create severity chart
  function createSeverityChart(results) {
    const high = results.filter((r) => r.severity === "HIGH").length
    const medium = results.filter((r) => r.severity === "MEDIUM").length
    const low = results.filter((r) => r.severity === "LOW").length

    const ctx = document.getElementById("severity-chart").getContext("2d")

    // Check if chart already exists
    if (window.severityChart) {
      window.severityChart.destroy()
    }

    window.severityChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["High", "Medium", "Low"],
        datasets: [
          {
            data: [high, medium, low],
            backgroundColor: ["#dc3545", "#ffc107", "#17a2b8"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }

  // Create source chart
  function createSourceChart(results) {
    // Group by source type
    const sources = {}

    results.forEach((result) => {
      const sourceType = result.source.split(":")[0]
      sources[sourceType] = (sources[sourceType] || 0) + 1
    })

    const labels = Object.keys(sources)
    const data = Object.values(sources)

    const ctx = document.getElementById("source-chart").getContext("2d")

    // Check if chart already exists
    if (window.sourceChart) {
      window.sourceChart.destroy()
    }

    window.sourceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Threats by Source",
            data: data,
            backgroundColor: "#007bff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    })
  }

  // Load recent activity
  function loadRecentActivity() {
    // In a real app, you would fetch this from the server
    // For now, we'll generate mock data

    const activities = [
      {
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        activity: "Scan Completed",
        details: "Full infrastructure scan",
        status: "Completed",
      },
      {
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        activity: "Miner Terminated",
        details: "AWS EC2 Instance: i-1234567890abcdef0",
        status: "Completed",
      },
      {
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        activity: "Trace Initiated",
        details: "GCP Compute Engine: instance-1",
        status: "In Progress",
      },
      {
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        activity: "Scan Completed",
        details: "Local system scan",
        status: "Completed",
      },
      {
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        activity: "Trace Completed",
        details: "Azure VM: vm-cryptominer",
        status: "Completed",
      },
    ]

    // Populate activity table
    activityBody.innerHTML = ""

    activities.forEach((activity) => {
      const row = document.createElement("tr")

      const statusClass =
        {
          Completed: "success",
          "In Progress": "warning",
          Failed: "danger",
        }[activity.status] || "secondary"

      row.innerHTML = `
        <td>${new Date(activity.timestamp).toLocaleString()}</td>
        <td>${activity.activity}</td>
        <td>${activity.details}</td>
        <td><span class="badge bg-${statusClass}">${activity.status}</span></td>
      `

      activityBody.appendChild(row)
    })
  }

  // Add new activity
  function addActivity(activity, details, status) {
    const row = document.createElement("tr")

    const statusClass =
      {
        Completed: "success",
        "In Progress": "warning",
        Failed: "danger",
      }[status] || "secondary"

    row.innerHTML = `
      <td>${new Date().toLocaleString()}</td>
      <td>${activity}</td>
      <td>${details}</td>
      <td><span class="badge bg-${statusClass}">${status}</span></td>
    `

    // Add to top of table
    if (activityBody.firstChild) {
      activityBody.insertBefore(row, activityBody.firstChild)
    } else {
      activityBody.appendChild(row)
    }

    // Remove last row if more than 10
    if (activityBody.children.length > 10) {
      activityBody.removeChild(activityBody.lastChild)
    }
  }
})

