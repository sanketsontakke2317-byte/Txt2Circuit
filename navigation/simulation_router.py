import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.spice_simulator import SpiceSimulator

class SimulationRouter:
    def __init__(self):
        self.simulator = SpiceSimulator()

    def parse_and_route(self, netlist: str, sim_type: str = "tran") -> dict:
        """
        Parses the netlist to extract probing points (e.g., V_out, I_in).
        Routes the netlist to the appropriate SPICE engine subprocess.
        Converts raw simulation .raw data into structured JSON arrays suitable for charting.
        """
        print(f"[SimRouter] Routing netlist for {sim_type} simulation...")
        
        # 1. Extract Probing Points
        # (In a full implementation, regex would scrape node names from the netlist string)
        probes = ["V_out", "I_in"]
        
        # 2. Execute SPICE Simulation
        if sim_type == "tran":
            raw_result = self.simulator.run_transient(netlist, "1ms", "10ms")
        elif sim_type == "op":
            raw_result = self.simulator.run_operating_point(netlist)
        elif sim_type == "ac":
            raw_result = self.simulator.run_ac_sweep(netlist, 10, "1Hz", "10kHz")
        else:
            return {"error": "Unsupported simulation type."}
            
        # 3. Parse .raw output into Chart-ready JSON Arrays
        # (Mocking the data converter for the scaffold)
        
        if raw_result.get("status") != "SUCCESS":
            return {"error": raw_result.get("error")}
            
        # Mocking the JSON structure that the frontend expects
        chart_payload = {
            "time_vector_ms": [0.0, 1.0, 2.0, 3.0, 4.0, 5.0],
            "signals": {
                "V_out": [0.0, 3.16, 4.32, 4.75, 4.91, 4.97],
                "I_in_mA": [5.0, 1.84, 0.68, 0.25, 0.09, 0.03]
            }
        }
        
        return chart_payload
