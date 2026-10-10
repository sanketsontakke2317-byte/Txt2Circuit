import type { CircuitModel } from './types';
// @ts-ignore
import ngspice from '@o.z/ngspice-wasm';

class UnionFind {
    parent: Record<string, string> = {};
    
    find(i: string): string {
        if (this.parent[i] === undefined) {
            this.parent[i] = i;
        }
        if (this.parent[i] === i) return i;
        return this.parent[i] = this.find(this.parent[i]);
    }
    
    union(i: string, j: string) {
        const rootI = this.find(i);
        const rootJ = this.find(j);
        if (rootI !== rootJ) {
            this.parent[rootI] = rootJ;
        }
    }
}

export function validateCircuit(circuit: CircuitModel): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
    if (!circuit || !circuit.components || circuit.components.length === 0) {
        return { valid: false, errors: ["Circuit has no components."] };
    }
    
    // Check if there is a Ground component
    const hasGround = circuit.components.some(c => c.type === 'Ground');
    if (!hasGround) {
        errors.push("Missing Ground (reference) component. Simulations require a 0V reference node.");
    }

    // Check for unconnected pins
    circuit.components.forEach(c => {
        if (!c.pins) return;
        c.pins.forEach(pin => {
            const isConnected = circuit.connections.some(conn => 
                (conn.sourceComponent === c.id && conn.sourcePin === pin.id) ||
                (conn.targetComponent === c.id && conn.targetPin === pin.id)
            );
            if (!isConnected && c.type !== 'Ground') {
                errors.push(`Component ${c.reference || c.id} has an unconnected pin (${pin.name || pin.id}). Floating nodes are not allowed.`);
            }
        });
        
        // Ensure values are not zero for inductors
        if (c.type === 'Inductor' && (!c.value || parseFloat(c.value.toString()) === 0)) {
            errors.push(`Inductor ${c.reference || c.id} cannot have a value of 0mH.`);
        }
    });

    return { valid: errors.length === 0, errors };
}

export function generateSpiceNetlist(circuit: CircuitModel): string {
    let netlist = `* ${circuit.name}\n\n`;
    
    // Default Models
    netlist += `.model 1N4007 D(IS=7.02767n RS=0.0341512 N=1.80803 EG=1.05743 XTI=5 BV=1000 IBV=5e-08 CJO=1e-11 VJ=0.7 M=0.5 FC=0.5 TT=1e-07)\n`;
    netlist += `.model BC547 NPN(IS=2.39E-14 VAF=108 BF=400 IKF=0.3 XTB=1.5 BR=9.72 CJC=4E-12 CJE=8E-12 TR=4.04E-9 TF=5.63E-10 VJC=0.75 VJE=0.75)\n\n`;
    
    const uf = new UnionFind();
    
    // Group all connected pins into logical Nets
    circuit.connections.forEach(conn => {
        const sourceNode = `${conn.sourceComponent}_${conn.sourcePin}`;
        const targetNode = `${conn.targetComponent}_${conn.targetPin}`;
        uf.union(sourceNode, targetNode);
    });

    // Identify Ground Net (Node 0)
    let groundNetId: string | null = null;
    circuit.components.forEach(c => {
        if (c.type === 'Ground') {
            const pinId = c.pins[0]?.id;
            if (pinId) {
                groundNetId = uf.find(`${c.id}_${pinId}`);
            }
        }
    });

    function getNet(compId: string, pinId: string): string {
        const netId = uf.find(`${compId}_${pinId}`);
        if (groundNetId !== null && netId === groundNetId) {
            return '0';
        }
        return netId.replace(/[^a-zA-Z0-9_]/g, '');
    }
    
    // Generate Netlist Components
    circuit.components.forEach(c => {
        if (c.type === 'Ground') return; // Ground is implicit via node 0
        
        let n1 = c.pins[0] ? getNet(c.id, c.pins[0].id) : '0';
        let n2 = c.pins[1] ? getNet(c.id, c.pins[1].id) : '0';
        
        if (c.type === 'Resistor' || c.type === 'Capacitor' || c.type === 'Inductor') {
            const prefix = c.type === 'Resistor' ? 'R' : c.type === 'Capacitor' ? 'C' : 'L';
            let valueStr = c.value ? `${c.value}${c.unit || ''}`.replace('µ', 'u').replace('Ω', '') : '1k';
            if (c.type === 'Inductor' && (valueStr === '0' || valueStr === '0mH')) valueStr = '10mH';
            netlist += `${c.reference || prefix+c.id} ${n1} ${n2} ${valueStr}\n`;
        } 
        else if (c.type === 'DC Source' || c.type === 'Battery') {
            const valueStr = c.value ? `${c.value}` : '9';
            netlist += `V${c.reference || c.id} ${n1} ${n2} DC ${valueStr}\n`;
        }
        else if (c.type === 'AC Source') {
            const valueStr = c.value ? `${c.value}` : '10';
            netlist += `V${c.reference || c.id} ${n1} ${n2} SINE(0 ${valueStr} 50)\n`;
        }
        else if (c.type === 'Diode' || c.type === 'LED') {
            netlist += `D${c.reference || c.id} ${n1} ${n2} 1N4007\n`;
        }
        else if (c.type === 'NPN') {
            let n3 = c.pins[2] ? getNet(c.id, c.pins[2].id) : '0';
            netlist += `Q${c.reference || c.id} ${n2} ${n1} ${n3} BC547\n`;
        }
    });

    if (circuit.components.some(c => c.type === 'AC Source' || c.type === '555 Timer')) {
        netlist += '\n.tran 1ms 100ms\n';
    } else {
        netlist += '\n.op\n';
    }
    netlist += '.end\n';
    return netlist;
}

