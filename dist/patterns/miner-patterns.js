"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectionPatterns = void 0;
// Compile all regex patterns for better performance
exports.detectionPatterns = [
    // Miner software names (weight: 8)
    {
        pattern: /\bxmrig\b/i,
        category: "miner_software",
        weight: 8,
        description: "XMRig Monero miner",
    },
    {
        pattern: /\bccminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "CCMiner cryptocurrency miner",
    },
    {
        pattern: /\bcpuminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "CPU Miner cryptocurrency miner",
    },
    {
        pattern: /\betherminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "Ethereum miner",
    },
    {
        pattern: /\bclaymore\b/i,
        category: "miner_software",
        weight: 8,
        description: "Claymore cryptocurrency miner",
    },
    {
        pattern: /\bphoenixminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "PhoenixMiner cryptocurrency miner",
    },
    {
        pattern: /\bgminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "GMiner cryptocurrency miner",
    },
    {
        pattern: /\bnbminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "NBMiner cryptocurrency miner",
    },
    {
        pattern: /\bteamredminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "TeamRedMiner cryptocurrency miner",
    },
    {
        pattern: /\blolminer\b/i,
        category: "miner_software",
        weight: 8,
        description: "LolMiner cryptocurrency miner",
    },
    // Mining pool URLs and protocols (weight: 9)
    {
        pattern: /stratum\+tcp:\/\//i,
        category: "mining_pools",
        weight: 9,
        description: "Stratum mining protocol",
    },
    {
        pattern: /pool\.supportxmr\.com/i,
        category: "mining_pools",
        weight: 9,
        description: "SupportXMR mining pool",
    },
    {
        pattern: /pool\.minexmr\.com/i,
        category: "mining_pools",
        weight: 9,
        description: "MineXMR mining pool",
    },
    {
        pattern: /xmrpool\.eu/i,
        category: "mining_pools",
        weight: 9,
        description: "XMRPool.eu mining pool",
    },
    {
        pattern: /nanopool\.org/i,
        category: "mining_pools",
        weight: 9,
        description: "Nanopool mining pool",
    },
    {
        pattern: /nicehash\.com/i,
        category: "mining_pools",
        weight: 9,
        description: "NiceHash mining pool",
    },
    {
        pattern: /ethermine\.org/i,
        category: "mining_pools",
        weight: 9,
        description: "Ethermine mining pool",
    },
    {
        pattern: /f2pool\.com/i,
        category: "mining_pools",
        weight: 9,
        description: "F2Pool mining pool",
    },
    {
        pattern: /hiveon\.net/i,
        category: "mining_pools",
        weight: 9,
        description: "Hiveon mining pool",
    },
    {
        pattern: /flypool\.org/i,
        category: "mining_pools",
        weight: 9,
        description: "Flypool mining pool",
    },
    // Cryptocurrency wallet addresses (weight: 7)
    {
        pattern: /\b4[0-9AB][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{93}\b/,
        category: "wallet_patterns",
        weight: 7,
        description: "Monero wallet address",
    },
    {
        pattern: /\b0x[a-fA-F0-9]{40}\b/,
        category: "wallet_patterns",
        weight: 7,
        description: "Ethereum wallet address",
    },
    {
        pattern: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/,
        category: "wallet_patterns",
        weight: 7,
        description: "Bitcoin wallet address",
    },
    {
        pattern: /\bt[a-zA-Z0-9]{33,34}\b/,
        category: "wallet_patterns",
        weight: 7,
        description: "Litecoin wallet address",
    },
    // Miner command-line parameters (weight: 6)
    {
        pattern: /--algo=/i,
        category: "miner_parameters",
        weight: 6,
        description: "Mining algorithm parameter",
    },
    {
        pattern: /-o\s+stratum/i,
        category: "miner_parameters",
        weight: 6,
        description: "Mining pool connection parameter",
    },
    {
        pattern: /-u\s+wallet/i,
        category: "miner_parameters",
        weight: 6,
        description: "Mining wallet parameter",
    },
    {
        pattern: /--cpu-priority=/i,
        category: "miner_parameters",
        weight: 6,
        description: "CPU priority parameter",
    },
    {
        pattern: /--donate-level=/i,
        category: "miner_parameters",
        weight: 6,
        description: "Donation level parameter",
    },
    {
        pattern: /--threads=/i,
        category: "miner_parameters",
        weight: 6,
        description: "Threads parameter",
    },
    // Obfuscation techniques (weight: 4)
    {
        pattern: /eval\(atob\(/i,
        category: "obfuscation_techniques",
        weight: 4,
        description: "Base64 decode and eval",
    },
    {
        pattern: /eval\(decodeURIComponent\(/i,
        category: "obfuscation_techniques",
        weight: 4,
        description: "URI decode and eval",
    },
    {
        pattern: /\\x[0-9a-fA-F]{2}/,
        category: "obfuscation_techniques",
        weight: 4,
        description: "Hex-encoded characters",
    },
    // Behavioral indicators (weight: 5)
    {
        pattern: /nice\s+(-20|-19|-18|-17|-16|-15)/i,
        category: "behavioral_indicators",
        weight: 5,
        description: "Process priority manipulation",
    },
    {
        pattern: /sysctl\s+-w\s+vm\.nr_hugepages=/i,
        category: "behavioral_indicators",
        weight: 5,
        description: "Hugepages configuration",
    },
    {
        pattern: /ps\s+-ef\s+.*grep\s+.*kill/i,
        category: "behavioral_indicators",
        weight: 5,
        description: "Process killing pattern",
    },
    // Network indicators (weight: 3)
    {
        pattern: /curl\s+.*\|\s*bash/i,
        category: "network_indicators",
        weight: 3,
        description: "Download and execute pattern",
    },
    {
        pattern: /wget\s+.*\s*-O\s+.*\s*&&\s+chmod\s+.*\s*&&/i,
        category: "network_indicators",
        weight: 3,
        description: "Download, make executable, and run pattern",
    },
];
// Add more patterns as needed to reach 100+ indicators
