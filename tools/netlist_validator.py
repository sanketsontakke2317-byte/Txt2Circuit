class NetlistValidator:
    def __init__(self):
        # Valid reference designator prefixes based on Txt2Circuit component rules
        self.valid_refdes_prefixes = ['GE', 'MILG', 'SFC', 'V_', 'U_', 'R_']
        
    def validate(self, payload: dict) -> dict:
        """
        Deterministic parsing function that validates the generated netlist.
        Checks for:
        1. Syntax compliance (valid reference designators).
        2. Missing Reference Designators.
        3. Floating/Dangling nets.
        Returns a structured error payload if validation fails.
        """
        errors = []
        
        if "netlist" not in payload:
            return {"validation_errors": ["Missing 'netlist' block in payload."]}
            
        netlist = payload["netlist"]
        
        declared_nets = set()
        component_pins = {}
        
        # Simple SPICE-like parsing function
        def parse_line(line: str):
            parts = line.strip().split()
            if len(parts) < 3:
                return
                
            refdes = parts[0]
            # Check syntax compliance for refdes
            if not any(refdes.startswith(p) for p in self.valid_refdes_prefixes):
                errors.append(f"Invalid reference designator syntax: '{refdes}'. Must start with a known prefix.")
            
            # Extract nets (approximating that everything between refdes and component model/value is a net)
            nets = [p for p in parts[1:] if not p.startswith(('GE-', 'SFC-', 'MILG-', 'LOGIC-', 'MCU-')) and "=" not in p and not p.endswith('V')]
            
            component_pins[refdes] = nets
            for net in nets:
                if net not in ["0", "GND"]: # Ground is implicitly connected globally
                    declared_nets.add(net)

        # Parse structural blocks dynamically
        for block_name, block_content in netlist.items():
            if isinstance(block_content, str):
                parse_line(block_content)
            elif isinstance(block_content, list):
                for item in block_content:
                    if isinstance(item, str):
                        parse_line(item)
                
        if not component_pins:
            errors.append("Netlist is structurally empty. No valid components parsed.")

        # Check for floating/dangling nets
        net_connection_counts = {net: 0 for net in declared_nets}
        for refdes, pins in component_pins.items():
            unique_pins = set(pins)
            for pin in unique_pins:
                if pin in net_connection_counts:
                    net_connection_counts[pin] += 1
                    
        for net, count in net_connection_counts.items():
            if count < 2:
                errors.append(f"Floating/Dangling net detected: '{net}' is only connected to {count} node(s). Minimum of 2 required.")
                
        if errors:
            return {"status": "DRC_VIOLATION", "validation_errors": errors}
            
        return {} # Success (no errors)
