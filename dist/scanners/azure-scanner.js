"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanAzure = scanAzure;
const identity_1 = require("@azure/identity");
const arm_compute_1 = require("@azure/arm-compute");
const arm_resources_1 = require("@azure/arm-resources");
const arm_subscriptions_1 = require("@azure/arm-subscriptions");
const arm_containerinstance_1 = require("@azure/arm-containerinstance");
const content_scanner_1 = require("../utils/content-scanner");
/**
 * Scans Azure resources for cryptojacking indicators
 */
async function scanAzure(options) {
    const { logger, azureSubscriptions = [] } = options;
    const results = [];
    // Get credentials
    const credentials = new identity_1.DefaultAzureCredential();
    // If no subscriptions specified, get all accessible subscriptions
    let subscriptionIds = azureSubscriptions;
    if (subscriptionIds.length === 0) {
        logger.info("No Azure subscriptions specified, getting all accessible subscriptions");
        try {
            const subscriptionClient = new arm_subscriptions_1.SubscriptionClient(credentials);
            const subscriptions = await subscriptionClient.subscriptions.list();
            subscriptionIds = subscriptions.map((sub) => sub.subscriptionId || "").filter(Boolean);
            logger.info(`Found ${subscriptionIds.length} accessible subscriptions`);
        }
        catch (error) {
            logger.error("Error getting Azure subscriptions:", error);
            return results;
        }
    }
    logger.info(`Scanning Azure subscriptions: ${subscriptionIds.join(", ")}`);
    // Scan each subscription
    for (const subscriptionId of subscriptionIds) {
        logger.info(`Scanning subscription: ${subscriptionId}`);
        // Scan virtual machines
        try {
            const vmResults = await scanVirtualMachines(subscriptionId, credentials, options);
            results.push(...vmResults);
            logger.info(`Found ${vmResults.length} potential issues in virtual machines`);
        }
        catch (error) {
            logger.error(`Error scanning virtual machines in subscription ${subscriptionId}:`, error);
        }
        // Scan VM scale sets
        try {
            const vmssResults = await scanVMScaleSets(subscriptionId, credentials, options);
            results.push(...vmssResults);
            logger.info(`Found ${vmssResults.length} potential issues in VM scale sets`);
        }
        catch (error) {
            logger.error(`Error scanning VM scale sets in subscription ${subscriptionId}:`, error);
        }
        // Scan container instances
        try {
            const containerResults = await scanContainerInstances(subscriptionId, credentials, options);
            results.push(...containerResults);
            logger.info(`Found ${containerResults.length} potential issues in container instances`);
        }
        catch (error) {
            logger.error(`Error scanning container instances in subscription ${subscriptionId}:`, error);
        }
        // Scan resource groups
        try {
            const resourceResults = await scanResourceGroups(subscriptionId, credentials, options);
            results.push(...resourceResults);
            logger.info(`Found ${resourceResults.length} potential issues in resource groups`);
        }
        catch (error) {
            logger.error(`Error scanning resource groups in subscription ${subscriptionId}:`, error);
        }
    }
    logger.info(`Azure scan complete. Found ${results.length} potential issues.`);
    return results;
}
/**
 * Scans Azure virtual machines for cryptojacking indicators
 */
