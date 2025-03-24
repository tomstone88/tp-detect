document.addEventListener("DOMContentLoaded", () => {
  // Connect to Socket.io
  const socket = io()

  // Get DOM elements
  const scanForm = document.getElementById("scan-form")
  const scanType = document.getElementById("scan-type")
  const scanStatus = document.getElementById("scan-status")
  const scanProgressContainer = document.getElementById("scan-progress-container")
  const scanProgress = document.getElementById("scan-progress")
  const scanSteps = {
    local: document.getElementById("step-local"),
    aws: document.getElementById("step-aws"),
    gcp: document.getElementById("step-gcp"),
    azure: document.getElementById("step-azure"),
  }

  // Show/hide cloud provider options based on scan type
  scanType.addEventListener("change", function () {
    const value = this.value
    const allOptions = document.querySelectorAll(".scan-options")

    // Hide all options first
    allOptions.forEach((option) => option.classList.add("d-none"))

    // Show relevant options
    if (value === "aws" || value === "full") {
      document.getElementById("aws-options").classList.remove("d-none")
    }

    if (value === "gcp" || value === "full") {
      document.getElementById("gcp-options").classList.remove("d-none")
    }

    if (value === "azure" || value === "full") {
      document.getElementById("azure-options").classList.remove("d-none")
    }
  })

  // Handle form submission
  scanForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Get form data
    const formData = new FormData(scanForm)
    const scanType = formData.get("scanType")

    // Prepare options object
    const options = {}

    if (scanType === "aws" || scanType === "full") {
      const awsRegions = formData.get("awsRegions")
      const awsProfile = formData.get("awsProfile")

      if (awsRegions) {
        options.awsRegions = awsRegions.split(",").map((r) => r.trim())
      }

      if (awsProfile) {
        options.awsProfile = awsProfile
      }
    }

    if (scanType === "gcp" || scanType === "full") {
      const gcpProjects = formData.get("gcpProjects")

      if (gcpProjects) {
        options.gcpProjects = gcpProjects.split(",").map((p) => p.trim())
      }
    }

    if (scanType === "azure" || scanType === "full") {
      const azureSubscriptions = formData.get("azureSubscriptions")

      if (azureSubscriptions) {
        options.azureSubscriptions = azureSubscriptions.split(",").map((s) => s.trim())
      }
    }

    const scanDir = formData.get("scanDir")
    if (scanDir) {
      options.scanDir = scanDir
    }

    options.base64Decode = formData.get("base64Decode") === "on"

    // Update UI
    scanStatus.innerHTML = `<p class="text-center">Scan in progress...</p>`
    scanProgressContainer.classList.remove("d-none")

    // Reset step badges
    Object.values(scanSteps).forEach((step) => {
      step.querySelector(".badge").className = "badge bg-secondary rounded-pill"
      step.querySelector(".badge").textContent = "Pending"
    })

    // Start scan
    fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scanType,
        options,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Scan initiated successfully
          console.log("Scan initiated:", data)
        } else {
          // Error starting scan
          scanStatus.innerHTML = `<p class="text-center text-danger">Error: ${data.error}</p>`
          scanProgressContainer.classList.add("d-none")
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        scanStatus.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`
        scanProgressContainer.classList.add("d-none")
      })
  })

  // Socket.io event handlers
  socket.on("scan:started", (data) => {
    console.log("Scan started:", data)
    scanStatus.innerHTML = `<p class="text-center">Scan in progress: ${data.scanType}</p>`

    // Update progress
    scanProgress.style.width = "5%"
    scanProgress.textContent = "5%"
    scanProgress.setAttribute("aria-valuenow", 5)
  })

  socket.on("scan:progress", (data) => {
    console.log("Scan progress:", data)

    // Update step badge
    if (scanSteps[data.step]) {
      scanSteps[data.step].querySelector(".badge").className = "badge bg-success rounded-pill"
      scanSteps[data.step].querySelector(".badge").textContent = "Completed"
    }

    // Update progress based on completed steps
    let completedSteps = 0
    let totalSteps = 0

    Object.values(scanSteps).forEach((step) => {
      if (step.querySelector(".badge").textContent === "Completed") {
        completedSteps++
      }
      totalSteps++
    })

    const progressPercent = Math.round((completedSteps / totalSteps) * 100)
    scanProgress.style.width = `${progressPercent}%`
    scanProgress.textContent = `${progressPercent}%`
    scanProgress.setAttribute("aria-valuenow", progressPercent)
  })

  socket.on("scan:completed", (data) => {
    console.log("Scan completed:", data)

    // Update UI
    scanStatus.innerHTML = `
      <p class="text-center text-success">Scan completed successfully!</p>
      <p class="text-center">Found ${data.results.length} potential issues.</p>
      <div class="text-center mt-3">
        <a href="/results" class="btn btn-primary">View Results</a>
      </div>
    `

    // Update progress
    scanProgress.style.width = "100%"
    scanProgress.textContent = "100%"
    scanProgress.setAttribute("aria-valuenow", 100)
  })

  socket.on("scan:error", (data) => {
    console.error("Scan error:", data)

    // Update UI
    scanStatus.innerHTML = `<p class="text-center text-danger">Error: ${data.error}</p>`
    scanProgressContainer.classList.add("d-none")
  })

  // Check if scan type is specified in URL
  const urlParams = new URLSearchParams(window.location.search)
  const scanTypeParam = urlParams.get("type")

  if (scanTypeParam) {
    // Map URL param to form value
    const typeMap = {
      local: "local",
      cloud: "aws", // Default to AWS for cloud
      full: "full",
    }

    if (typeMap[scanTypeParam]) {
      scanType.value = typeMap[scanTypeParam]
      scanType.dispatchEvent(new Event("change"))
    }
  }
})

