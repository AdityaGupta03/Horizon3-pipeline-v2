import os
import subprocess
import shutil
import requests
import boto3
import json

def run_command(command, cwd=None):
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        result.check_returncode()
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e.stderr}")
        raise

def clone_repository(repo_url, dest_dir):
    try:
        run_command(f"git clone {repo_url} {dest_dir}")
        print("Repository cloned successfully!")
    except Exception as e:
        print(f"Error cloning repository: {e}")

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
                        binaries.append(file_path)

    return binaries

def clone_build_and_find_binary(repo_url):
    project_dir = './cloned_project'
    if os.path.exists(project_dir):
        shutil.rmtree(project_dir)
        print("Removed cloned project directory.")
    
    print(f"Cloning repository: {repo_url}")
    clone_repository(repo_url, project_dir)
    print(f"Building project...")
    detect_and_build_c_project(project_dir)
    print("Searching for binary files...")
    binaries = find_binary_files(project_dir)
    if binaries:
        print("Binaries found:")
        for binary in binaries:
            print(binary)
    else:
        print("No binary files found.")
    
    #logic for retrieving metadata
    api_url = 'https://api.github.com/repos/SrinjoyDutta1/TestRepo'
    headers = {'Authorization': 'token TOKEN', 'Accept': 'application/vnd.github+json'}
    parameters = {'owner': 'SrinjoyDutta1', 'repo': 'TestRepo'}
    
    AWS_ACCESS_KEY = "YOUR_ACCESS_KEY"
    AWS_SECRET_KEY = "YOUR_SECRET_KEY"
    
    response = requests.get(api_url.format(**parameters), headers=headers)
    if response.status_code == 200:
        metadata = response.json()
        s3 = boto3.client('s3', region_name='us-east-1', aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY)
        bucket_name = "cs407gitmetadata"
        filename = "metadata.json"
        s3.put_object(Body=json.dumps(metadata), Bucket=bucket_name, Key=filename)
    else:
        print(f"Error: {response.status_code} - {response.text}")
        
    print("Process finished!")

repo_url = 'https://github.com/SrinjoyDutta1/TestRepo.git'
clone_build_and_find_binary(repo_url)