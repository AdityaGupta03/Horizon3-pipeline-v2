# Use an Ubuntu base image - note this requires amd64 for bindiff and ghidra
# To ensure amd64 when building on arm64 use docker buildx build with --platform linux/amd64 flag
FROM ubuntu:22.04

# Set the maintainer label
LABEL maintainer="adgupta1003@gmail.com"

# Set non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  tzdata \
  openjdk-17-jdk \
  python3 \
  python3-pip \
  wget \
  unzip \
  git \
  libqt5widgets5 \
  libqt5gui5 \
  xauth \
  libxtst6 \
  libxi6 \
  libssl-dev \
  zlib1g-dev \
  libbz2-dev \
  libreadline-dev \
  libsqlite3-dev \
  libncursesw5-dev \
  xz-utils \
  tk-dev \
  libffi-dev \
  liblzma-dev \
  graphviz \
  && pip3 install awscli \
  && ln -fs /usr/share/zoneinfo/America/New_York /etc/localtime \
  && echo "America/New_York" > /etc/timezone

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Download and install Ghidra - if wget fails (timesout) simply retry once or twice
WORKDIR /opt
RUN wget https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_11.0.3_build/ghidra_11.0.3_PUBLIC_20240410.zip \
  && unzip ghidra_11.0.3_PUBLIC_20240410.zip \
  && rm ghidra_11.0.3_PUBLIC_20240410.zip

# Set environment variables to point to Ghidra installation
ENV GHIDRA_HOME=/opt/ghidra_11.0.3_PUBLIC
ENV PATH="${GHIDRA_HOME}/support:${PATH}"

WORKDIR /root/.ghidra/.ghidra_11.0.3_PUBLIC/Extensions
RUN wget https://github.com/google/binexport/releases/download/v12-20240417-ghidra_11.0.3/BinExport_Ghidra-Java.zip -O binexport.zip && \
  unzip binexport.zip && \
  unzip ghidra_11.0.3_PUBLIC_20240417_BinExport.zip && \
  rm binexport.zip && \
  rm ghidra_11.0.3_PUBLIC_20240417_BinExport.zip

# Install BinDiff (via Releases)
WORKDIR /opt
RUN wget https://github.com/google/bindiff/releases/download/v8/bindiff_8_amd64.deb
RUN wget https://github.com/google/bindiff/releases/download/v8/bindiff_8_amd64.deb.asc
RUN mkdir -p /opt/bindiff/libexec
RUN touch /opt/bindiff/libexec/bindiff_config_setup
RUN chmod +x /opt/bindiff/libexec/bindiff_config_setup
RUN apt install -y ./bindiff_8_amd64.deb
RUN apt --fix-broken install
RUN sed -i 's/^\(.*systemctl.*\)$/#\1/g' /var/lib/dpkg/info/bindiff.postinst

# Copy your Python automation script into the container
WORKDIR /opt
COPY export_binexport.py /opt/scripts/export_binexport.py
COPY exec_bindiff.py /opt/exec_bindiff.py
COPY BinExport2_pb2.py /opt/BinExport2_pb2.py
COPY requirements.txt /opt/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt
RUN chmod +x /opt/exec_bindiff.py

# Make a working directory for binaries and results
RUN mkdir -p /opt/binaries /opt/results

# Entry point for running the automated Ghidra + BinDiff comparison
ENTRYPOINT [ "python3", "/opt/exec_bindiff.py" ]
