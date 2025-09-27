# Use uv's ARM64 Python base image
FROM --platform=linux/arm64 public.ecr.aws/docker/library/python:3.13-slim-bookworm

# Accept build arguments
ARG AWS_DEFAULT_REGION
ENV AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}

# Copy entire project (respecting .dockerignore)
COPY . .

# Install from requirements file
RUN pip install -r requirements.txt

CMD ["opentelemetry-instrument", "python", "index.py"]