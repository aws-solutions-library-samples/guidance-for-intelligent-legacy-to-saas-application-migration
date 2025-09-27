from pathlib import Path
import importlib.util
import boto3
import json
import ast
import os

s3_client = boto3.client("s3")


class FileAnalyzer(ast.NodeVisitor):
    def __init__(self, tool_name, file_path):
        self.tool_name = tool_name
        self.file_path = file_path
        self.strands_agent_import_aliases = []
        self.import_aliases = {}
        self.agent_instances = []

    def visit_ImportFrom(self, node):
        for alias in node.names:
            alias_name = alias.asname if alias.asname else alias.name
            if alias.name == "Agent" and node.module == "strands":
                self.strands_agent_import_aliases.append(alias_name)
            else:
                self.import_aliases[alias_name] = node.module
        self.generic_visit(node)

    def visit_Call(self, node):
        """Find Agent instantiations (calls to Agent constructor)"""
        # Check if this is a call to Agent
        if isinstance(node.func, ast.Name):
            # Direct call like Agent()
            if node.func.id in self.strands_agent_import_aliases:
                kwargs = {}

                for keyword in node.keywords:
                    if keyword.arg == "tools":
                        tools = []
                        for element in keyword.value.elts:
                            tool_file_path = f"{str(Path(self.file_path).parent)}/{'/'.join(self.import_aliases[element.id].split('.'))}.py"
                            tools.append(analyze_file(element.id, tool_file_path))
                        kwargs["tools"] = tools
                    elif keyword.arg == "callback_handler":
                        # Check if the callback handler is a function
                        if isinstance(keyword.value.func, ast.Name):
                            # We are going to assume the first argument is the name
                            kwargs["agent_name"] = keyword.value.args[0].value
                    else:
                        kwargs[keyword.arg] = ast.unparse(keyword.value)

                self.agent_instances.append(kwargs)
        self.generic_visit(node)


def analyze_file(tool_name, tool_file_path: str):
    try:
        with open(tool_file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        search = importlib.util.find_spec(
            f"{tool_file_path.split('/').pop()[:-3]}.{tool_name}"
        )
        tool_file_path = search.origin
        with open(search.origin, "r", encoding="utf-8") as f:
            content = f.read()

    tree = ast.parse(content, filename=tool_file_path)
    analyzer = FileAnalyzer(tool_name, tool_file_path)
    analyzer.visit(tree)
    return analyzer.__dict__


def crawl_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    tree = ast.parse(content, filename=file_path)

    orchestrator = FileAnalyzer("run_assessment", file_path)
    orchestrator.visit(tree)

    # Upload the content to S3
    s3_client.put_object(
        Bucket=os.environ["S3_BUCKET_NAME"],
        Key=f"jobs/{os.environ['JOB_ID']}/tree.json",
        Body=json.dumps(orchestrator.__dict__),
    )
