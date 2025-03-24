import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeLaunchTemplatesCommand,
  GetLaunchTemplateDataCommand,
} from "@aws-sdk/client-ec2"
import { LambdaClient, ListFunctionsCommand, GetFunctionCommand } from "@aws-sdk/client-lambda"
import { CloudFormationClient, ListStacksCommand, GetTemplateCommand } from "@aws-sdk/client-cloudformation"
import { ECSClient, ListTaskDefinitionsCommand, DescribeTaskDefinitionCommand } from "@aws-sdk/client-ecs"
import { SSMClient, ListDocumentsCommand, GetDocumentCommand } from "@aws-sdk/client-ssm"

import type { ScanOptions, ScanResult, PatternMatch } from "../types"
import { scanContent } from "../utils/content-scanner"

/**
 * Scans AWS resources for cryptojacking indicators
 */
export async function scanAWS(options: ScanOptions): Promise<ScanResult[]> {
  const { logger, awsRegions = [], awsProfile } = options
  const results: ScanResult[] = []

  // If no regions specified, use us-east-1 as default
  const regions = awsRegions.length > 0 ? awsRegions : ["us-east-1"]

  logger.info(`Scanning AWS regions: ${regions.join(", ")}`)

  // Scan each region
  for (const region of regions) {
    logger.info(`Scanning region: ${region}`)

    // Common client config
    const clientConfig = {
      region,
      ...(awsProfile ? { credentials: { profile: awsProfile } } : {}),
    }

    // Scan EC2 instances
    try {
      const ec2Results = await scanEC2Instances(clientConfig, options)
      results.push(...ec2Results)
      logger.info(`Found ${ec2Results.length} potential issues in EC2 instances`)
    } catch (error) {
      logger.error(`Error scanning EC2 instances in region ${region}:`, error)
    }

    // Scan Lambda functions
    try {
      const lambdaResults = await scanLambdaFunctions(clientConfig, options)
      results.push(...lambdaResults)
      logger.info(`Found ${lambdaResults.length} potential issues in Lambda functions`)
    } catch (error) {
      logger.error(`Error scanning Lambda functions in region ${region}:`, error)
    }

    // Scan CloudFormation stacks
    try {
      const cfnResults = await scanCloudFormationStacks(clientConfig, options)
      results.push(...cfnResults)
      logger.info(`Found ${cfnResults.length} potential issues in CloudFormation stacks`)
    } catch (error) {
      logger.error(`Error scanning CloudFormation stacks in region ${region}:`, error)
    }

    // Scan ECS task definitions
    try {
      const ecsResults = await scanECSTasks(clientConfig, options)
      results.push(...ecsResults)
      logger.info(`Found ${ecsResults.length} potential issues in ECS task definitions`)
    } catch (error) {
      logger.error(`Error scanning ECS task definitions in region ${region}:`, error)
    }

    // Scan SSM documents
    try {
      const ssmResults = await scanSSMDocuments(clientConfig, options)
      results.push(...ssmResults)
      logger.info(`Found ${ssmResults.length} potential issues in SSM documents`)
    } catch (error) {
      logger.error(`Error scanning SSM documents in region ${region}:`, error)
    }
  }

  logger.info(`AWS scan complete. Found ${results.length} potential issues.`)

  return results
}

/**
 * Scans EC2 instances for cryptojacking indicators
 */
