import type { Logger } from "winston"
import { exec } from "child_process"
import { promisify } from "util"
import { EC2Client, TerminateInstancesCommand } from "@aws-sdk/client-ec2"
import { Compute } from "@google-cloud/compute"
import { ComputeManagementClient } from "@azure/arm-compute"
import { DefaultAzureCredential } from "@azure/identity"

const execAsync = promisify(exec)

/**
 * Terminates a detected cryptominer
 */
export async function terminateMiner(
  source: string,
  itemType: string,
  resourceId: string,
  logger: Logger,
): Promise<{ success: boolean; message: string }> {
  logger.info(`Attempting to terminate miner: ${source} (${itemType}) - ${resourceId}`)

  try {
    // Handle different resource types
    if (source.includes("AWS EC2 Instance")) {
      return await terminateAWSInstance(resourceId, logger)
    } else if (source.includes("GCP Compute Engine")) {
      return await terminateGCPInstance(resourceId, logger)
    } else if (source.includes("Azure VM")) {
      return await terminateAzureVM(resourceId, logger)
    } else if (itemType === "Process" || itemType === "Service") {
      return await terminateLocalProcess(resourceId, logger)
    } else {
      return {
        success: false,
        message: `Unsupported resource type: ${itemType}`,
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error terminating miner: ${errorMessage}`)
    return {
      success: false,
      message: `Error terminating miner: ${errorMessage}`,
    }
  }
}

/**
 * Terminates an AWS EC2 instance
 */
async function terminateAWSInstance(
  instanceId: string,
  logger: Logger,
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info(`Terminating AWS EC2 instance: ${instanceId}`)

    // Extract the instance ID from the resource ID
    const id = instanceId.split("/").pop() || instanceId

    // Create EC2 client
    const ec2Client = new EC2Client({})

    // Terminate the instance
    const command = new TerminateInstancesCommand({
      InstanceIds: [id],
    })

    const response = await ec2Client.send(command)

    logger.info(`AWS EC2 instance termination initiated: ${JSON.stringify(response)}`)

    return {
      success: true,
      message: `AWS EC2 instance termination initiated for ${id}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error terminating AWS EC2 instance: ${errorMessage}`)
    throw error
  }
}

/**
 * Terminates a GCP Compute Engine instance
 */
async function terminateGCPInstance(
  instanceId: string,
  logger: Logger,
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info(`Terminating GCP Compute Engine instance: ${instanceId}`)

    // Parse the instance ID to extract zone and name
    // Format: projects/PROJECT_ID/zones/ZONE/instances/INSTANCE_NAME
    const parts = instanceId.split("/")
    const projectId = parts[1]
    const zone = parts[3]
    const instanceName = parts[5]

    // Create Compute client
    const compute = new Compute({ projectId })
    const zone_obj = compute.zone(zone)
    const vm = zone_obj.vm(instanceName)

    // Delete the instance
    const [operation] = await vm.delete()

    // Wait for the operation to complete
    await operation.promise()

    logger.info(`GCP Compute Engine instance deleted: ${instanceName}`)

    return {
      success: true,
      message: `GCP Compute Engine instance deleted: ${instanceName}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error terminating GCP Compute Engine instance: ${errorMessage}`)
    throw error
  }
}

/**
 * Terminates an Azure VM
 */
async function terminateAzureVM(resourceId: string, logger: Logger): Promise<{ success: boolean; message: string }> {
  try {
    logger.info(`Terminating Azure VM: ${resourceId}`)

    // Parse the resource ID
    // Format: /subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/virtualMachines/{vmName}
    const parts = resourceId.split("/")
    const subscriptionId = parts[2]
    const resourceGroup = parts[4]
    const vmName = parts[8]

    // Create Compute client
    const credentials = new DefaultAzureCredential()
    const computeClient = new ComputeManagementClient(credentials, subscriptionId)

    // Delete the VM
    const result = await computeClient.virtualMachines.beginDeleteAndWait(resourceGroup, vmName)

    logger.info(`Azure VM deletion completed: ${vmName}`)

    return {
      success: true,
      message: `Azure VM deleted: ${vmName}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error terminating Azure VM: ${errorMessage}`)
    throw error
  }
}

/**
 * Terminates a local process
 */
async function terminateLocalProcess(
  processId: string,
  logger: Logger,
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info(`Terminating local process: ${processId}`)

    // Check if we're dealing with a PID or a service name
    const isPid = !isNaN(Number(processId))

    if (isPid) {
      // Kill process by PID
      if (process.platform === "win32") {
        await execAsync(`taskkill /F /PID ${processId}`)
      } else {
        await execAsync(`kill -9 ${processId}`)
      }

      logger.info(`Process terminated: PID ${processId}`)

      return {
        success: true,
        message: `Process terminated: PID ${processId}`,
      }
    } else {
      // Stop service by name
      if (process.platform === "win32") {
        await execAsync(`sc stop "${processId}" && sc delete "${processId}"`)
      } else {
        await execAsync(`systemctl stop "${processId}" && systemctl disable "${processId}"`)
      }

      logger.info(`Service stopped and disabled: ${processId}`)

      return {
        success: true,
        message: `Service stopped and disabled: ${processId}`,
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error terminating local process: ${errorMessage}`)
    throw error
  }
}

