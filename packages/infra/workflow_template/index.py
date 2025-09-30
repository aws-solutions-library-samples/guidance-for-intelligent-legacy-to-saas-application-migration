from bedrock_agentcore.runtime import BedrockAgentCoreApp
from callbacks import trace, capture_flow_callback
from strands.models import BedrockModel
from tools import s3_ls, s3_download
from agent_crawler import crawl_file
from botocore.config import Config
from strands import Agent, tool
import boto3
import os

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

    return {
        "trace": trace,
    }


if __name__ == "__main__":
    app.run()
