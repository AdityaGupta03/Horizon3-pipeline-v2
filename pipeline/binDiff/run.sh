cd /Users/mkg/Documents/Horizon3-pipeline/pipeline/binDiff
aws s3 cp "$1" ./binaries/binary1
aws s3 cp "$2" ./binaries/binary2
ghidra_11.1.2_PUBLIC/support/analyzeHeadless . TestProject -import ./binaries -deleteProject -analysisTimeoutPerFile 100 -scriptPath ./ghidraheadless_binexport/ -postScript ./ghidraheadless_binexport/sample_functions_cpy.py
bindiff binary1.BinExport binary2.binExport
rm ./binaries/*
rm ./*.BinExport
