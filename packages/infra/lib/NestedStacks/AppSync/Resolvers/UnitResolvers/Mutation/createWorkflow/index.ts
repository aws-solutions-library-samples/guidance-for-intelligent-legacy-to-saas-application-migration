import { Context } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

interface IHandler {
  jobId: string;
  agents: { systemPrompt: string }[];
  rowCategories?: Array<{ name: string; description: string }>;
  columnCategories?: Array<{ name: string; description: string }>;
}

export const handler = async (event: IHandler, context: Context) => {
  const { jobId, agents } = event;

  // Read the workflow template
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
        `agent_${index + 1}_response = agent.tool.agent_${
          index + 1
        }(s3_uri=os.environ["S3_URI"])`
    )
    .join("\n        ");

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
    try:
        specialized_agent = Agent(
            system_prompt="""${agent.systemPrompt}""",
            tools=[],  # Add specific tools as needed
            model=model,
            callback_handler=capture_flow_callback("${agentName}")
        )
        
        response = specialized_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in ${agentName}: {str(e)}"`;
    })
    .join("\n");

  templateContent = templateContent.replace(
    "# Place tools here",
    `${agentTools}`
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
