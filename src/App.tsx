import { useState, useRef } from "react";
import "./App.css";
import { v4 as uuidv4 } from "uuid";

export type NodeData = {
  id: string;
  value: string;
  childrenIds: string[];
  x: number;
  y: number;
};

type NodeState = "white" | "gray" | "black";

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [newValue, setNewValue] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [childIds, setChildIds] = useState<string[]>([]);
  const nodeStatesRef = useRef<Record<string, NodeState>>({});
  const discoveryTimeRef = useRef<Record<string, number>>({});
  const finishTimeRef = useRef<Record<string, number>>({});
  const [highlightedEdge, setHighlightedEdge] = useState<
    [string, string] | null
  >(null);
  const [, setRenderTimes] = useState(0);

  const tempo = useRef(0);

  const createNode = () => {
    if (!newValue.trim()) return;

    const newNode: NodeData = {
      id: uuidv4(),
      value: newValue.trim(),
      childrenIds: [...childIds],
      x: Math.random() * 600 + 50,
      y: Math.random() * 400 + 50,
    };

    setNodes((prev) => {
      const updatedNodes = [...prev, newNode];
      parentIds.forEach((parentId) => {
        const parentIndex = updatedNodes.findIndex((n) => n.id === parentId);
        if (parentIndex !== -1) {
          updatedNodes[parentIndex] = {
            ...updatedNodes[parentIndex],
            childrenIds: [...updatedNodes[parentIndex].childrenIds, newNode.id],
          };
        }
      });
      return updatedNodes;
    });

    setNewValue("");
    setParentIds([]);
    setChildIds([]);
  };

  const findNodeById = (id: string) => nodes.find((n) => n.id === id);

  const dfsVisit = async (
    node: NodeData | undefined,
    parentId: string | null = null
  ) => {
    if (!node) return;

    const currentState = nodeStatesRef.current[node.id];

    if (currentState !== "white") {
      return;
    }
    if (parentId) {
      setHighlightedEdge([parentId, node.id]);
    } else {
      setHighlightedEdge(null);
    }

    nodeStatesRef.current[node.id] = "gray";
    tempo.current++;
    discoveryTimeRef.current[node.id] = tempo.current;

    setRenderTimes((prev) => prev + 1);
    await new Promise((res) => setTimeout(res, 1000));

    for (const childId of node.childrenIds) {
      const childNode = findNodeById(childId);
      if (childNode && nodeStatesRef.current[childNode.id] === "white") {
        await dfsVisit(childNode, node.id);
      }
    }

    nodeStatesRef.current[node.id] = "black";
    tempo.current++;
    finishTimeRef.current[node.id] = tempo.current;

    setRenderTimes((prev) => prev + 1);
    await new Promise((res) => setTimeout(res, 700));
    setHighlightedEdge(null);
  };

  const startDFS = async () => {
    const initialStates: Record<string, NodeState> = {};
    nodes.forEach((n) => {
      initialStates[n.id] = "white";
    });
    nodeStatesRef.current = initialStates;
    discoveryTimeRef.current = {};
    finishTimeRef.current = {};
    tempo.current = 0;
    setHighlightedEdge(null);
    setRenderTimes((prev) => prev + 1);

    if (nodes.length > 0) {
      await dfsVisit(nodes[0]);
    }

    for (const node of nodes) {
      if (nodeStatesRef.current[node.id] === "white") {
        await dfsVisit(node);
      }
    }
  };

  const toggleParentId = (id: string) => {
    setParentIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleChildId = (id: string) => {
    setChildIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const getColorByState = (state?: NodeState) => {
    switch (state) {
      case "gray":
        return "#9E9E9E";
      case "black":
        return "#212121";
      case "white":
      default:
        return "#4CAF50";
    }
  };

  return (
    <div className="app">
      <h1>Editor Visual de Nós - DFS com Cores e Tempos</h1>{" "}
      <div className="menu">
        {" "}
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Valor do novo nó"
        />{" "}
        <div>
          <span>Selecione os pais:</span>{" "}
          {nodes.map((node) => (
            <label key={node.id} style={{ marginRight: "10px" }}>
              {" "}
              <input
                type="checkbox"
                checked={parentIds.includes(node.id)}
                onChange={() => toggleParentId(node.id)}
              />
              {node.value}{" "}
            </label>
          ))}{" "}
        </div>{" "}
        <div>
          <span>Selecione os filhos:</span>{" "}
          {nodes.map((node) => (
            <label key={node.id} style={{ marginRight: "10px" }}>
              {" "}
              <input
                type="checkbox"
                checked={childIds.includes(node.id)}
                onChange={() => toggleChildId(node.id)}
              />
              {node.value}{" "}
            </label>
          ))}{" "}
        </div>
        <button onClick={createNode}>Adicionar Nó</button>{" "}
        <button onClick={startDFS} style={{ marginLeft: "10px" }}>
          Buscar em Profundidade{" "}
        </button>{" "}
      </div>{" "}
      <svg
        width={800}
        height={600}
        style={{ border: "1px solid #ccc", background: "#f9f9f9" }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>{" "}
        {nodes.map((node) =>
          node.childrenIds.map((childId) => {
            const child = findNodeById(childId);
            if (!child) return null;
            const isHighlighted =
              highlightedEdge &&
              highlightedEdge[0] === node.id &&
              highlightedEdge[1] === child.id;
            return (
              <line
                key={`${node.id}-${child.id}`}
                x1={node.x}
                y1={node.y}
                x2={child.x}
                y2={child.y}
                stroke={isHighlighted ? "#ff0000" : "black"}
                strokeWidth={isHighlighted ? 3 : 1}
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}{" "}
        {nodes.map((node) => (
          <g key={node.id}>
            {" "}
            <circle
              cx={node.x}
              cy={node.y}
              r={20}
              fill={getColorByState(nodeStatesRef.current[node.id])}
              style={{ transition: "fill 0.5s" }}
            />{" "}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dy=".3em"
              fill="white"
              fontSize={12}
            >
              {node.value}{" "}
            </text>{" "}
            <text
              x={node.x}
              y={node.y + 35}
              textAnchor="middle"
              fill="black"
              fontSize={10}
              fontWeight="bold"
            >
              ({discoveryTimeRef.current[node.id] || "-"} /{" "}
              {finishTimeRef.current[node.id] || "-"}){" "}
            </text>{" "}
          </g>
        ))}{" "}
      </svg>{" "}
    </div>
  );
}

export default App;
