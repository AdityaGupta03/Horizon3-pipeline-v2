#!/bin/bash
cd /opt
aws s3 cp "$1" ./binaries/binary1
aws s3 cp "$2" ./binaries/binary2
./ghidra_11.0.3_PUBLIC/support/analyzeHeadless . GhidraProject -import /opt/binaries -deleteProject -analysisTimeoutPerFile 100 -postScript /opt/scripts/export_binexport.py
bindiff /opt/binary1.BinExport /opt/binary2.BinExport
aws s3 cp /opt/binary1.BinExport s3://your-bucket-name/path/to/destination/
