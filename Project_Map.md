# Project Map: Txt2Circuit

## Source of Truth

**Mission:** Build deterministic automation for a text-to-circuit EDA tool using the B.L.A.S.T. protocol and the 3-layer architecture. Prioritize reliability over speed.

*(Note: A local file exactly named `Txt2Circuit` was not found in the workspace. The methodologies below have been synthesized based on the core mechanics of our Txt2Circuit platform.)*

### Methodologies for Natural Language to Circuit Translation
1. **Semantic Parsing:** Extract functional intent, component constraints, and connectivity requirements from natural language using strict JSON schema enforcement.
2. **Component Library Mapping:** Map extracted entities against a predefined standard component library (e.g., assigning generic terms to specific identifiers like 'Graviton Emitters' or 'Mass-Inversion Logic Gates').
3. **DRC (Design Rule Check) Enforcement:** Apply spatial and physical constraints (e.g., minimum clearances, connection mediums, isolation zones) during layout generation to ensure physical viability.
4. **Netlist Synthesis:** Construct a deterministic, hierarchical netlist (SPICE/Verilog-like format) representing point-to-point net connections.
5. **Fault Tolerance Injection:** Embed fail-safe logic, boot sequences, and error handling within metadata blocks directly into the generated artifacts.

### Strict JSON Data Schema

#### 1. System Input (User Text Prompt)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Txt2Circuit_Input",
  "type": "object",
  "properties": {
    "user_prompt": {
      "type": "string",
      "description": "The natural language request detailing the desired circuit."
    },
    "target_platform": {
      "type": "string",
      "description": "Target output format (e.g., 'SPICE', 'JSON_BOM', 'Verilog').",
      "default": "JSON_BOM"
    },
    "environment_constraints": {
      "type": "object",
      "description": "Physical or logical constraints specific to the run (e.g., gravity vector, max power)."
    }
  },
  "required": ["user_prompt"]
}
```

#### 2. System Output (Generated Netlist Payload)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Txt2Circuit_Output",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["SUCCESS", "DRC_VIOLATION", "FATAL_ERROR"]
    },
    "project_name": {
      "type": "string"
    },
    "netlist": {
      "type": "object",
      "description": "The structured connectivity mapping of the circuit."
    },
    "spatial_layout": {
      "type": "object",
      "description": "3D coordinate mappings and conduit vector paths."
    },
    "bom_materials": {
      "type": "array",
      "items": { "type": "object" },
      "description": "Required exotic physical materials."
    },
    "diagnostic_logs": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Simulation and validation check outputs."
    }
  },
  "required": ["status", "netlist", "project_name"]
}
```

## Maintenance Log & System Updates

### 1. Updating Component Definitions
If the theoretical physics definitions change (e.g., new 'Spatial-Flux Capacitor' thresholds or updated 'Graviton Emitter' capacities):
- **Action Required:** Update the standard library referenced by the LLM. 
- **Location:** Update the system prompt or few-shot examples inside `/tools/llm_client.py` and modify the parsed prefix rules inside `/tools/netlist_validator.py`.

### 2. Updating DRC Routing Rules
If spatial layout constraints change (e.g., minimum EMFC conduit clearance changes from 150mm to 200mm):
- **Action Required:** 
  - Update the specific numerical validation checks in `/tools/netlist_validator.py` (if hardcoded logic exists for coordinate validation).
  - Modify the routing instructions in the prompt construction logic within `/navigation/circuit_router.py` to ensure the foundational model adheres to the new rules.

### Deployment & Trigger Mechanisms
- **Batch Processing:** Handled via the FastAPI webhook listener (`batch_webhook.py`).
- **Containerization:** The environment enforces sandbox execution (via `appuser` permissions and environment variables) to prevent runaway resource consumption during generation and validation loops. See `Dockerfile`.