async function scanVirtualMachines(subscriptionId, credentials, options) {
    const { logger } = options;
    const results = [];
    const computeClient = new arm_compute_1.ComputeManagementClient(credentials, subscriptionId);
    // Get all VMs
    const vms = await computeClient.virtualMachines.listAll();
    // Process each VM
    for (const vm of vms) {
        const vmName = vm.name || "unknown";
        const resourceGroup = getResourceGroupFromId(vm.id || "");
        logger.debug(`Scanning Azure VM: ${vmName} in resource group ${resourceGroup}`);
        // Check custom script extensions
        try {
            const extensions = await computeClient.virtualMachineExtensions.list(resourceGroup, vmName);
            for (const extension of extensions) {
                const extensionName = extension.name || "unknown";
                // Check if it's a custom script extension
                if (extension.publisher === "Microsoft.Compute" &&
                    (extension.extensionType === "CustomScriptExtension" || extension.extensionType === "CustomScript")) {
                    logger.debug(`Scanning custom script extension: ${extensionName}`);
                    // Get extension settings
                    if (extension.settings) {
                        const settingsJson = JSON.stringify(extension.settings);
                        // Scan settings
                        const matches = (0, content_scanner_1.scanContent)(settingsJson, options);
                        if (matches.length > 0) {
                            const score = calculateScore(matches);
                            results.push({
                                timestamp: new Date().toISOString(),
                                source: `Azure VM Custom Script Extension: ${vmName}/${extensionName}`,
                                itemType: "VM Custom Script",
                                contentPreview: settingsJson.substring(0, 200) + (settingsJson.length > 200 ? "..." : ""),
                                matches,
                                score,
                                severity: getSeverity(score),
                            });
                        }
                    }
                }
            }
        }
        catch (error) {
            logger.error(`Error scanning extensions for VM ${vmName}:`, error);
        }
        // Check VM OS profile
        if (vm.osProfile) {
            // Check custom data
            if (vm.osProfile.customData) {
                let customData = vm.osProfile.customData;
                // If base64 encoded, decode it
                if (options.base64Decode) {
                    try {
                        customData = Buffer.from(customData, "base64").toString("utf-8");
                    }
                    catch (error) {
                        logger.debug(`Error decoding customData for VM ${vmName}:`, error);
                    }
                }
                // Scan custom data
                const matches = (0, content_scanner_1.scanContent)(customData, options);
                if (matches.length > 0) {
                    const score = calculateScore(matches);
                    results.push({
                        timestamp: new Date().toISOString(),
                        source: `Azure VM Custom Data: ${vmName}`,
                        itemType: "VM Custom Data",
                        contentPreview: customData.substring(0, 200) + (customData.length > 200 ? "..." : ""),
                        matches,
                        score,
                        severity: getSeverity(score),
                    });
                }
            }
            // Check Linux configuration
            if (vm.osProfile.linuxConfiguration?.provisionVMAgent) {
                // Check SSH keys
                if (vm.osProfile.linuxConfiguration.ssh?.publicKeys) {
                    const sshKeys = vm.osProfile.linuxConfiguration.ssh.publicKeys.map((key) => key.keyData || "").join("\n");
                    // Scan SSH keys
                    const matches = (0, content_scanner_1.scanContent)(sshKeys, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `Azure VM SSH Keys: ${vmName}`,
                            itemType: "VM SSH Keys",
                            contentPreview: sshKeys.substring(0, 200) + (sshKeys.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
            }
        }
    }
    return results;
}
/**
 * Scans Azure VM scale sets for cryptojacking indicators
 */
async function scanVMScaleSets(subscriptionId, credentials, options) {
    const { logger } = options;
    const results = [];
    const computeClient = new arm_compute_1.ComputeManagementClient(credentials, subscriptionId);
    // Get all VM scale sets
    const scaleSets = await computeClient.virtualMachineScaleSets.listAll();
    // Process each scale set
    for (const scaleSet of scaleSets) {
        const scaleSetName = scaleSet.name || "unknown";
        const resourceGroup = getResourceGroupFromId(scaleSet.id || "");
        logger.debug(`Scanning Azure VM Scale Set: ${scaleSetName} in resource group ${resourceGroup}`);
        // Check VM profile
        if (scaleSet.virtualMachineProfile) {
            // Check extensions
            if (scaleSet.virtualMachineProfile.extensionProfile?.extensions) {
                for (const extension of scaleSet.virtualMachineProfile.extensionProfile.extensions) {
                    const extensionName = extension.name || "unknown";
                    // Check if it's a custom script extension
                    if (extension.publisher === "Microsoft.Compute" &&
                        (extension.type === "CustomScriptExtension" || extension.type === "CustomScript")) {
                        logger.debug(`Scanning custom script extension: ${extensionName}`);
                        // Get extension settings
                        if (extension.settings) {
                            const settingsJson = JSON.stringify(extension.settings);
                            // Scan settings
                            const matches = (0, content_scanner_1.scanContent)(settingsJson, options);
                            if (matches.length > 0) {
                                const score = calculateScore(matches);
                                results.push({
                                    timestamp: new Date().toISOString(),
                                    source: `Azure VM Scale Set Custom Script Extension: ${scaleSetName}/${extensionName}`,
                                    itemType: "VMSS Custom Script",
                                    contentPreview: settingsJson.substring(0, 200) + (settingsJson.length > 200 ? "..." : ""),
                                    matches,
                                    score,
                                    severity: getSeverity(score),
                                });
                            }
                        }
                    }
                }
            }
            // Check OS profile
            if (scaleSet.virtualMachineProfile.osProfile) {
                // Check custom data
                if (scaleSet.virtualMachineProfile.osProfile.customData) {
                    let customData = scaleSet.virtualMachineProfile.osProfile.customData;
                    // If base64 encoded, decode it
                    if (options.base64Decode) {
                        try {
                            customData = Buffer.from(customData, "base64").toString("utf-8");
                        }
                        catch (error) {
                            logger.debug(`Error decoding customData for VM Scale Set ${scaleSetName}:`, error);
                        }
                    }
                    // Scan custom data
                    const matches = (0, content_scanner_1.scanContent)(customData, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `Azure VM Scale Set Custom Data: ${scaleSetName}`,
                            itemType: "VMSS Custom Data",
                            contentPreview: customData.substring(0, 200) + (customData.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
            }
        }
    }
    return results;
}
/**
 * Scans Azure container instances for cryptojacking indicators
 */
async function scanContainerInstances(subscriptionId, credentials, options) {
    const { logger } = options;
    const results = [];
    const containerClient = new arm_containerinstance_1.ContainerInstanceManagementClient(credentials, subscriptionId);
    // Get all container groups
    const containerGroups = await containerClient.containerGroups.listBySubscription();
    // Process each container group
    for (const group of containerGroups) {
        const groupName = group.name || "unknown";
        const resourceGroup = getResourceGroupFromId(group.id || "");
        logger.debug(`Scanning Azure Container Group: ${groupName} in resource group ${resourceGroup}`);
        // Check containers
        if (group.containers) {
            for (const container of group.containers) {
                const containerName = container.name || "unknown";
                // Check command line
                if (container.command) {
                    const commandLine = container.command.join(" ");
                    // Scan command line
                    const matches = (0, content_scanner_1.scanContent)(commandLine, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `Azure Container Command: ${groupName}/${containerName}`,
                            itemType: "Container Command",
                            contentPreview: commandLine.substring(0, 200) + (commandLine.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
                // Check environment variables
                if (container.environmentVariables) {
                    const envVars = container.environmentVariables
                        .map((env) => `${env.name}=${env.value || "[secure]"}`)
                        .join("\n");
                    // Scan environment variables
                    const matches = (0, content_scanner_1.scanContent)(envVars, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `Azure Container Environment Variables: ${groupName}/${containerName}`,
                            itemType: "Container Environment",
                            contentPreview: envVars.substring(0, 200) + (envVars.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
            }
        }
    }
    return results;
}
/**
 * Scans Azure resource groups for cryptojacking indicators
 */
async function scanResourceGroups(subscriptionId, credentials, options) {
    const { logger } = options;
    const results = [];
    const resourceClient = new arm_resources_1.ResourceManagementClient(credentials, subscriptionId);
    // Get all resource groups
    const resourceGroups = await resourceClient.resourceGroups.list();
    // Process each resource group
    for (const group of resourceGroups) {
        const groupName = group.name || "unknown";
        logger.debug(`Scanning Azure Resource Group: ${groupName}`);
        // Get all resources in the group
        const resources = await resourceClient.resources.listByResourceGroup(groupName);
        // Process each resource
        for (const resource of resources) {
            const resourceName = resource.name || "unknown";
            const resourceType = resource.type || "unknown";
            // Skip resources that are scanned by other functions
            if (resourceType === "Microsoft.Compute/virtualMachines" ||
                resourceType === "Microsoft.Compute/virtualMachineScaleSets" ||
                resourceType === "Microsoft.ContainerInstance/containerGroups") {
                continue;
            }
            logger.debug(`Scanning Azure Resource: ${resourceName} (${resourceType})`);
            // Get resource properties
            try {
                const resourceDetails = await resourceClient.resources.getById(resource.id, "2021-04-01");
                if (resourceDetails.properties) {
                    const propertiesJson = JSON.stringify(resourceDetails.properties);
                    // Scan properties
                    const matches = (0, content_scanner_1.scanContent)(propertiesJson, options);
                    if (matches.length > 0) {
                        const score = calculateScore(matches);
                        results.push({
                            timestamp: new Date().toISOString(),
                            source: `Azure Resource Properties: ${resourceName} (${resourceType})`,
                            itemType: "Resource Properties",
                            contentPreview: propertiesJson.substring(0, 200) + (propertiesJson.length > 200 ? "..." : ""),
                            matches,
                            score,
                            severity: getSeverity(score),
                        });
                    }
                }
            }
            catch (error) {
                logger.debug(`Error getting properties for resource ${resourceName}:`, error);
            }
        }
    }
    return results;
}
/**
 * Extracts resource group name from resource ID
 */
function getResourceGroupFromId(id) {
    const match = id.match(/\/resourceGroups\/([^/]+)/i);
    return match ? match[1] : "unknown";
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
