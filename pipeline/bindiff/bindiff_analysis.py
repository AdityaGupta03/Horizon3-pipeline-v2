import graphviz
import BinExport2_pb2  # Import the generated protobuf classes

def parse_binexport_file(file_path):
    try:
        binexport = BinExport2_pb2.BinExport2()
        with open(file_path, "rb") as f:
            binexport.ParseFromString(f.read())
        return binexport
    except Exception as e:
        print(f"Error parsing the .BinExport file: {e}")


file1 = parse_binexport_file('/Users/mkg/temp/binary_search1.BinExport')
file2 = parse_binexport_file('/Users/mkg/temp/binary_search2.BinExport')

def get_vertex_name(v):
    return str(hex(v.address)) + ': ' + v.mangled_name

def render_graph(file, name):
    dot = graphviz.Digraph()
    for v in file1.call_graph.vertex:
        s = get_vertex_name(v)
        dot.node(str(hex(v.address)), s)
    for e in file1.call_graph.edge:
        dot.edge(str(hex(file1.call_graph.vertex[e.source_vertex_index].address)), str(hex(file1.call_graph.vertex[e.target_vertex_index].address)))
    dot.render(name)

render_graph(file1, "graph1")
render_graph(file2, "graph2")