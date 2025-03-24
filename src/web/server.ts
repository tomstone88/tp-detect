import express from "express"
import path from "path"
import session from "express-session"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import http from "http"
import { Server as SocketServer } from "socket.io"
import dotenv from "dotenv"
import { setupLogger } from "../utils/logger"
import { scanLocalSystem } from "../scanners/local-scanner"
import { scanAWS } from "../scanners/aws-scanner"
import { scanGCP } from "../scanners/gcp-scanner"
import { scanAzure } from "../scanners/azure-scanner"
import type { ScanOptions, ScanResult } from "../types"
import { terminateMiner } from "./actions/terminate-miner"
import { initiateTrace } from "./actions/initiate-trace"

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = new SocketServer(server)

// Set up middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
  session({
    secret: process.env.SESSION_SECRET || "crypto-detector-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
)

// Set up view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Serve static files
app.use(express.static(path.join(__dirname, "public")))

// Set up logger
const logger = setupLogger({
  verbose: true,
  quiet: false,
  logFile: "web-server.log",
})

// Socket.io connection
io.on("connection", (socket) => {
  logger.info("Client connected")

  socket.on("disconnect", () => {
    logger.info("Client disconnected")
  })
})

// Routes
app.get("/", (req, res) => {
  res.render("index", { title: "Crypto Detector" })
})

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "Dashboard" })
})

app.get("/scan", (req, res) => {
  res.render("scan", { title: "New Scan" })
})

app.get("/results", (req, res) => {
  res.render("results", { title: "Scan Results" })
})

// API Routes
app.post("/api/scan", async (req, res) => {
  try {
    const { scanType, options } = req.body

    // Create scan options
    const scanOptions: ScanOptions = {
      output: `scan_${Date.now()}.txt`,
      summary: `summary_${Date.now()}.txt`,
      format: "json",
      logFile: `scan_log_${Date.now()}.txt`,
      verbose: true,
      quiet: false,
      localOnly: scanType === "local",
      base64Decode: true,
      logger,
      ...options,
    }

    // Start the scan
    const results: ScanResult[] = []

    // Emit scan started event
    io.emit("scan:started", { scanType })

    // Perform scan based on type
    if (scanType === "local" || scanType === "full") {
      const localResults = await scanLocalSystem(scanOptions)
      results.push(...localResults)
      io.emit("scan:progress", { step: "local", completed: true, results: localResults })
    }

    if (scanType === "aws" || scanType === "full") {
      const awsResults = await scanAWS(scanOptions)
      results.push(...awsResults)
      io.emit("scan:progress", { step: "aws", completed: true, results: awsResults })
    }

    if (scanType === "gcp" || scanType === "full") {
      const gcpResults = await scanGCP(scanOptions)
      results.push(...gcpResults)
      io.emit("scan:progress", { step: "gcp", completed: true, results: gcpResults })
    }

    if (scanType === "azure" || scanType === "full") {
      const azureResults = await scanAzure(scanOptions)
      results.push(...azureResults)
      io.emit("scan:progress", { step: "azure", completed: true, results: azureResults })
    }

    // Emit scan completed event
    io.emit("scan:completed", { results })

    // Return results
    res.json({ success: true, results })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error during scan: ${errorMessage}`)
    io.emit("scan:error", { error: errorMessage })
    res.status(500).json({ success: false, error: errorMessage })
  }
})

app.post("/api/terminate", async (req, res) => {
  try {
    const { source, itemType, resourceId } = req.body

    if (!source || !itemType || !resourceId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" })
    }

    const result = await terminateMiner(source, itemType, resourceId, logger)

    io.emit("miner:terminated", { source, itemType, resourceId, result })

    res.json({ success: true, result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error terminating miner: ${errorMessage}`)
    res.status(500).json({ success: false, error: errorMessage })
  }
})

app.post("/api/trace", async (req, res) => {
  try {
    const { source, itemType, resourceId } = req.body

    if (!source || !itemType || !resourceId) {
      return res.status(400).json({ success: false, error: "Missing required parameters" })
    }

    const traceId = await initiateTrace(source, itemType, resourceId, logger)

    io.emit("trace:initiated", { source, itemType, resourceId, traceId })

    res.json({ success: true, traceId })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error initiating trace: ${errorMessage}`)
    res.status(500).json({ success: false, error: errorMessage })
  }
})

app.get("/api/trace/:traceId", async (req, res) => {
  try {
    const { traceId } = req.params

    // In a real implementation, you would fetch the trace status from a database
    // For now, we'll just return a mock status
    const status = {
      traceId,
      status: "in_progress",
      progress: Math.floor(Math.random() * 100),
      artifacts: [
        { type: "log", name: "system.log", size: "1.2MB" },
        { type: "memory_dump", name: "memory.dmp", size: "256MB" },
        { type: "network", name: "network_capture.pcap", size: "45MB" },
      ],
      findings: [
        { type: "connection", destination: "185.212.47.56:3333", protocol: "TCP" },
        { type: "process", name: "xmrig.exe", pid: 4567, path: "/tmp/.hidden/xmrig" },
      ],
    }

    res.json({ success: true, trace: status })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error fetching trace: ${errorMessage}`)
    res.status(500).json({ success: false, error: errorMessage })
  }
})

// Start the server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

export default server

