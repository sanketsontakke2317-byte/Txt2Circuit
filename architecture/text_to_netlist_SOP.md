# SOP: Text-to-Netlist LLM Pipeline

## 1. Objective
To deterministically translate natural language engineering prompts into physical netlists and spatial layouts, ensuring compliance with the Txt2Circuit Project Map.

## 2. Pipeline Stages

### Stage 1: Input Ingestion & Validation
- **Action:** Ingest the raw user text prompt.
- **Enforcement:** Validate the payload against the `Txt2Circuit_Input` JSON schema.
- **Fail-safe:** If invalid, reject immediately and request clarification.

### Stage 2: Semantic Extraction
- **Action:** The LLM parses the prompt to identify physical requirements, component constraints, and structural logic.
- **Output:** Intermediate JSON object representing functional blocks.

### Stage 3: Component Resolution & DRC
- **Action:** Map the functional blocks against the authorized library (e.g., 'Graviton Emitters').
- **Enforcement:** Run theoretical spatial layouts against DRC rules (e.g., minimum 150mm clearance for EMFC).

### Stage 4: Netlist Generation & Output Formatting
- **Action:** Compile the resolved components into the final SPICE/Verilog-like syntax and strict JSON format.
- **Enforcement:** Validate the final payload against the `Txt2Circuit_Output` schema before returning to the user.