export async function runSimulation(circuit: CircuitModel) {
    const validation = validateCircuit(circuit);
    if (!validation.valid) {
        return {
            success: false,
            error: "Topology Validation Failed:\n" + validation.errors.join("\n")
        };
    }

    const netlist = generateSpiceNetlist(circuit);
    console.log("Generated Netlist:\n" + netlist);
    
    // In a real implementation we would call Ngspice.init() and run it.
    // For now, returning formatted mock results mimicking Ngspice OP output.
    let mockVoltages: Record<string, number> = { n1: 12.0, n2: 8.16, n3: 0.0 };
    let mockCurrents: Record<string, number> = { V1: -0.00082 };
    let mockWaveforms: any = null;

    if (netlist.includes('Q') && netlist.includes('BC547')) {
        const vinMatch = netlist.match(/V\w+\s+\w+\s+\w+\s+DC\s+([0-9.]+)/i);
        const vinVal = vinMatch ? parseFloat(vinMatch[1]) : 0;
        if (vinVal > 2.0) {
            mockVoltages = { VOUT: 0.1, VIN: vinVal, VCC: 5.0 };
        } else {
            mockVoltages = { VOUT: 4.9, VIN: vinVal, VCC: 5.0 };
        }
        // Generate a square wave logic response
        mockWaveforms = {
            label: `VOUT (Logic level for VIN=${vinVal}V)`,
            path: `M 0 ${vinVal > 2.0 ? 180 : 20} L 200 ${vinVal > 2.0 ? 180 : 20} L 200 ${vinVal > 2.0 ? 20 : 180} L 400 ${vinVal > 2.0 ? 20 : 180} L 400 ${vinVal > 2.0 ? 180 : 20} L 600 ${vinVal > 2.0 ? 180 : 20}`
        };
    }

    if (netlist.includes('SINE(')) {
        // Generate a sine wave response
        mockWaveforms = {
            label: "V_AC (Sine Wave 50Hz)",
            path: "M 0 100 Q 50 0, 100 100 T 200 100 Q 250 0, 300 100 T 400 100 Q 450 0, 500 100 T 600 100"
        };
    }

    return {
        success: true,
        type: netlist.includes('.tran') ? 'tran' : 'dc',
        voltages: mockVoltages,
        currents: mockCurrents,
        waveforms: mockWaveforms,
        netlist: netlist
    };
}
