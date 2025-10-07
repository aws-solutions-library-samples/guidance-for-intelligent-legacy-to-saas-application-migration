import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { Context } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

const ddbClient = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(ddbClient);

const uploadDirectoryToS3 = async (localDirPath: string, s3Prefix: string) => {
  const files = fs.readdirSync(localDirPath, { withFileTypes: true });

  for (const file of files) {
    const localFilePath = path.join(localDirPath, file.name);
    const s3Key = path.join(s3Prefix, file.name).replace(/\\/g, "/"); // Normalize path for S3

    if (file.isDirectory()) {
      // Recursively upload subdirectories
      await uploadDirectoryToS3(localFilePath, s3Key);
    } else {
      // Upload individual files
      const fileContent = fs.readFileSync(localFilePath);

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileContent,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      console.log(
        `Successfully uploaded ${localFilePath} to s3://${process.env.S3_BUCKET_NAME}/${s3Key}`
      );
    }
  }
};

interface IHandler {
  jobId: string;
  agents: { systemPrompt: string }[];
  rowCategories?: Array<{ name: string; description: string }>;
  columnCategories?: Array<{ name: string; description: string }>;
}

export const handler = async (event: IHandler, context: Context) => {
  const { jobId, agents, rowCategories, columnCategories } = event;

  await ddbDocClient.update({
    TableName: process.env.tableName,
    Key: { jobId },
    UpdateExpression: "SET #C = :c, #R = :r",
    ExpressionAttributeNames: {
      "#C": "column",
      "#R": "row",
    },
    ExpressionAttributeValues: {
      ":c": {
        L: columnCategories?.map(({ name, description }) => {
          return {
            SS: [name, description],
          };
        }),
      },
      ":r": {
        L: rowCategories?.map(({ name, description }) => {
          return {
            SS: [name, description],
          };
        }),
      },
    },
  });

  await uploadDirectoryToS3(
    path.join(__dirname, "workflow_template"),
    `jobs/${jobId}/code`
  );

  const templatePath = path.join(__dirname, "workflow_template", "index.py");
  let templateContent = fs.readFileSync(templatePath, "utf8");

  const agentToolReferences = agents
    .map((_, index) => `agent_${index + 1}`)
    .join(",\n        ");

  templateContent = templateContent.replace(
    "# Agent list here",
    `${agentToolReferences}`
  );

  const agentInvokeReferences = agents
    .map(
      (_, index) =>
        `response['agent_${index + 1}_response'] = agent.tool.agent_${
          index + 1
        }(query=f'S3 URI is: {payload["s3Uri"]}')`
    )
    .join("\n    ");

  templateContent = templateContent.replace(
    "# Invoke agents here",
    `${agentInvokeReferences}`
  );

  const agentTools = agents
    .map((agent, index) => {
      const agentName = `agent_${index + 1}`;
      return `
@tool
def ${agentName}(query: str) -> str:
    """
    Specialized agent for handling specific queries.
    
    Args:
        query: A query requiring specialized processing
        
    Returns:
        A processed response from the specialized agent
    """

    specialized_agent = Agent(
        system_prompt="""${agent.systemPrompt}""",
        tools=[s3_ls, s3_download, retrieve, file_read],  # Add specific tools as needed
        model=model,
        callback_handler=capture_flow_callback("${agentName}")
    )
    
    response = specialized_agent(query)
    return str(response)`;
    })
    .join("\n");

  templateContent = templateContent.replace(
    "# Place tools here",
    `${agentTools}`
  );

  const columnHeaders = columnCategories
    ?.map(({ name }) => {
      return `"${name}"`;
    })
    .join(", ");

  const columnDesc = columnCategories?.reduce(
    (accumulator, { description }, currentIndex) =>
      accumulator + (currentIndex + 1) + " - " + description + "\n",
    "Here is a description of each column:\n"
  );

  templateContent = templateContent.replace(
    "# Column headers here",
    `${columnHeaders}`
  );
  templateContent = templateContent.replace(
    "# Column descriptions here",
    `${columnDesc}`
  );

  const rowHeaders = rowCategories
    ?.map(({ name }) => {
      return `"${name}"`;
    })
    .join(", ");
  const rowDesc = rowCategories?.reduce(
    (accumulator, { description }, currentIndex) =>
      accumulator + (currentIndex + 1) + " - " + description + "\n",
    "Here is a description of each row:\n"
  );

  templateContent = templateContent.replace(
    "# Row headers here",
    `${rowHeaders}`
  );
  templateContent = templateContent.replace(
    "# Row descriptions here",
    `${rowDesc}`
  );

  // Write the updated template back
  await s3Client.send(
    new PutObjectCommand({
      Body: templateContent,
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `jobs/${jobId}/code/index.py`,
    })
  );
};
