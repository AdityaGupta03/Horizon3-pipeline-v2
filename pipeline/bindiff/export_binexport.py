'''
  Credit to Dr. K: https://github.com/BiSECT-Temp/ghidraheadless_binexport
'''

from ghidra.app.script import GhidraScript
from ghidra.util.task import ConsoleTaskMonitor
from ghidra.app.util.exporter import Exporter
from com.google.security.binexport import BinExportExporter
from java.io import File

function_list = []
program_name = currentProgram.getName()
addr_set = currentProgram.getMemory()
f = File(program_name + '.BinExport')
exporter = BinExportExporter() #Binary BinExport (v2) for BinDiff
exporter.export(f, currentProgram, addr_set, monitor)
