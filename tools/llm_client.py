import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

class LLMClient:
    def __init__(self):
        self.api_key = os.getenv("API_KEY")
        self.mock_mode = False
        
        # Fallback to Mock Mode if the .env file wasn't created or key is missing
        if not self.api_key or self.api_key.strip() == "" or "your_actual_api_key_here" in self.api_key:
            print("[LLMClient] WARNING: Valid API_KEY not found in .env file. Defaulting to MOCK MODE.")
            self.mock_mode = True
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-3.8-flash')

    def generate_circuit(self, prompt: str) -> dict:
        """
        Sends the text prompt to the LLM to generate the canonical circuit model.
        Forces JSON output matching the Txt2Circuit canonical schema.
        """
        if self.mock_mode:
            return self._get_mock_payload(prompt)
            
        try:
            system_instruction = (
                "You are a professional electronics design engineer, analog and digital circuit specialist, and electrical network analyst.\n"
                "You must follow a strict engineering workflow: \n"
                "1. Functional Requirement Analysis: Understand purpose, inputs, outputs, supply, and load.\n"
                "2. Circuit Topology Selection: Select an appropriate, electrically correct topology.\n"
                "3. Electronic Component Selection: Choose suitable components with valid pin models. For Inductors, never use 0mH; default to 10mH if unspecified.\n"
                "4. Engineering Calculations: Use Ohm's Law, Kirchhoff's laws, time constants, and active device models. Calculate required values before picking standard values.\n"
                "5. Topology & Wiring (CRITICAL): Ensure all circuits form a COMPLETE CLOSED LOOP back to the power source return. The ground (GND) must be attached to the intended reference node (e.g., negative terminal of the source) and not replace a required return wire. Series circuits must strictly loop from source -> components -> source return.\n"
                "6. Digital Logic & Transistors: For digital gates (e.g., NOT gate), design a standard common-emitter amplifier. Use a 5V VCC DC Source, a collector resistor (RC), an input voltage source (VIN, e.g., 5V), a base resistor (RB), and an NPN transistor. Connect VCC -> RC -> Collector. Connect VIN -> RB -> Base. Emitter -> GND. Provide output from the Collector node. IN YOUR EXPLANATION, ALWAYS INCLUDE THE LOGIC TRUTH TABLE.\n"
                "7. Advanced Topologies: For Analog Filters (e.g., Low-Pass RC), connect VIN -> Resistor -> Capacitor -> GND, and take VOUT between R and C. For 555 Timers, output an IC component named '555 Timer' with appropriate 8 pins (GND, TRIG, OUT, RESET, CTRL, THR, DIS, VCC) and wire them according to Astable or Monostable requirements.\n"
                "8. Electrical Validation & Constraints: Check for floating nodes, short circuits, power ratings, diode polarities, and component limits. Ensure netlist mappings correspond precisely to the connections.\n"
                "9. Output: Only when the circuit is verified, output the result in the exact JSON schema requested.\n\n"
                
                "Do not merely place components on a canvas; they must be electrically meaningful. "
                "For example, a bridge rectifier must have 4 diodes properly oriented; an RLC circuit MUST return to the AC source's negative terminal; "
                "an op-amp needs feedback and supply rails. An NPN NOT Gate MUST have proper VCC, RC, VIN, RB, and GND routing.\n\n"
                
                "FEW-SHOT EXAMPLES:\n"
                "- Prompt: 'Design an RC Low Pass Filter'\n"
                "  Action: Generate AC Source, Resistor, Capacitor, Ground. Loop: AC+ -> R -> C -> AC-. Connect GND to AC-. Set R=1k, C=1uF.\n"
                "- Prompt: 'Design a 555 Astable Oscillator'\n"
                "  Action: Generate 5V DC Source, 555 Timer, R1, R2, C1, Ground. Wire VCC(8) and RESET(4) to 5V. Wire TRIG(2) and THR(6) together and to C1. Wire DIS(7) between R1 and R2.\n\n"
                
                "You must return a strictly formatted JSON payload with the exact following schema:\n"
                "{\n"
                '  "id": "gen_1",\n'
                '  "name": "Generated Circuit Name",\n'
                '  "components": [\n'
                '    {"id": "comp_1", "type": "Resistor", "reference": "R1", "value": "1k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 100}}\n'
                '  ],\n'
                '  "connections": [\n'
                '    {"id": "c_1", "sourceComponent": "comp_1", "sourcePin": "p2", "targetComponent": "comp_2", "targetPin": "p1"}\n'
                '  ],\n'
                '  "calculations": [\n'
                '    {"description": "LED Series Resistor", "formula": "(Vs - Vf) / I", "values": "(9V - 2V) / 0.02A", "result": "350Ω"}\n'
                '  ],\n'
                '  "validation": [\n'
                '    {"severity": "warning", "message": "Resistor power rating must be at least 0.25W"}\n'
                '  ],\n'
                '  "theory": "A detailed educational overview of the core electronic theory behind this circuit (e.g., transistor saturation regions, RC time constants).",\n'
                '  "step_by_step": [\n'
                '    "Step 1: Input voltage enters the base resistor.",\n'
                '    "Step 2: The NPN transistor turns ON due to Vbe > 0.7V.",\n'
                '    "Step 3: Collector voltage drops, pulling the output LOW."\n'
                '  ]\n'
                "}\n"
                "Make sure component types are common electrical types (Resistor, Capacitor, Inductor, DC Source, Battery, Diode, LED, NPN, PNP, MOSFET, OpAmp, Ground, 555 Timer, LogicGate).\n"
                "You MUST include a Ground component for reference in simulations.\n"
            )
            full_prompt = f"{system_instruction}\n\nUser Request: {prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON from LLM"}
        except Exception as e:
            return {"error": str(e)}

    def modify_circuit(self, message: str, circuit: dict) -> dict:
        """
        Sends the text prompt to modify an existing circuit.
        """
        if self.mock_mode:
            # Mock modification: just return the same circuit with a generic reply
            return {
                "reply": f"Mock Mode: I acknowledge your request '{message}'. If I had a real API key, I would modify the {circuit.get('name')} circuit.",
                "circuit": circuit
            }
        
        try:
            system_instruction = (
                "You are a professional electronics design engineer. The user is asking a question or requesting a modification to the provided circuit.\n"
                "Apply rigorous electronics engineering logic (Kirchhoff's laws, impedance calculations, safe operating areas) before making any modifications.\n"
                "If the user is ONLY asking a question, return a JSON object with a single 'reply' key containing your answer.\n"
                "If the user is asking to MODIFY the circuit, evaluate the electrical validity of the request. "
                "Return a JSON object with 'reply' explaining the engineering reasoning behind the changes, AND a 'circuit' key containing the fully updated circuit schema (same schema as generation: id, name, components, connections, calculations, validation).\n"
            )
            full_prompt = f"{system_instruction}\n\nCurrent Circuit:\n{json.dumps(circuit, indent=2)}\n\nUser Request: {message}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return data
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON from LLM"}
        except Exception as e:
            return {"error": str(e)}

    def _get_mock_payload(self, prompt: str) -> dict:
        """Returns dynamic mock payloads based on prompt keywords when no API key is provided."""
        prompt = prompt.lower()
        if "led" in prompt:
            return {
                "id": "gen_mock",
                "name": "LED Circuit",
                "components": [
                    {"id": "v1", "type": "Battery", "reference": "V1", "value": "9", "unit": "V", "pins": [{"id": "v1_p"}, {"id": "v1_n"}], "position": {"x": 100, "y": 200}},
                    {"id": "r1", "type": "Resistor", "reference": "R1", "value": "1k", "unit": "Ω", "pins": [{"id": "r1_1"}, {"id": "r1_2"}], "position": {"x": 250, "y": 100}},
                    {"id": "d1", "type": "LED", "reference": "LED1", "value": "Red", "unit": "", "pins": [{"id": "d1_a"}, {"id": "d1_k"}], "position": {"x": 400, "y": 200}}
                ],
                "connections": [
                    {"id": "c1", "sourceComponent": "v1", "sourcePin": "v1_p", "targetComponent": "r1", "targetPin": "r1_1"},
                    {"id": "c2", "sourceComponent": "r1", "sourcePin": "r1_2", "targetComponent": "d1", "targetPin": "d1_a"},
                    {"id": "c3", "sourceComponent": "d1", "sourcePin": "d1_k", "targetComponent": "v1", "targetPin": "v1_n"}
                ],
                "explanation": "This is an LED circuit. A battery powers the LED, and a resistor is connected in series to limit the current."
            }
        else:
            return {
                "id": "gen_mock",
                "name": "Voltage Divider",
                "components": [
                    {"id": "v1", "type": "DC Source", "reference": "V1", "value": "12", "unit": "V", "pins": [{"id": "v1_p"}, {"id": "v1_n"}], "position": {"x": 100, "y": 200}},
                    {"id": "r1", "type": "Resistor", "reference": "R1", "value": "4.7k", "unit": "Ω", "pins": [{"id": "r1_1"}, {"id": "r1_2"}], "position": {"x": 250, "y": 100}},
                    {"id": "r2", "type": "Resistor", "reference": "R2", "value": "10k", "unit": "Ω", "pins": [{"id": "r2_1"}, {"id": "r2_2"}], "position": {"x": 400, "y": 200}}
                ],
                "connections": [
                    {"id": "c1", "sourceComponent": "v1", "sourcePin": "v1_p", "targetComponent": "r1", "targetPin": "r1_1"},
                    {"id": "c2", "sourceComponent": "r1", "sourcePin": "r1_2", "targetComponent": "r2", "targetPin": "r2_1"},
                    {"id": "c3", "sourceComponent": "r2", "sourcePin": "r2_2", "targetComponent": "v1", "targetPin": "v1_n"}
                ],
                "explanation": "This is a voltage divider circuit. R1 and R2 form a series connection across the 12V source."
            }
