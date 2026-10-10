import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { NodeChange, EdgeChange, Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { runSimulation } from './simulator';
import { BaseComponentNode } from './nodes/BaseComponentNode';
import dagre from 'dagre';

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 100, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 50,
        y: nodeWithPosition.y - 30,
      }
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
};

const nodeTypes = {
  baseComponent: BaseComponentNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [theme, setTheme] = useState('light');
  const [activeRightTab, setActiveRightTab] = useState('Properties');
  const [activeBottomTab, setActiveBottomTab] = useState('Simulation Results');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      // Sync circuitModel on drag or delete
      setCircuitModel((prev: any) => {
        if (!prev) return prev;
        let updatedComponents = [...prev.components];
        
        changes.forEach(change => {
            if (change.type === 'position' && change.position) {
                const comp = updatedComponents.find(c => c.id === change.id);
                if (comp) comp.position = change.position;
            }
            if (change.type === 'remove') {
                updatedComponents = updatedComponents.filter(c => c.id !== change.id);
            }
        });
        
        return { ...prev, components: updatedComponents };
      });
    },
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'step', animated: false, style: { stroke: 'var(--primary)', strokeWidth: 2 } }, eds.map(e => ({...e, animated: false}))));
      setCircuitModel((prev: any) => {
        if (!prev) return prev;
        const newConn = {
          id: `c_${Date.now()}`,
          sourceComponent: params.source,
          sourcePin: params.sourceHandle,
          targetComponent: params.target,
          targetPin: params.targetHandle
        };
        return { ...prev, connections: [...prev.connections, newConn] };
      });
      setSimulationResults(null);
    },
    []
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      setEdges(eds => eds.map(e => ({ ...e, animated: false })));
      setCircuitModel((prev: any) => {
        if (!prev) return prev;
        const deletedIds = deleted.map(d => d.id);
        return {
          ...prev,
          connections: prev.connections.filter((c: any) => !deletedIds.includes(c.id))
        };
      });
      setSimulationResults(null);
    },
    []
  );

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, defaultVal: string, unit: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/val', defaultVal);
    event.dataTransfer.setData('application/reactflow/unit', unit);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const val = event.dataTransfer.getData('application/reactflow/val');
      const unit = event.dataTransfer.getData('application/reactflow/unit');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - 350, 
        y: event.clientY - 100, 
      };
      
      const numPins = type === 'OpAmp' || type === 'NPN' || type === 'PNP' || type.includes('MOSFET') ? 3 : (type === '555 Timer' ? 8 : (type === 'Ground' ? 1 : 2));
      const pins = Array.from({ length: numPins }, (_, i) => ({ id: `p${i+1}` }));

      const newComponent = {
        id: `comp_${Date.now()}`,
        type,
        reference: `${type.charAt(0)}${Math.floor(Math.random()*100)}`,
        value: val,
        unit,
        pins,
        position
      };

      const newNode = {
        id: newComponent.id,
        type: 'baseComponent',
        position,
        data: newComponent,
      };

      setNodes((nds) => nds.concat(newNode));
      setCircuitModel((prev: any) => {
          const base = prev || { name: 'Untitled Circuit', components: [], connections: [] };
          return { ...base, components: [...base.components, newComponent] };
      });
    },
    [setNodes]
  );

  const [promptInput, setPromptInput] = useState('');
  const [circuitModel, setCircuitModel] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  const saveProject = () => {
    if (!circuitModel) return;
    const projectData = { circuitModel, nodes, edges, chatHistory };
    localStorage.setItem('txt2circuit_project', JSON.stringify(projectData));
    alert('Project saved locally!');
  };

  const loadProject = () => {
    const dataStr = localStorage.getItem('txt2circuit_project');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        setCircuitModel(data.circuitModel);
        setNodes(data.nodes);
        setEdges(data.edges);
        setChatHistory(data.chatHistory || [{ role: 'ai', content: 'Project loaded successfully.' }]);
      } catch(e) {
        console.error('Failed to load project', e);
      }
    } else {
      alert('No saved project found.');
    }
  };
  
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  const handlePrompt = async () => {
    if (!promptInput.trim()) return;
    try {
      setChatHistory([{role: 'user', content: promptInput}]);
      const res = await fetch('http://localhost:5000/api/process_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChatHistory(prev => [...prev, {role: 'ai', content: data.ai_explanation}]);
        const circuit = data.circuit;
        setCircuitModel(circuit);
        const newNodes: Node[] = circuit.components.map((c: any) => ({
          id: c.id,
          type: 'baseComponent',
          position: c.position,
          data: c
        }));
        const newEdges: Edge[] = circuit.connections.map((c: any) => ({
          id: c.id,
          source: c.sourceComponent,
          sourceHandle: c.sourcePin,
          target: c.targetComponent,
          targetHandle: c.targetPin,
          type: 'step',
          animated: false,
          style: { stroke: 'var(--primary)', strokeWidth: 2 }
        }));
        const { layoutedNodes, layoutedEdges } = getLayoutedElements(newNodes, newEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } else {
        alert("Failed to generate circuit: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred while communicating with the server.");
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !circuitModel) return;
    const msg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, {role: 'user', content: msg}]);
    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, circuit: circuitModel })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChatHistory(prev => [...prev, {role: 'ai', content: data.reply}]);
        if (data.circuit) {
            setCircuitModel(data.circuit);
            const newNodes: Node[] = data.circuit.components.map((c: any) => ({
              id: c.id,
              type: 'baseComponent',
              position: c.position,
              data: c
            }));
            const newEdges: Edge[] = data.circuit.connections.map((c: any) => ({
              id: c.id,
              source: c.sourceComponent,
              sourceHandle: c.sourcePin,
              target: c.targetComponent,
              targetHandle: c.targetPin,
              type: 'step',
              animated: false,
              style: { stroke: 'var(--primary)', strokeWidth: 2 }
            }));
            const { layoutedNodes, layoutedEdges } = getLayoutedElements(newNodes, newEdges);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            // Clear stale simulation results
            setSimulationResults(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark-theme' : ''} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <header className="header">
        <div className="logo-area">
            <div className="logo-icon">
                <span className="material-symbols-outlined">memory</span>
            </div>
            <div className="logo-text">
                <h1>Txt2Circuit</h1>
                <p>Design • Simulate • Understand</p>
            </div>
        </div>
        
        <div className="search-bar-container">
            <div className="ai-prompt-bar">
                <span className="material-symbols-outlined spark-icon">temp_preferences_custom</span>
                <input 
                  type="text" 
                  placeholder="Ask AI... (e.g., Create a 12V voltage divider giving 5V output)" 
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePrompt()}
                />
                <button className="arrow-btn" onClick={handlePrompt}>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>

        <div className="header-actions">
            <label className="theme-switch">
                <input type="checkbox" id="theme-toggle-input" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className="slider">
                    <span className="material-symbols-outlined icon-sun">light_mode</span>
                    <span className="material-symbols-outlined icon-moon">dark_mode</span>
                </span>
            </label>
            <button className="btn secondary"><span className="material-symbols-outlined">save</span> Save</button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-body" style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar: Component Library */}
        <aside className="sidebar-left">
            <div className="sidebar-header">
                <h2>Component Library</h2>
                <span className="material-symbols-outlined">close_fullscreen</span>
            </div>
            
            <div className="search-components">
                <span className="material-symbols-outlined">search</span>
                <input type="text" placeholder="Search components..." />
                <span className="shortcut">⌘K</span>
            </div>
            
            <div className="component-categories-tabs">
                <button className="active">All</button>
                <button>Basic</button>
                <button>Passive</button>
                <button>Active</button>
                <button>IC</button>
            </div>
            
            <div className="component-list-scroll">
                <div className="component-category">
                    <h3>Power Sources <span className="material-symbols-outlined" style={{fontSize: '16px', cursor: 'pointer'}}>expand_more</span></h3>
                    <div className="component-grid">
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'DC Source', '5', 'V')}>
                            <span className="material-symbols-outlined">power</span>
                            <span className="name">DC Source</span>
                            <span className="val">5V</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'Battery', '9', 'V')}>
                            <span className="material-symbols-outlined">battery_charging_full</span>
                            <span className="name">Battery</span>
                            <span className="val">9V</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'AC Source', '10', 'V')}>
                            <span className="material-symbols-outlined">waves</span>
                            <span className="name">AC Source</span>
                            <span className="val">10V</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'Ground', '', '')}>
                            <span className="material-symbols-outlined">vertical_align_bottom</span>
                            <span className="name">Ground</span>
                            <span className="val">0V</span>
                        </div>
                    </div>
                </div>
                
                <div className="component-category">
                    <h3>Passive Components</h3>
                    <div className="component-grid">
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'Resistor', '1k', 'Ω')}>
                            <span className="name">Resistor</span>
                            <span className="val">1kΩ</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'Capacitor', '1', 'µF')}>
                            <span className="name">Capacitor</span>
                            <span className="val">1µF</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'Inductor', '10', 'mH')}>
                            <span className="name">Inductor</span>
                            <span className="val">10mH</span>
                        </div>
                    </div>
                </div>
                
                <div className="component-category">
                    <h3>Semiconductors & ICs</h3>
                    <div className="component-grid">
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'NPN', '', '')}>
                            <span className="name">NPN BJT</span>
                            <span className="val">2N3904</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'OpAmp', '', '')}>
                            <span className="name">Op-Amp</span>
                            <span className="val">LM741</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, 'Diode', '', '')}>
                            <span className="name">Diode</span>
                            <span className="val">1N4148</span>
                        </div>
                        <div className="component-item" draggable onDragStart={(e) => onDragStart(e, '555 Timer', '', '')}>
                            <span className="name">555 Timer</span>
                            <span className="val">IC</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        {/* Center Workspace */}
        <main className="workspace">
            <div className="workspace-header">
                <div className="title-area">
                    <button className="icon-btn"><span className="material-symbols-outlined">arrow_back</span></button>
                    <div className="project-title">
                        <h2>{circuitModel?.name || 'Untitled Circuit'} <span className="material-symbols-outlined">edit</span></h2>
                        <p>Generated Circuit</p>
                    </div>
                </div>
                
                <div className="view-tabs">
                    <button className="active">Schematic</button>
                    <button>2D Layout</button>
                    <button>3D View</button>
                </div>
                
                <div className="canvas-actions">
                    <button className="icon-btn" onClick={saveProject} title="Save"><span className="material-symbols-outlined">save</span></button>
                    <button className="icon-btn" onClick={loadProject} title="Load"><span className="material-symbols-outlined">folder_open</span></button>
                    <button className="btn secondary validate-btn" onClick={async () => {
                        if (circuitModel) {
                            const { validateCircuit } = await import('./simulator');
                            const val = validateCircuit(circuitModel);
                            if (val.valid) {
                                setCircuitModel({ ...circuitModel, validation: [] });
                                alert("Circuit topology is valid!");
                            } else {
                                setCircuitModel({ ...circuitModel, validation: val.errors.map(e => ({ severity: 'error', message: e })) });
                                alert("Topology Validation Failed:\n- " + val.errors.join("\n- "));
                            }
                        }
                    }}><span className="material-symbols-outlined" style={{color:'var(--success)'}}>check_circle</span> Validate</button>
                    <button className="btn primary simulate-btn" onClick={async () => {
                        if (circuitModel) {
                            const { validateCircuit, runSimulation } = await import('./simulator');
                            const val = validateCircuit(circuitModel);
                            if (!val.valid) {
                                setCircuitModel({ ...circuitModel, validation: val.errors.map(e => ({ severity: 'error', message: e })) });
                                alert("Simulation aborted. Topology Validation Failed:\n- " + val.errors.join("\n- "));
                                return;
                            }
                            setCircuitModel({ ...circuitModel, validation: [] });
                            runSimulation(circuitModel).then(res => {
                                if (!res.success) {
                                    alert(res.error);
                                    return;
                                }
                                console.log("Sim results:", res);
                                setSimulationResults(res);
                                setEdges(eds => eds.map(e => ({ ...e, animated: true })));
                                setActiveBottomTab('Simulation');
                            });
                        }
                    }}><span className="material-symbols-outlined">play_arrow</span> Simulate</button>
                </div>
            </div>
            
            {/* Canvas Area with ReactFlow */}
            <div className="canvas-container" onDragOver={onDragOver} onDrop={onDrop}>
                <ReactFlow 
                    nodes={nodes} 
                    edges={edges} 
                    onNodesChange={onNodesChange} 
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgesDelete={onEdgesDelete}
                    onSelectionChange={(elements) => {
                      setSelectedNode(elements.nodes[0] || null);
                    }}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Background color="#ccc" gap={16} />
                    <Controls />
                </ReactFlow>

                {circuitModel?.validation?.some((v: any) => v.severity === 'error') ? (
                  <div className="valid-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
                      <span className="material-symbols-outlined">error</span>
                      <div>
                          <strong>Circuit Invalid</strong>
                          <small>{circuitModel.validation.find((v: any) => v.severity === 'error').message}</small>
                      </div>
                  </div>
                ) : circuitModel?.validation?.some((v: any) => v.severity === 'warning') ? (
                  <div className="valid-badge" style={{ backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #facc15' }}>
                      <span className="material-symbols-outlined">warning</span>
                      <div>
                          <strong>Warnings Found</strong>
                          <small>{circuitModel.validation.find((v: any) => v.severity === 'warning').message}</small>
                      </div>
                  </div>
                ) : (
                  <div className="valid-badge">
                      <span className="material-symbols-outlined">check_circle</span>
                      <div>
                          <strong>Circuit Valid</strong>
                          <small>No errors found</small>
                      </div>
                  </div>
                )}
                
                <div className="canvas-tools-left">
                    <button className="active"><span className="material-symbols-outlined">near_me</span></button>
                    <button><span className="material-symbols-outlined">timeline</span></button>
                    <button><span className="material-symbols-outlined">category</span></button>
                    <button><span className="material-symbols-outlined">delete</span></button>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="bottom-panel">
                <div className="panel-tabs">
                    {['Theory', 'Calculation', 'Simulation', 'Step-by-Step'].map(tab => (
                        <button key={tab} className={activeBottomTab === tab ? 'active' : ''} onClick={() => setActiveBottomTab(tab)}>
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div className="panel-content" style={{ display: activeBottomTab === 'Theory' ? 'block' : 'none', overflowY: 'auto', padding: '16px' }}>
                    <h3>Electronic Theory & Concepts</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        {circuitModel?.theory || circuitModel?.explanation || "No theory available for this circuit. Try generating one using the AI prompt."}
                    </div>
                </div>

                <div className="panel-content" style={{ display: activeBottomTab === 'Calculation' ? 'block' : 'none', overflowY: 'auto' }}>
                    <h3>Mathematical Calculations</h3>
                    {circuitModel?.calculations?.length ? (
                        circuitModel.calculations.map((calc: any, i: number) => (
                            <div key={i} className="calc-card" style={{ background: 'var(--bg-surface)', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{String(calc.description)}</div>
                                <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{String(calc.formula)}</div>
                                <div style={{ fontFamily: 'monospace' }}>= {String(calc.values)}</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>Result: {String(calc.result)}</div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-muted)', padding: '16px' }}>No mathematical formulas or calculations available for this circuit state.</p>
                    )}
                </div>

                <div className="panel-content" style={{ display: activeBottomTab === 'Simulation' ? 'block' : 'none', padding: '16px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <h3>Waveform Output</h3>
                            {simulationResults?.waveforms ? (
                                <svg width="100%" height="200" style={{ background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                                    <path d={simulationResults.waveforms.path} fill="none" stroke="var(--primary)" strokeWidth="2" />
                                    <text x="10" y="20" fill="var(--primary)" fontSize="12" fontFamily="monospace">{simulationResults.waveforms.label}</text>
                                </svg>
                            ) : (
                                <div style={{ background: 'var(--bg-surface)', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>No transient or AC data. Run simulation with an AC source or clock.</p>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3>Node Readouts (DC)</h3>
                            {simulationResults ? (
                                <div className="stats-cards" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="stat-card green-bg" style={{ flex: 1 }}>
                                        <span className="material-symbols-outlined icon">bolt</span>
                                        <div>
                                            <small>Voltages</small>
                                            <pre style={{ fontSize: '14px', margin: 0, marginTop: '8px' }}>
                                                {Object.entries(simulationResults.voltages || {}).map(([k, v]) => `${k}: ${v}V\n`)}
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="stat-card blue-bg" style={{ flex: 1 }}>
                                        <span className="material-symbols-outlined icon">electric_meter</span>
                                        <div>
                                            <small>Currents</small>
                                            <pre style={{ fontSize: '14px', margin: 0, marginTop: '8px' }}>
                                                {Object.entries(simulationResults.currents || {}).map(([k, v]) => `${k}: ${v}A\n`)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)' }}>Run a simulation to see active nodes.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="panel-content" style={{ display: activeBottomTab === 'Step-by-Step' ? 'block' : 'none', overflowY: 'auto', padding: '16px' }}>
                    <h3>Step-by-Step Schematic Walkthrough</h3>
                    {circuitModel?.step_by_step?.length ? (
                        <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                                {circuitModel.step_by_step.map((step: string, i: number) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No guided walkthrough available. Try generating a circuit using the AI Assistant.</p>
                    )}
                </div>
            </div>
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar-right">
            <div className="right-tabs">
                {['Properties', 'AI Assistant', 'Simulation'].map(tab => (
                    <button key={tab} className={activeRightTab === tab ? 'active' : ''} onClick={() => setActiveRightTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>
            
            <div className={`properties-panel ${activeRightTab === 'Properties' ? 'active' : ''}`} style={{ display: activeRightTab === 'Properties' ? 'block' : 'none' }}>
                <h3>Component Properties</h3>
                {selectedNode ? (
                  <>
                    <div className="selected-component-card">
                        <div className="comp-title">{String(selectedNode.data.type)} ({String(selectedNode.data.reference)})</div>
                    </div>
                    <div className="prop-form">
                        <div className="form-group row-flex">
                            <div className="label-half">Value</div>
                            <div className="input-with-unit">
                                <input type="text" value={String(selectedNode.data.value || '')} onChange={(e) => {
                                    const newVal = e.target.value;
                                    const updatedNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, value: newVal } } : n);
                                    setNodes(updatedNodes);
                                    setSelectedNode(updatedNodes.find(n => n.id === selectedNode.id) || null);
                                    if (circuitModel) {
                                        const updatedComps = circuitModel.components.map((c: any) => c.id === selectedNode.id ? { ...c, value: newVal } : c);
                                        setCircuitModel({ ...circuitModel, components: updatedComps });
                                    }
                                }} />
                                <select><option>{String(selectedNode.data.unit || '')}</option></select>
                            </div>
                        </div>
                    </div>
                  </>
                ) : (
                  <p style={{ padding: '16px', color: 'var(--text-muted)' }}>Select a component to view properties.</p>
                )}
            </div>
            
            <div className={`ai-assistant-panel ${activeRightTab === 'Validation' ? 'active' : ''}`} style={{ display: activeRightTab === 'Validation' ? 'block' : 'none', padding: '16px', overflowY: 'auto' }}>
                <h3>Validation Issues</h3>
                {circuitModel?.validation?.length ? (
                    circuitModel.validation.map((v: any, i: number) => (
                        <div key={i} className={`alert ${v.severity === 'error' ? 'alert-error' : 'alert-warning'}`} style={{ padding: '12px', marginBottom: '10px', borderRadius: '6px', backgroundColor: v.severity === 'error' ? '#fee2e2' : '#fef9c3', color: v.severity === 'error' ? '#991b1b' : '#854d0e' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>
                                {v.severity === 'error' ? 'error' : 'warning'}
                            </span>
                            {v.message}
                        </div>
                    ))
                ) : (
                    <div className="alert alert-success" style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>check_circle</span>
                        Circuit is electrically valid. No issues found.
                    </div>
                )}
            </div>

            <div className={`ai-assistant-panel ${activeRightTab === 'AI Assistant' ? 'active' : ''}`} style={{ display: activeRightTab === 'AI Assistant' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                <div className="ai-header">
                    <h3><span className="material-symbols-outlined spark-icon" style={{color: '#6366f1'}}>temp_preferences_custom</span> AI Assistant</h3>
                </div>
                <div className="chat-area" style={{ flex: 1, overflowY: 'auto' }}>
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`chat-message ${msg.role === 'ai' ? 'ai-msg' : 'user-msg'}`}>
                          <div className="msg-bubble">
                              <p>{msg.content}</p>
                          </div>
                      </div>
                    ))}
                </div>
                <div className="chat-input-area">
                    <input 
                      type="text" 
                      placeholder="Ask a follow-up question..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleChat()}
                    />
                    <button className="send-btn" onClick={handleChat}><span className="material-symbols-outlined">arrow_forward</span></button>
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
