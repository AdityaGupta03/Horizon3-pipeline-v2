# Use the official CodeQL container as the base image
FROM mcr.microsoft.com/cstsectools/codeql-container:latest

# Fix permissions for setup.py
USER root
RUN chmod +x /usr/local/startup_scripts/setup.py

RUN apt-get update && apt-get install -y \
  git \
  python3 \
  python3-pip \
  openjdk-11-jdk \
  maven \
  gradle \
  && rm -rf /var/lib/apt/lists/*

# SET Java Home
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Make sure the `codeql` binary is in the PATH
ENV PATH="/usr/local/bin:$PATH"
RUN chmod +x $(which codeql)

# codeql setup
WORKDIR /opt/codeql
RUN mkdir -p /opt/codeql/databases

# Our scripts
WORKDIR /app
COPY codeql_wrapper.py .
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Set the default entrypoint
ENTRYPOINT ["/bin/bash"]
