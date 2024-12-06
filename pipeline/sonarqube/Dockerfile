# Use the Sonar Scanner CLI image as the base image
FROM sonarsource/sonar-scanner-cli

USER root

# Install git (if not included in the base image)
RUN yum install -y git python3 python3-pip postgresql15

# # Clone the git repository
WORKDIR /usr

COPY sonar_wrapper.py .
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Run the Sonar Scanner (you can adjust parameters as needed)
ENTRYPOINT ["python3", "sonar_wrapper.py"]
