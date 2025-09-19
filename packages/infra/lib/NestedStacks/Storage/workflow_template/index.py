from bedrock_agentcore.runtime import BedrockAgentCoreApp
from stylesheets.stylesheets_agent import stylesheets_agent
from callbacks import trace, capture_flow_callback
from bmide.bmide_agent import bmide_agent
from strands.models import BedrockModel
from agent_crawler import crawl_file
from botocore.config import Config
from strands import Agent
import boto3
import os

bedrock_client = boto3.client("bedrock-runtime", config=Config(read_timeout=300))
s3_client = boto3.client("s3")
app = BedrockAgentCoreApp()

model = BedrockModel(
    model_id=os.environ["MODEL_ID"],
    streaming=os.environ.get("STREAMING", "false").lower() == "true",
    cache_prompt="default",
    boto_client_config=Config(read_timeout=300),
)
agent = Agent(
    callback_handler=capture_flow_callback("Orchestrator"),
    tools=[framework_assessment_agent, dependencies_agent],
    model=model,
)


@app.entrypoint
def invoke(payload):
    """Process user input and return a response"""
    crawl_file("index.py")

    framework_assessment_response = agent.tool.stylesheets_agent(
        s3_uri=os.environ["S3_URI"]
    )

    user_message = payload.get("prompt", "Hello")
    result = agent(user_message)
    return {"result": result.message}


if __name__ == "__main__":
    app.run()
