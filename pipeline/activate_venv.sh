#!/bin/bash

# Name of the virtual environment folder
VENV_DIR="myenv"

# Check if the virtual environment directory exists
if [ ! -d "$VENV_DIR" ]; then
  echo "Virtual environment not found. Creating one..."

  # Create the virtual environment
  python3 -m venv $VENV_DIR

  echo "Virtual environment created."
fi

# Activate the virtual environment
source $VENV_DIR/bin/activate

echo "Virtual environment activated."

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing required packages from requirements.txt..."

    # Install/update packages from requirements.txt
    pip install -r requirements.txt

    echo "Packages installed."
else
    echo "requirements.txt not found."
fi
