from strands import tool
from pathlib import Path
import boto3
import os

s3_client = boto3.client("s3")


@tool
def s3_upload(
    file_path: str,
    s3_key: str,
) -> dict:
    """
    Upload a local file to an S3 bucket.

    Args:
        file_path: Path to the local file to upload
        s3_key: S3 object key

    Returns:
        Dictionary with upload status and S3 location
    """
    # Validate local file exists
    local_path = Path(file_path).expanduser()
    if not local_path.exists():
        return {
            "status": "error",
            "content": [{"text": f"❌ File not found: {file_path}"}],
        }

    if not local_path.is_file():
        return {
            "status": "error",
            "content": [{"text": f"❌ Path is not a file: {file_path}"}],
        }

    # Upload the file
    return s3_client.upload_file(
        str(local_path), os.environ.get("S3_BUCKET_NAME"), s3_key
    )
