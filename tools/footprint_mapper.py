import sys
import os

# Import the LLM engine for fallback inference
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.llm_client import LLMClient

class FootprintMapper:
    def __init__(self):
        self.llm = LLMClient()
        
        # Deterministic IPC-compliant mapping library
        self.standard_map = {
            "R": "Resistor_SMD:R_0603_1608Metric",
            "C": "Capacitor_SMD:C_0603_1608Metric",
            "CP": "Capacitor_THT:CP_Radial_D5.0mm_P2.50mm",
            "L": "Inductor_SMD:L_0805_2012Metric",
            "Q": "Package_TO_SOT_SMD:SOT-23",
            "D": "Diode_SMD:D_SOD-123",
            "LED": "LED_SMD:LED_0805_2012Metric",
            "U_LM317": "Package_TO_SOT_SMD:TO-252-2",
            "U_NE555": "Package_DIP:DIP-8_W7.62mm",
            # Standard Txt2Circuit Antigravity Enclosures
            "GE": "Exotic_Antigravity:GE_Shielded_Mount_40mm",
            "MILG": "Exotic_Antigravity:MILG_Cryo_Socket_20mm",
            "SFC": "Exotic_Antigravity:SFC_Macro_Terminal_Pad"
        }

    def assign_footprints(self, netlist_components: list) -> list:
        """
        Ingests a list of component dictionaries and assigns physical PCB footprints.
        """
        assigned_components = []
        
        for comp in netlist_components:
            refdes = comp.get("ref", "")
            value = comp.get("value", "")
            
            # Extract alphabetic prefix (e.g., 'R12' -> 'R')
            prefix = ''.join([c for c in refdes if c.isalpha()])
            
            # 1. Match Exact Value/Model (e.g., specific ICs)
            lookup_key_value = f"{prefix}_{value}"
            if lookup_key_value in self.standard_map:
                footprint = self.standard_map[lookup_key_value]
            
            # 2. Match Generic Prefix (e.g., Passives)
            elif prefix in self.standard_map:
                footprint = self.standard_map[prefix]
                
            # 3. Fallback: LLM Semantic Inference
            else:
                footprint = self._query_llm_for_footprint(refdes, value)
                
            comp["footprint"] = footprint
            assigned_components.append(comp)
            
        return assigned_components

    def _query_llm_for_footprint(self, refdes: str, value: str) -> str:
        """
        Queries the LLM engine to infer IPC footprint packages for non-standard or custom parts.
        """
        print(f"[FootprintMapper] Cache miss for {refdes} ({value}). Querying LLM inference engine...")
        prompt = (
            f"Infer the most likely standard KiCad footprint for a component "
            f"with Reference Designator: '{refdes}' and Value: '{value}'. "
            f"Return ONLY a strictly formatted JSON object: {{\"footprint\": \"Library:Package_Name\"}}"
        )
        
        # In a real environment, this utilizes the active LLMClient session.
        # Catching the mock failure safely here for the scaffold.
        try:
            response = self.llm.generate_netlist(prompt)
            return response.get("footprint", "Unknown_Package:Requires_Manual_Assignment")
        except Exception:
            return "Unknown_Package:Requires_Manual_Assignment"

if __name__ == "__main__":
    print("Footprint Mapper Engine Scaffold Initialized.")
