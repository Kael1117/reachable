// CallGraph, CallNode, CallEdge interfaces.
export interface CallNode {
  id: string;
  file: string;
  name: string;
  line: number;
  isEntryPoint: boolean;
}

export interface CallEdge {
  from: string;
  to: string;
  importedFrom: string;
}

export interface CallGraph {
  nodes: Map<string, CallNode>;
  edges: CallEdge[];
  entryPoints: string[];
}
