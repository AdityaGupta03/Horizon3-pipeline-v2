# Use an Ubuntu base image
FROM ubuntu:22.04

# Set the maintainer label
LABEL maintainer="adgupta1003@gmail.com"

# Set non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# Update and install tzdata
RUN apt-get update && apt-get install -y tzdata

# Set the timezone (for example, to "America/New_York") non-interactively
RUN ln -fs /usr/share/zoneinfo/America/New_York /etc/localtime \
  && echo "America/New_York" > /etc/timezone

# Install dependencies
RUN apt-get update && apt-get install -y \
  openjdk-11-jdk \
  python3 \
  python3-pip \
  wget \
  unzip \
  git \
  build-essential \
  libqt5widgets5 \
  libqt5gui5 \
  xauth \
  libxtst6 \
  libxi6 \
  cmake

# Download and install Ghidra
WORKDIR /opt
RUN wget https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_11.2_build/ghidra_11.2_PUBLIC_20240926.zip \
  && unzip ghidra_11.2_PUBLIC_20240926.zip \
  && rm ghidra_11.2_PUBLIC_20240926.zip

# Set environment variables to point to Ghidra installation
ENV GHIDRA_HOME=/opt/ghidra_11.2_PUBLIC

# Install BinDiff (via GitHub)
WORKDIR /opt
RUN git clone https://github.com/google/bindiff.git

# Optional: Add Ghidra scripts or BinDiff plugin setup here if needed
# Example: Copy prewritten Python automation scripts or Ghidra scripts

# Copy your Python automation script into the container
COPY binDiff.py /opt/scripts/binDiff.py
COPY requirements.txt /opt/scripts/requirements.txt
RUN pip3 install --no-cache-dir -r /opt/scripts/requirements.txt

# Make a working directory for binaries and results
RUN mkdir -p /opt/binaries
RUN mkdir -p /opt/results

# Entry point for running the automated Ghidra + BinDiff comparison
# This assumes the `diff_automation.py` script automates the loading and diffing process
ENTRYPOINT [ "/bin/bash" ]
# ENTRYPOINT ["python3", "/opt/scripts/binDiff.py https://github.com/AdityaGupta03/FileCompression.git FileCompression AdityaGupta03"]