async function scanEC2Instances(clientConfig: any, options: ScanOptions): Promise<ScanResult[]> {
  const { logger } = options
  const results: ScanResult[] = []

  const ec2Client = new EC2Client(clientConfig)

  // Get all EC2 instances
  const listCommand = new DescribeInstancesCommand({})
  const response = await ec2Client.send(listCommand)

  if (!response.Reservations) {
    return results
  }

  // Process each instance
  for (const reservation of response.Reservations) {
    if (!reservation.Instances) {
      continue
    }

    for (const instance of reservation.Instances) {
      const instanceId = instance.InstanceId
      logger.debug(`Scanning EC2 instance: ${instanceId}`)

      // Check UserData
      if (instance.UserData) {
        let userData = instance.UserData.Value || ""

        // If base64 encoded, decode it
        if (options.base64Decode && instance.UserData.Encoding === "base64") {
          try {
            userData = Buffer.from(userData, "base64").toString("utf-8")
          } catch (error) {
            logger.debug(`Error decoding UserData for instance ${instanceId}:`, error)
          }
        }

        // Scan UserData content
        const matches = scanContent(userData, options)

        if (matches.length > 0) {
          const score = calculateScore(matches)
          results.push({
            timestamp: new Date().toISOString(),
            source: `AWS EC2 Instance UserData: ${instanceId}`,
            itemType: "EC2 UserData",
            contentPreview: userData.substring(0, 200) + (userData.length > 200 ? "..." : ""),
            matches,
            score,
            severity: getSeverity(score),
          })
        }
      }

      // Check tags
      if (instance.Tags && instance.Tags.length > 0) {
        const tagsContent = instance.Tags.map((tag) => `${tag.Key}=${tag.Value}`).join("\n")

        // Scan tags content
        const matches = scanContent(tagsContent, options)

        if (matches.length > 0) {
          const score = calculateScore(matches)
          results.push({
            timestamp: new Date().toISOString(),
            source: `AWS EC2 Instance Tags: ${instanceId}`,
            itemType: "EC2 Tags",
            contentPreview: tagsContent.substring(0, 200) + (tagsContent.length > 200 ? "..." : ""),
            matches,
            score,
            severity: getSeverity(score),
          })
        }
      }
    }
  }

  // Scan launch templates
  try {
    const templatesCommand = new DescribeLaunchTemplatesCommand({})
    const templatesResponse = await ec2Client.send(templatesCommand)

    if (templatesResponse.LaunchTemplates) {
      for (const template of templatesResponse.LaunchTemplates) {
        const templateId = template.LaunchTemplateId
        const templateName = template.LaunchTemplateName

        if (!templateId) continue

        logger.debug(`Scanning EC2 launch template: ${templateName} (${templateId})`)

        const dataCommand = new GetLaunchTemplateDataCommand({
          LaunchTemplateId: templateId,
          Version: "$Latest",
        })

        const dataResponse = await ec2Client.send(dataCommand)

        if (dataResponse.LaunchTemplateData) {
          // Convert template data to string for scanning
          const templateData = JSON.stringify(dataResponse.LaunchTemplateData)

          // Scan template data
          const matches = scanContent(templateData, options)

          if (matches.length > 0) {
            const score = calculateScore(matches)
            results.push({
              timestamp: new Date().toISOString(),
              source: `AWS EC2 Launch Template: ${templateName} (${templateId})`,
              itemType: "EC2 Launch Template",
              contentPreview: templateData.substring(0, 200) + (templateData.length > 200 ? "..." : ""),
              matches,
              score,
              severity: getSeverity(score),
            })
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error scanning EC2 launch templates:", error)
  }

  return results
}

/**
 * Scans Lambda functions for cryptojacking indicators
 */
async function scanLambdaFunctions(clientConfig: any, options: ScanOptions): Promise<ScanResult[]> {
  const { logger } = options
  const results: ScanResult[] = []

  const lambdaClient = new LambdaClient(clientConfig)

  // Get all Lambda functions
  const listCommand = new ListFunctionsCommand({})
  const response = await lambdaClient.send(listCommand)

  if (!response.Functions) {
    return results
  }

  // Process each function
  for (const func of response.Functions) {
    const functionName = func.FunctionName
    const functionArn = func.FunctionArn

    if (!functionName || !functionArn) {
      continue
    }

    logger.debug(`Scanning Lambda function: ${functionName}`)

    // Get function details
    const getCommand = new GetFunctionCommand({
      FunctionName: functionName,
    })

    const funcDetails = await lambdaClient.send(getCommand)

    // Check environment variables
    if (funcDetails.Configuration?.Environment?.Variables) {
      const envVars = JSON.stringify(funcDetails.Configuration.Environment.Variables)

      // Scan environment variables
      const matches = scanContent(envVars, options)

      if (matches.length > 0) {
        const score = calculateScore(matches)
        results.push({
          timestamp: new Date().toISOString(),
          source: `AWS Lambda Environment Variables: ${functionName}`,
          itemType: "Lambda Environment",
          contentPreview: envVars.substring(0, 200) + (envVars.length > 200 ? "..." : ""),
          matches,
          score,
          severity: getSeverity(score),
        })
      }
    }

    // Check function code URL if available
    if (funcDetails.Code?.Location) {
      logger.debug(
        `Lambda function ${functionName} has downloadable code, but downloading and scanning code is not implemented yet.`,
      )
      // Note: Downloading and scanning Lambda function code would require additional implementation
    }
  }

  return results
}

/**
 * Scans CloudFormation stacks for cryptojacking indicators
 */
async function scanCloudFormationStacks(clientConfig: any, options: ScanOptions): Promise<ScanResult[]> {
  const { logger } = options
  const results: ScanResult[] = []

  const cfnClient = new CloudFormationClient(clientConfig)

  // Get all CloudFormation stacks
  const listCommand = new ListStacksCommand({})
  const response = await cfnClient.send(listCommand)

  if (!response.StackSummaries) {
    return results
  }

  // Process each stack
  for (const stack of response.StackSummaries) {
    const stackName = stack.StackName

    if (!stackName) {
      continue
    }

    // Skip deleted stacks
    if (stack.StackStatus?.includes("DELETE_COMPLETE")) {
      continue
    }

    logger.debug(`Scanning CloudFormation stack: ${stackName}`)

    // Get stack template
    const getCommand = new GetTemplateCommand({
      StackName: stackName,
    })

    try {
      const templateResponse = await cfnClient.send(getCommand)

      if (templateResponse.TemplateBody) {
        // Scan template body
        const matches = scanContent(templateResponse.TemplateBody, options)

        if (matches.length > 0) {
          const score = calculateScore(matches)
          results.push({
            timestamp: new Date().toISOString(),
            source: `AWS CloudFormation Stack: ${stackName}`,
            itemType: "CloudFormation Template",
            contentPreview:
              templateResponse.TemplateBody.substring(0, 200) +
              (templateResponse.TemplateBody.length > 200 ? "..." : ""),
            matches,
            score,
            severity: getSeverity(score),
          })
        }
      }
    } catch (error) {
      logger.error(`Error getting template for stack ${stackName}:`, error)
    }
  }

  return results
}

/**
 * Scans ECS task definitions for cryptojacking indicators
 */
async function scanECSTasks(clientConfig: any, options: ScanOptions): Promise<ScanResult[]> {
  const { logger } = options
  const results: ScanResult[] = []

  const ecsClient = new ECSClient(clientConfig)

  // Get all task definitions
  const listCommand = new ListTaskDefinitionsCommand({})
  const response = await ecsClient.send(listCommand)

  if (!response.taskDefinitionArns) {
    return results
  }

  // Process each task definition
  for (const taskDefArn of response.taskDefinitionArns) {
    logger.debug(`Scanning ECS task definition: ${taskDefArn}`)

    // Get task definition details
    const getCommand = new DescribeTaskDefinitionCommand({
      taskDefinition: taskDefArn,
    })

    try {
      const taskDefResponse = await ecsClient.send(getCommand)

      if (taskDefResponse.taskDefinition) {
        // Convert task definition to string for scanning
        const taskDefJson = JSON.stringify(taskDefResponse.taskDefinition)

        // Scan task definition
        const matches = scanContent(taskDefJson, options)

        if (matches.length > 0) {
          const score = calculateScore(matches)
          results.push({
            timestamp: new Date().toISOString(),
            source: `AWS ECS Task Definition: ${taskDefArn}`,
            itemType: "ECS Task Definition",
            contentPreview: taskDefJson.substring(0, 200) + (taskDefJson.length > 200 ? "..." : ""),
            matches,
            score,
            severity: getSeverity(score),
          })
        }
      }
    } catch (error) {
      logger.error(`Error getting task definition ${taskDefArn}:`, error)
    }
  }

  return results
}

/**
 * Scans SSM documents for cryptojacking indicators
 */
async function scanSSMDocuments(clientConfig: any, options: ScanOptions): Promise<ScanResult[]> {
  const { logger } = options
  const results: ScanResult[] = []

  const ssmClient = new SSMClient(clientConfig)

  // Get all SSM documents
  const listCommand = new ListDocumentsCommand({
    DocumentFilterList: [
      {
        key: "Owner",
        value: "Self",
      },
    ],
  })

  const response = await ssmClient.send(listCommand)

  if (!response.DocumentIdentifiers) {
    return results
  }

  // Process each document
  for (const doc of response.DocumentIdentifiers) {
    const docName = doc.Name

    if (!docName) {
      continue
    }

    logger.debug(`Scanning SSM document: ${docName}`)

    // Get document content
    const getCommand = new GetDocumentCommand({
      Name: docName,
    })

    try {
      const docResponse = await ssmClient.send(getCommand)

      if (docResponse.Content) {
        // Scan document content
        const matches = scanContent(docResponse.Content, options)

        if (matches.length > 0) {
          const score = calculateScore(matches)
          results.push({
            timestamp: new Date().toISOString(),
            source: `AWS SSM Document: ${docName}`,
            itemType: "SSM Document",
            contentPreview: docResponse.Content.substring(0, 200) + (docResponse.Content.length > 200 ? "..." : ""),
            matches,
            score,
            severity: getSeverity(score),
          })
        }
      }
    } catch (error) {
      logger.error(`Error getting SSM document ${docName}:`, error)
    }
  }

  return results
}

/**
 * Calculates the score based on matches
 */
function calculateScore(matches: PatternMatch[]): number {
  return matches.reduce((total, match) => total + match.weight, 0)
}

/**
 * Determines severity based on score
 */
function getSeverity(score: number): "HIGH" | "MEDIUM" | "LOW" | "CLEAN" {
  if (score >= 15) {
    return "HIGH"
  } else if (score >= 8) {
    return "MEDIUM"
  } else if (score > 0) {
    return "LOW"
  } else {
    return "CLEAN"
  }
}

