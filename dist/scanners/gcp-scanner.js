"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanGCP = scanGCP;
const compute_1 = require("@google-cloud/compute");
const functions_1 = require("@google-cloud/functions");
const content_scanner_1 = require("../utils/content-scanner");
/**
 * Scans GCP resources for cryptojacking indicators
 */
async function scanGCP(options) {
    const { logger, gcpProjects = [] } = options;
    const results = [];
    // If no projects specified, try to use the default project
    const projects = gcpProjects.length > 0 ? gcpProjects : [undefined];
    logger.info(`Scanning GCP projects: ${projects.filter(Boolean).join(", ") || "default project"}`);
    // Scan each project
    for (const project of projects) {
        logger.info(`Scanning project: ${project || "default"}`);
        // Scan Compute Engine instances
        try {
            const computeResults = await scanComputeInstances(project, options);
            results.push(...computeResults);
            logger.info(`Found ${computeResults.length} potential issues in Compute Engine instances`);
        }
        catch (error) {
            logger.error(`Error scanning Compute Engine instances in project ${project || "default"}:`, error);
        }
        // Scan Cloud Functions
        try {
            const functionsResults = await scanCloudFunctions(project, options);
            results.push(...functionsResults);
            logger.info(`Found ${functionsResults.length} potential issues in Cloud Functions`);
        }
        catch (error) {
            logger.error(`Error scanning Cloud Functions in project ${project || "default"}:`, error);
        }
    }
    logger.info(`GCP scan complete. Found ${results.length} potential issues.`);
    return results;
}
/**
 * Scans Compute Engine instances for cryptojacking indicators
 */
async function scanComputeInstances(projectId, options) {
    const { logger } = options;
    const results = [];
    const compute = new compute_1.Compute({ projectId });
    // Get all zones
    const [zones] = await compute.getZones();
    // Process each zone
    for (const zone of zones) {
        logger.debug(`Scanning Compute Engine instances in zone: ${zone.name}`);
        // Get all instances in the zone
        const [instances] = await zone.getVMs();
        // Process each instance
        for (const instance of instances) {
            const instanceName = instance.name;
            logger.debug(`Scanning Compute Engine instance: ${instanceName}`);
            // Get instance metadata
            const [metadata] = await instance.getMetadata();
            // Check startup script
            if (metadata.items) {
                const startupScript = metadata.items.find((item) => item.key === "startup-script");
                if (startupScript && startupScript.value) {
                    // Scan startup script
                    const matches = (0, content_scanner_1.scanContent)(startupScript.value, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `GCP Compute Engine Startup Script: ${instanceName}`,
                            itemType: "Compute Engine Startup Script",
                            contentPreview: startupScript.value.substring(0, 200) + (startupScript.value.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
            }
            // Check instance metadata
            const metadataJson = JSON.stringify(metadata);
            // Scan metadata
            const metadataMatches = (0, content_scanner_1.scanContent)(metadataJson, options);
            if (metadataMatches.length > 0) {
                const score = calculateScore(metadataMatches);
                results.push({
                    timestamp: new Date().toISOString(),
                    source: `GCP Compute Engine Metadata: ${instanceName}`,
                    itemType: "Compute Engine Metadata",
                    contentPreview: metadataJson.substring(0, 200) + (metadataJson.length > 200 ? "..." : ""),
                    matches: metadataMatches,
                    score,
                    severity: getSeverity(score),
                });
            }
        }
    }
    // Scan instance templates
    try {
        logger.debug("Scanning Compute Engine instance templates");
        // Get all instance templates
        const [templates] = await compute.getInstanceTemplates();
        // Process each template
        for (const template of templates) {
            const templateName = template.name;
            logger.debug(`Scanning instance template: ${templateName}`);
            // Get template properties
            const [metadata] = await template.getMetadata();
            // Convert template to string for scanning
            const templateJson = JSON.stringify(metadata);
            // Scan template
            const matches = (0, content_scanner_1.scanContent)(templateJson, options);
            if (matches.length > 0) {
                const score = calculateScore(matches);
                results.push({
                    timestamp: new Date().toISOString(),
                    source: `GCP Instance Template: ${templateName}`,
                    itemType: "Instance Template",
                    contentPreview: templateJson.substring(0, 200) + (templateJson.length > 200 ? "..." : ""),
                    matches,
                    score,
                    severity: getSeverity(score),
                });
            }
        }
    }
    catch (error) {
        logger.error("Error scanning instance templates:", error);
    }
    return results;
}
/**
 * Scans Cloud Functions for cryptojacking indicators
 */
async function scanCloudFunctions(projectId, options) {
    const { logger } = options;
    const results = [];
    const functionsClient = new functions_1.CloudFunctionsServiceClient();
    // Get all regions
    // Note: This is a simplified approach. In a real implementation, you would need to
    // query for available regions or use a predefined list.
    const regions = ["us-central1", "us-east1", "us-west1", "europe-west1", "asia-east1"];
    // Process each region
    for (const region of regions) {
        logger.debug(`Scanning Cloud Functions in region: ${region}`);
        try {
            // List functions in the region
            const parent = projectId ? `projects/${projectId}/locations/${region}` : `projects/-/locations/${region}`;
            const [functions] = await functionsClient.listFunctions({
                parent,
            });
            // Process each function
            for (const func of functions) {
                if (!func.name)
                    continue;
                const functionName = func.name.split("/").pop();
                logger.debug(`Scanning Cloud Function: ${functionName}`);
                // Check environment variables
                if (func.environmentVariables) {
                    const envVars = JSON.stringify(func.environmentVariables);
                    // Scan environment variables
                    const matches = (0, content_scanner_1.scanContent)(envVars, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `GCP Cloud Function Environment Variables: ${functionName}`,
                            itemType: "Cloud Function Environment",
                            contentPreview: envVars.substring(0, 200) + (envVars.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
                // Check function source code
                // Note: Downloading and scanning function source code would require additional implementation
                logger.debug(`Cloud Function ${functionName} source code scanning is not implemented yet.`);
            }
        }
        catch (error) {
            logger.error(`Error scanning Cloud Functions in region ${region}:`, error);
        }
    }
    return results;
}
/**
 * Calculates the score based on matches
 */
function calculateScore(matches) {
    return matches.reduce((total, match) => total + match.weight, 0);
}
/**
 * Determines severity based on score
 */
function getSeverity(score) {
    if (score >= 15) {
        return "HIGH";
    }
    else if (score >= 8) {
        return "MEDIUM";
    }
    else if (score > 0) {
        return "LOW";
    }
    else {
        return "CLEAN";
    }
}
