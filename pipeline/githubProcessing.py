import os
import subprocess
import shutil
import requests
import boto3
import json
import sys
import time
import git
from git import Repo
from urllib.parse import urlparse

AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

s3 = boto3.client('s3', region_name='us-east-1', aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY)

def run_command(command, cwd=None):
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        result.check_returncode()
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e.stderr}")
        raise

def get_recent_commits(repo_path, num_commits=2):
    repo = Repo(repo_path)
    commits = list(repo.iter_commits('main', max_count=num_commits))
    return [commit.hexsha for commit in commits]

def clone_repository(repo_url, dest_dir, access_token):
    try:
        # Parse the URL to get the components
        parsed_url = urlparse(repo_url)

        # Construct the authenticated URL
        auth_url = f"https://{access_token}@{parsed_url.netloc}{parsed_url.path}"

        # Clone the repository
        Repo.clone_from(auth_url, dest_dir)
        print("Repository cloned successfully!")
    except git.GitCommandError as e:
        print(f"Error cloning repository: {e}")
        sys.exit(1)

def detect_and_build_c_project(project_dir):
    # Let's modify the `detect_and_build_c_project` function to search all directories recursively for build files.
    for root, dirs, files in os.walk(project_dir):
        try:
            if "Makefile" in files:
                print(f"Makefile found in {root}! Building...")
                run_command("make", cwd=root)
                return
            elif "CMakeLists.txt" in files:
                print(f"CMakeLists.txt found in {root}! Building...")
                build_dir = os.path.join(root, 'build')
                if not os.path.exists(build_dir):
                    os.makedirs(build_dir)
                run_command("cmake .. && make", cwd=build_dir)
                return
            elif "configure" in files:
                print(f"configure script found in {root}! Building...")
                run_command("./configure && make", cwd=root)
                return
        except Exception as e:
            print(f"Error building project in {root}: {e}")
            sys.exit(1)

    print("No Makefile, CMakeLists.txt, or configure script found in any directory!")

def find_binary_files(project_dir):
    search_paths = [os.path.join(project_dir, "bin"), os.path.join(project_dir, "build"), project_dir]
    binaries = []

    for dir in search_paths:
        if os.path.exists(dir):
            for file in os.listdir(dir):
                file_path = os.path.join(dir, file)
                if os.path.isfile(file_path) and os.access(file_path, os.X_OK):
                    file_type = subprocess.run(['file', '--mime-type', '-b', file_path], stdout=subprocess.PIPE, text=True).stdout.strip()
                    if file_type.startswith("application/"):
                        binaries.append(os.path.abspath(file_path))

    return binaries

def start_static_analysis(filename):
  print("Running static analysis")
  bucket_name = "cs407gitmetadata"
  response = s3.get_object(Bucket=bucket_name, Key=filename)
  object_content = response['Body'].read().decode('utf-8')
  print(object_content)
  print("Starting")

def clone_build_and_find_binary(repo_url, repo_name, owner, github_token):
  project_dir = './cloned_project'

  if os.path.exists(project_dir):
    shutil.rmtree(project_dir)
    print("Removed cloned project directory.")

  print(f"Cloning repository: {repo_url}")
  clone_repository(repo_url, project_dir, github_token)
  commits = get_recent_commits(project_dir, num_commits=2)

  print(f"Building project...")
  detect_and_build_c_project(project_dir)
  print("Searching for binary files...")
  binaries = find_binary_files(project_dir)
  if binaries:
    print("Binaries found:")
    for binary in binaries:
      s3 = boto3.client('s3', region_name='us-east-1', aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY)
      s3.upload_file(binary, 'cs407gitmetadata', os.path.basename(binary) + '_' + commits[0][:7])
  else:
    print("No binary files found.")

  repo = Repo(project_dir)
  repo.git.checkout(commits[1])
  detect_and_build_c_project(project_dir)
  print("Searching for binary files...")
  binaries = find_binary_files(project_dir)
  if binaries:
    print("Binaries found:")
    for binary in binaries:
      s3.upload_file(binary, 'cs407gitmetadata', os.path.basename(binary) + "_" + commits[1][:7])
  else:
    print("No binary files found.")

  #logic for retrieving metadata
  api_url = f'https://api.github.com/repos/{owner}/{repo_name}'
  headers = {'Authorization': f'Bearer {github_token}', 'Accept': 'application/vnd.github+json'}
  parameters = {'owner': f'{owner}', 'repo': f'{repo_name}'}

  if not github_token:
    response = requests.get(api_url.format(**parameters))
  else:
    response = requests.get(api_url.format(**parameters), headers=headers)

  timestamp = int(time.time())
  filename = f"{repo_name}_meta_{timestamp}.json"
  if response.status_code == 200:
    metadata = response.json()
    bucket_name = "cs407gitmetadata"
    s3.put_object(Body=json.dumps(metadata), Bucket=bucket_name, Key=filename)
  else:
      print(f"Error: {response.status_code} - {response.text}")

  if os.path.exists(project_dir):
    shutil.rmtree(project_dir)
    print("Removed cloned project directory.")

  print("Process finished!")
  start_static_analysis(filename)


def main():
    if len(sys.argv) != 5:
        print("Usage: python githubProcessing.py <repo_url> <repo_name> <owner> <github_token>")
        sys.exit(1)

    repo_url = sys.argv[1]
    repo_name = sys.argv[2]
    owner = sys.argv[3]
    github_token = sys.argv[4]

    clone_build_and_find_binary(repo_url, repo_name, owner, github_token)


if __name__ == "__main__":
    main()
