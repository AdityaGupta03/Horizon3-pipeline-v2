#!/bin/bash

# Exit on any error
set -e

# Function to display usage
usage() {
  echo "Usage: $0 -r <github_repo_url> -l <language> [-t <personal_access_token>]"
  echo "  -r  GitHub repository URL (required)"
  echo "  -l  Programming language (required: python, java, cpp, javascript)"
  echo "  -t  Personal access token (optional; required for private repositories)"
  exit 1
}

# Parse arguments
while getopts "r:l:t:" opt; do
  case ${opt} in
    r) GITHUB_REPO_URL=${OPTARG} ;;
    l) LANGUAGE=${OPTARG} ;;
    t) PERSONAL_ACCESS_TOKEN=${OPTARG} ;;
    *) usage ;;
  esac
done

# Validate required arguments
if [ -z "$GITHUB_REPO_URL" ] || [ -z "$LANGUAGE" ]; then
  echo "Error: Both GitHub repository URL and language are required."
  usage
fi

# Select the appropriate query file based on language
case $LANGUAGE in
  python) QUERY_FILE="custom-queries-python.qls" ;;
  java) QUERY_FILE="custom-queries-java.qls" ;;
  cpp) QUERY_FILE="custom-queries-cpp.qls" ;;
  javascript) QUERY_FILE="custom-queries-javascript.qls" ;;
  *)
    echo "Error: Unsupported language. Supported languages are: python, java, cpp, javascript."
    exit 1
    ;;
esac

# Prepare directories
WORK_DIR=$(pwd)/codeql_analysis
SRC_DIR="$WORK_DIR/src"
RESULTS_DIR="$WORK_DIR/results"

# Handle existing source directory
if [ -d "$SRC_DIR" ]; then
  echo "Source directory already exists. Cleaning up..."
  rm -rf "$SRC_DIR"
fi

# Clone the repository
echo "Cloning repository..."
if [ -n "$PERSONAL_ACCESS_TOKEN" ]; then
  AUTH_URL=$(echo "$GITHUB_REPO_URL" | sed "s|https://|https://${PERSONAL_ACCESS_TOKEN}@|")
  git clone "$AUTH_URL" "$SRC_DIR"
else
  git clone "$GITHUB_REPO_URL" "$SRC_DIR"
fi

# Build custom Docker image
echo "Building the custom CodeQL Docker image..."
docker build -t custom-codeql .

# Run the analysis entirely in Docker
echo "Running analysis inside Docker container..."
docker run --rm --name custom-codeql-container \
  -v "$SRC_DIR:/opt/src" \
  -v "$RESULTS_DIR:/opt/results" \
  custom-codeql \
  bash -c "codeql database create --overwrite --language=$LANGUAGE /opt/results/source_db -s /opt/src && \
  codeql database analyze --format=sarifv2 --output=/opt/results/issues.sarif /opt/results/source_db /opt/codeql-repo/$QUERY_FILE"

# Check for results
if [ -f "$RESULTS_DIR/issues.sarif" ]; then
  echo "Analysis complete. Results are saved in $RESULTS_DIR/issues.sarif"
else
  echo "Error: Analysis failed or no results were generated."
  exit 1
fi
