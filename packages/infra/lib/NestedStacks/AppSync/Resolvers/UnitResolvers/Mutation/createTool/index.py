from strands_tools import editor, file_write, load_tool, file_read
from botocore.awsrequest import AWSRequest
from botocore.auth import SigV4Auth
from python_repl import python_repl
from s3_upload import s3_upload
from strands import Agent
import requests
import boto3
import uuid
import json
import os

session = boto3.Session()
credentials = session.get_credentials()
s3_client = boto3.client("s3")

os.environ["BYPASS_TOOL_CONSENT"] = "TRUE"

# Define a tool-building focused system prompt
TOOL_BUILDER_SYSTEM_PROMPT = """You are a specialized AI tool builder agent with expertise in 
creating custom tools for the Strands Agents SDK.

Your core responsibilities:
1. Analyze user requests for new tool functionality
2. Design and implement Python tools using the @tool decorator pattern
3. Create well-documented, robust tools with proper error handling
4. Test tools to ensure they work correctly
5. Load tools into the agent environment for immediate use

When creating tools:
1. Use the @tool decorator from strands import tool
2. Follow proper type hints for parameters and return values
3. Include comprehensive docstrings explaining purpose, parameters, and returns
4. Implement proper error handling with try/except blocks
5. Return results in the standard format: {"status": "success/error", "content": [{"text": "message"}]}
6. Save tools to the tools/ directory for automatic hot-reloading

Tool Creation Process:
1. **Analyze** the user's request to understand the desired functionality
2. **Design** the tool interface (parameters, return type, behavior)
3. **Implement** the tool code with proper structure and error handling
4. **Test** the tool to ensure it works as expected
5. **Document** usage examples and best practices

Best Practices:
- Use descriptive parameter names and types
- Provide default values for optional parameters
- Handle edge cases and errors gracefully
- Include usage examples in docstrings
- Keep tools focused on a single responsibility
- Use existing libraries when appropriate

Example Tool Structure:
```python
from strands import tool
from typing import Optional

@tool
def example_tool(param1: str, param2: int = 42, optional_param: Optional[str] = None) -> dict:
    \"\"\"
    Brief description of what the tool does.
    
    Args:
        param1: Description of first parameter
        param2: Description of second parameter with default
        optional_param: Optional parameter description
    
    Returns:
        Dictionary with status and content
    \"\"\"
    try:
        # Implementation logic here
        result = process_data(param1, param2, optional_param)
        
        return {
            "status": "success",
            "content": [{"text": f"✅ Successfully processed: {result}"}]
        }
    except Exception as e:
        return {
            "status": "error", 
            "content": [{"text": f"❌ Error: {str(e)}"}]
        }
```

Always create tools that are reliable, well-documented, and immediately useful to users.
Always save your tool to the /tmp directory
"""


def create_appsync_streaming_callback(job_id: str):
    def appsync_streaming_callback(**kwargs):
        """Stream text output and tool invocations to stdout.
        Args:
            **kwargs: Callback event data including:
                - reasoningText (Optional[str]): Reasoning text to print if provided.
                - data (str): Text content to stream.
                - complete (bool): Whether this is the final chunk of a response.
                - current_tool_use (dict): Information about the current tool being used.
        """
        event_data = {"jobId": job_id, "eventId": str(uuid.uuid4())}
        print(kwargs)

        message = kwargs.get("message", False)
        force_stop = kwargs.get("force_stop", False)
        init_event_loop = kwargs.get("init_event_loop", False)
        start_event_loop = kwargs.get("start_event_loop", False)
        start = kwargs.get("start", False)
        # reasoningText = kwargs.get("reasoningText", False)
        # current_tool_use = kwargs.get("current_tool_use", {})

        # if reasoningText:
        #     print(reasoningText, end="")
        #     event_data.update(
        #         {
        #             "type": "reasoningText",
        #             "message": reasoningText,
        #         }
        #     )

        if init_event_loop:
            print(init_event_loop)
            event_data.update({"type": "init_event_loop", "message": "init_event_loop"})
        elif start_event_loop:
            print(start_event_loop)
            event_data.update(
                {"type": "start_event_loop", "message": "start_event_loop"}
            )
        elif start:
            print(start)
            event_data.update({"type": "start", "message": "start"})
        elif message:
            print(message)
            event_data.update(
                {
                    "type": "message",
                    "message": message["content"],
                }
            )
        elif force_stop:
            print(kwargs)
            event_data.update(
                {
                    "type": "force_stop",
                    "message": kwargs.get("force_stop_reason", "unknown reason"),
                }
            )
        elif (
            "event" in kwargs
            and kwargs["event"].get("messageStop")
            and kwargs["event"].get("messageStop").get("stopReason") == "end_turn"
        ):
            print(kwargs["event"])
            event_data.update({"type": "end_turn", "message": "end_turn"})

        if "type" in event_data:
            event_data["message"] = json.dumps(event_data["message"])
            # Print the event for debugging
            print(f"Streaming to AppSync: {json.dumps(event_data)}")

            # GraphQL mutation to publish update
            publish_to_appsync(event_data)

    return appsync_streaming_callback


