# Use an official Python runtime as a parent image
FROM python:3.11

# Set the working directory in the container
WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y \
  git \
  cmake \
  make \
  && apt-get clean


# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY githubProcessing.py .

# Run the script when the container launches
ENTRYPOINT ["python", "githubProcessing.py"]
