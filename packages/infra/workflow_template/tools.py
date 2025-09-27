from strands import tool
import boto3

s3_client = boto3.client("s3")


@tool
def s3_ls(bucket: str, prefix: str) -> dict:
    """
    List all object within an S3 path of a specific file type.

    This function uses the AWS SDK for Python (Boto3) to list objects stored in an
    S3 bucket. The path_prefix should be in the format '/prefix/another_prefix/'.

    Parameters:
    -----------
    bucket : str
        The S3 bucket to scan.

    path_prefix : str
        The S3 path in the format 'prefix/another_prefix/'.

    Returns:
    --------
    dict
        A dict of objects and prefixes. Objects is a list of tuples of s3 objects, and their size.
        Prefixes is a list of subdirectory prefixes of the directory scanned.
    """
    objects = []
    prefixes = []
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix, Delimiter="/")
    if "Contents" in response:
        objects.extend(
            [
                (an_object["Key"], an_object["Size"])
                for an_object in response["Contents"]
            ]
        )
    if "CommonPrefixes" in response:
        prefixes.extend([i["Prefix"] for i in response["CommonPrefixes"]])
    return {"objects": objects, "prefixes": prefixes}


@tool
def s3_download(bucket, object_name, local_file_name):
    s3_client.download_file(bucket, object_name, local_file_name)