def handler(event, _context):
    try:
        print(event)
        job_id = event["jobId"]
        load_history = event.get("loadHistory", False)
        save_tools = event.get("saveTools", False)

        # Create streaming callback handler
        streaming_callback = create_appsync_streaming_callback(job_id)

        if save_tools:
            upload_s3_agent = Agent(
                system_prompt=f"Your goal is to isolate the tool files create and upload them to s3. You should only be looking at files in the /tmp folder. They can only be uploaded to the s3 prefix s3://{os.environ.get('S3_BUCKET_NAME')}/jobs/{job_id}/code/",
                tools=[file_read, s3_upload],
                callback_handler=streaming_callback,
            )
            response = s3_client.get_object(
                Bucket=os.environ.get("S3_BUCKET_NAME"),
                Key=f"jobs/{job_id}/sessions/session.json",
            )
            sessions_data = json.loads(response["Body"].read().decode("utf-8"))
            upload_s3_agent.messages = sessions_data

            return upload_s3_agent(
                "Upload the tool files to s3. You should only be looking at files you created in the /tmp folder. They can only be uploaded to the s3 prefix s3://{os.environ.get('S3_BUCKET_NAME')}/jobs/{job_id}/code/"
            )

        # Create agent with streaming callback
        tool_builder_agent = Agent(
            system_prompt=TOOL_BUILDER_SYSTEM_PROMPT,
            tools=[editor, file_write, load_tool, python_repl],
            callback_handler=streaming_callback,
        )
        if load_history:
            response = s3_client.get_object(
                Bucket=os.environ.get("S3_BUCKET_NAME"),
                Key=f"jobs/{job_id}/sessions/session.json",
            )
            sessions_data = json.loads(response["Body"].read().decode("utf-8"))
            tool_builder_agent.messages = sessions_data
            tool_builder_agent(event["prompt"])

        else:
            tool_builder_agent(
                f"""
            Create a custom tool based on this request: {event["prompt"]}

            Please:
            1. Analyze the request and design an appropriate tool
            2. Create the tool file in the tools/ directory
            3. Test the tool to ensure it works
            4. Provide usage examples and documentation
            5. Load the tool so it's ready for immediate use

            Always save your tools to the /tmp directory
            """
            )

        return s3_client.put_object(
            Bucket=os.environ["S3_BUCKET_NAME"],
            Key=f"jobs/{job_id}/sessions/session.json",
            Body=json.dumps(tool_builder_agent.messages, indent=2),
        )
    except Exception as err:
        publish_to_appsync(
            {
                "jobId": job_id,
                "eventId": str(uuid.uuid4()),
                "type": "force_stop",
                "message": json.dumps(err),
            }
        )


def publish_to_appsync(event_data):
    mutation = """
    mutation PublishToolCreationUpdate($input: ToolCreationUpdateInput!) {
        publishToolCreationUpdate(input: $input) {
            jobId
            type
            message
            eventId
        }
    }
    """

    payload = {"query": mutation, "variables": {"input": event_data}}

    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    request = AWSRequest(
        method="POST",
        url=os.environ.get("APPSYNC_ENDPOINT"),
        data=json.dumps(payload),
        headers=headers,
    )

    SigV4Auth(credentials, "appsync", session.region_name).add_auth(request)

    response = requests.post(
        url=request.url, headers=dict(request.headers), data=request.body
    )

    response.raise_for_status()

    if "errors" in response.json():
        raise Exception(
            f"AppSync publish failed: {response.status_code} - {response.text}"
        )
    else:
        print(f"Successfully published to AppSync: {response.json()}")
