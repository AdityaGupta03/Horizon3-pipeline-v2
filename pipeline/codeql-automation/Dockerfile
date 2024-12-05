# Use the official CodeQL container as the base image
FROM mcr.microsoft.com/cstsectools/codeql-container:latest

# Fix permissions for setup.py
USER root
RUN chmod +x /usr/local/startup_scripts/setup.py

# Set up the CodeQL home directory and queries repository
WORKDIR /usr/local/codeql-home
RUN rm -rf codeql && mkdir -p codeql

# Clone the CodeQL queries repository
WORKDIR /usr/local/codeql-home/codeql
RUN git init && \
    git remote add origin https://github.com/github/codeql.git && \
    git fetch --depth 1 origin && \
    git reset --hard FETCH_HEAD

# Make sure the `codeql` binary is in the PATH
ENV PATH="/usr/local/codeql-home:$PATH"

# Precompile the queries for better runtime performance
RUN codeql resolve qlpacks && \
    codeql resolve queries --format=json > /usr/local/codeql-home/available-queries.json

# Copy custom query suites
COPY custom-queries-python.qls /usr/local/codeql-home/codeql/custom-queries-python.qls
COPY custom-queries-java.qls /usr/local/codeql-home/codeql/custom-queries-java.qls
COPY custom-queries-cpp.qls /usr/local/codeql-home/codeql/custom-queries-cpp.qls
COPY custom-queries-javascript.qls /usr/local/codeql-home/codeql/custom-queries-javascript.qls

# Switch back to the default user
USER codeql

# Set the default entrypoint
ENTRYPOINT ["/bin/bash"]
