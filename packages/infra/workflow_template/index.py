from bedrock_agentcore.runtime import BedrockAgentCoreApp
from callbacks import trace, capture_flow_callback
from strands.models import BedrockModel
from tools import s3_ls, s3_download
from agent_crawler import crawl_file
from botocore.config import Config
from strands import Agent, tool
import boto3
import os
import json

os.environ["MODEL_ID"] = "us.anthropic.claude-sonnet-4-20250514-v1:0"

bedrock_client = boto3.client("bedrock-runtime", config=Config(read_timeout=300))
s3_client = boto3.client("s3")
app = BedrockAgentCoreApp()

model = BedrockModel(
    model_id=os.environ["MODEL_ID"],
    streaming=os.environ.get("STREAMING", "false").lower() == "true",
    boto_client_config=Config(read_timeout=300),
)

# Place tools here

agent = Agent(
    callback_handler=capture_flow_callback("Orchestrator"),
    tools=[
        # Agent list here
    ],
    model=model,
)


@app.entrypoint
def invoke(payload):
    """Process user input and return a response"""
    # crawl_file("index.py")

    response = {}

    # Invoke agents here

    print({"Response": response})

    toolConfig = {
        "tools": [
            {
                "toolSpec": {
                    "name": "parse_results",
                    "description": "Captures and structures TeamCenter artifacts with their tiers, types, and comprehensive detailed summaries including all elements",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "teamcenter_artifacts": {
                                    "type": "array",
                                    "description": "List of all TeamCenter artifacts identified in the analysis",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "teamcenter_artifact_name": {
                                                "type": "string",
                                                "description": "The exact TeamCenter artifact name",
                                            },
                                            "tier": {
                                                "type": "string",
                                                "enum": [
                                                    "standard",
                                                    "advanced",
                                                    "premium",
                                                ],
                                                "description": "Required tier (standard/advanced/premium)",
                                            },
                                            "type": {
                                                "type": "string",
                                                "description": "Classification type (configuration/customization/feature)",
                                                "enum": [
                                                    "configuration",
                                                    "customization",
                                                    "feature",
                                                ],
                                            },
                                            "detailed_summary": {
                                                "type": "string",
                                                "description": "Comprehensive explanation including: artifact purpose, scope, tier justification, AND complete breakdown of all supported/required elements with their descriptions, attributes, values, and sub-elements in a hierarchical format. Return response in markdown format with proper headers, bullet points, code blocks, and formatting.",
                                            },
                                        },
                                        "required": [
                                            "teamcenter_artifact_name",
                                            "tier",
                                            "type",
                                            "detailed_summary",
                                        ],
                                    },
                                },
                            },
                            "required": [
                                "teamcenter_artifacts",
                            ],
                        }
                    },
                }
            }
        ],
        "toolChoice": {"tool": {"name": "parse_results"}},
    }

    parsed_results = bedrock_client.converse(
        modelId=os.environ["MODEL_ID"],
        system=[
            {
                "text": """You are an expert in analyzing and parsing results from sub agents to formulate into a structured output.
Based on the summary, extract and structure ALL sub agents use the provided tool.

You MUST use the parse_results tool to structure your response - do not provide a free-form text response."""
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": f"Extract and structure all sub agent responses from this detailed summary: {response}"
                    }
                ],
            }
        ],
        toolConfig=toolConfig,
    )

    print("Saving...")
    s3_client.put_object(
        Bucket=os.environ["S3_BUCKET_NAME"],
        Key=f"jobs/{os.environ['JOB_ID']}/assessment.json",
        Body=json.dumps(
            parsed_results["output"]["message"]["content"][0]["toolUse"]["input"][
                "parse_results"
            ]
        ),
    )

    s3_client.put_object(
        Bucket=os.environ["S3_BUCKET_NAME"],
        Key=f"jobs/{os.environ['JOB_ID']}/flow.json",
        Body=json.dumps(trace),
    )

    return {
        "trace": trace,
    }


if __name__ == "__main__":
    app.run()
