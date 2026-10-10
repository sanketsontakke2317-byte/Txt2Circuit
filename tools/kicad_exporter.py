import json
from datetime import datetime

class KiCadExporter:
    def __init__(self):
        """Initializes the KiCad exporter."""
        pass

    def convert_to_net(self, payload: dict) -> str:
        """
        Converts a Txt2Circuit JSON netlist payload into a KiCad .net format.
        Extracts reference designators, components, and mapped pins.
        """
        if "netlist" not in payload:
            raise ValueError("Payload missing 'netlist' block. Cannot export to KiCad.")
            
        netlist = payload["netlist"]
        
        components = []
        nets_dict = {} # Mapping of net_name -> list of (refdes, pin_number)
        
        def parse_netlist_line(line: str):
            parts = line.strip().split()
            if len(parts) < 3:
                return
            
            refdes = parts[0]
            model = "Generic"
            nets = []
            
            # Simple heuristic to separate nets from the component model and DRC constraints
            for part in parts[1:]:
                # Ignore metadata assignments (e.g., CONDUIT_MEDIUM="EMFC")
                if "=" in part:
                    continue
                # Identify standard antigravity/electronics component model prefixes
                if part.startswith(('GE-', 'SFC-', 'MILG-', 'LOGIC-', 'DC', 'V_')):
                    model = part
                    continue
                # If it hasn't matched a model or constraint, it is a net connection
                if model == "Generic":
                    nets.append(part)
                    
            components.append({"ref": refdes, "value": model})
            
            # Assign pin numbers sequentially starting from 1
            for i, net in enumerate(nets):
                pin_num = str(i + 1)
                if net not in nets_dict:
                    nets_dict[net] = []
                nets_dict[net].append((refdes, pin_num))

        # Parse standard Txt2Circuit netlist blocks
        for block in ["power_input", "flux_storage", "inversion_logic", "diagnostics"]:
            if block in netlist and isinstance(netlist[block], str):
                parse_netlist_line(netlist[block])
                
        if "emitters" in netlist and isinstance(netlist["emitters"], list):
            for em in netlist["emitters"]:
                parse_netlist_line(em)
                
        # Generate the KiCad S-Expression Format (.net)
        lines = []
        lines.append("(export (version D)")
        lines.append("  (design")
        lines.append(f"    (date \"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\")")
        lines.append("    (tool \"Txt2Circuit Exporter v1.0\"))")
        
        lines.append("  (components")
        for comp in components:
            lines.append(f"    (comp (ref {comp['ref']})")
            lines.append(f"      (value {comp['value']}))")
        lines.append("  )")
        
        lines.append("  (nets")
        net_code = 1
        for net_name, nodes in nets_dict.items():
            lines.append(f"    (net (code {net_code}) (name {net_name})")
            for ref, pin in nodes:
                lines.append(f"      (node (ref {ref}) (pin {pin}))")
            lines.append("    )")
            net_code += 1
            
        lines.append("  )")
        lines.append(")")
        
        return "\n".join(lines)

if __name__ == "__main__":
    # Internal Unit Test
    exporter = KiCadExporter()
    dummy_payload = {
        "netlist": {
            "power_input": "V_PLASMA PLAS_PWR_POS PLAS_PWR_NEG DC_8500V",
            "emitters": [
                "GE1 PLAS_PWR_POS PLAS_PWR_NEG INVERTED_MASS GE_FB_1 GE_STAT_1 GE-01A CONDUIT_MEDIUM=\"EMFC\""
            ]
        }
    }
    print(exporter.convert_to_net(dummy_payload))
