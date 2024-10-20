# BinDiff Analysis Folder

This folder contains the necessary container and code for performing binary difference analysis using Ghidra, BinExport, and BinDiff. The purpose of this setup is to facilitate the comparison of two binary files to identify differences and similarities between them.

## Purpose

The main components of this folder are:
- **Ghidra**: A software reverse engineering (SRE) framework developed by the National Security Agency (NSA).
- **BinExport**: A plugin for Ghidra that exports disassembled code to a format that BinDiff can analyze.
- **BinDiff**: A tool for comparing binary files, identifying similarities and differences.

## Usage

Below are some notes on running the system. The code has been designed to run in the docker image from: `./Dockerfile`

### Docker

The docker image requires an AMD64 version of ubuntu. This is due to the dependencies (and possible versions) of the script, specifically Ghidra and BinDiff. To ensure this you can use the following docker command(s):

```sh
docker buildx build --platform linux/amd64 --load -t <your-tag-here> .
```

Note we use the ``--load`` flag to run store and run the image locally, so it is optional.
