from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from tools.llm_client import LLMClient

app = FastAPI()
llm = LLMClient()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str

class ChatRequest(BaseModel):
    message: str
    circuit: dict

@app.post("/api/process_prompt")
async def process_prompt(request: PromptRequest):
    prompt = request.prompt
    logging.info(f"Processing prompt: {prompt}")
    
    result = llm.generate_circuit(prompt)
    
    if "error" in result:
        if "429" in result["error"] or "quota" in result["error"].lower():
            logging.warning("Quota exceeded. Generating dynamic mock fallback circuit based on prompt.")
            prompt_lower = prompt.lower()
            
            mock_circuit = {
                "id": "mock_1",
                "name": "Generated Circuit (Mock Fallback)",
                "explanation": "Mock fallback returned due to Gemini API rate limits.",
                "components": [],
                "connections": [],
                "theory": "",
                "calculations": [],
                "step_by_step": []
            }

            if "rlc" in prompt_lower:
                mock_circuit["name"] = "RLC Circuit (Mock Fallback)"
                mock_circuit["components"] = [
                    {"id": "c_v1", "type": "AC Source", "reference": "V1", "value": "10", "unit": "V", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 200}},
                    {"id": "c_r1", "type": "Resistor", "reference": "R1", "value": "1k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 250, "y": 100}},
                    {"id": "c_l1", "type": "Inductor", "reference": "L1", "value": "10", "unit": "mH", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 400, "y": 100}},
                    {"id": "c_c1", "type": "Capacitor", "reference": "C1", "value": "1", "unit": "µF", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 550, "y": 200}},
                    {"id": "c_gnd", "type": "Ground", "reference": "GND1", "value": "", "unit": "", "pins": [{"id": "p1"}], "position": {"x": 250, "y": 300}}
                ]
                mock_circuit["connections"] = [
                    {"id": "w1", "sourceComponent": "c_v1", "sourcePin": "p1", "targetComponent": "c_r1", "targetPin": "p1"},
                    {"id": "w2", "sourceComponent": "c_r1", "sourcePin": "p2", "targetComponent": "c_l1", "targetPin": "p1"},
                    {"id": "w3", "sourceComponent": "c_l1", "sourcePin": "p2", "targetComponent": "c_c1", "targetPin": "p1"},
                    {"id": "w4", "sourceComponent": "c_c1", "sourcePin": "p2", "targetComponent": "c_gnd", "targetPin": "p1"},
                    {"id": "w5", "sourceComponent": "c_gnd", "sourcePin": "p1", "targetComponent": "c_v1", "targetPin": "p2"}
                ]
                mock_circuit["theory"] = "This is a series RLC circuit. It exhibits resonance at a specific frequency where inductive and capacitive reactances cancel out."
            
            elif "rl" in prompt_lower:
                mock_circuit["name"] = "RL Circuit (Mock Fallback)"
                mock_circuit["components"] = [
                    {"id": "c_v1", "type": "AC Source", "reference": "V1", "value": "10", "unit": "V", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 200}},
                    {"id": "c_r1", "type": "Resistor", "reference": "R1", "value": "1k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 250, "y": 100}},
                    {"id": "c_l1", "type": "Inductor", "reference": "L1", "value": "10", "unit": "mH", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 400, "y": 200}},
                    {"id": "c_gnd", "type": "Ground", "reference": "GND1", "value": "", "unit": "", "pins": [{"id": "p1"}], "position": {"x": 250, "y": 300}}
                ]
                mock_circuit["connections"] = [
                    {"id": "w1", "sourceComponent": "c_v1", "sourcePin": "p1", "targetComponent": "c_r1", "targetPin": "p1"},
                    {"id": "w2", "sourceComponent": "c_r1", "sourcePin": "p2", "targetComponent": "c_l1", "targetPin": "p1"},
                    {"id": "w3", "sourceComponent": "c_l1", "sourcePin": "p2", "targetComponent": "c_gnd", "targetPin": "p1"},
                    {"id": "w4", "sourceComponent": "c_gnd", "sourcePin": "p1", "targetComponent": "c_v1", "targetPin": "p2"}
                ]
                mock_circuit["theory"] = "This is an RL circuit. The inductor opposes changes in current, creating a phase shift between voltage and current."
            
            elif "not" in prompt_lower or "inverter" in prompt_lower:
                mock_circuit["name"] = "Transistor NOT Gate (Mock Fallback)"
                mock_circuit["components"] = [
                    {"id": "c_vcc", "type": "DC Source", "reference": "VCC", "value": "5", "unit": "V", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 50}},
                    {"id": "c_vin", "type": "DC Source", "reference": "VIN", "value": "5", "unit": "V", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 250}},
                    {"id": "c_rc", "type": "Resistor", "reference": "RC", "value": "1k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 300, "y": 100}},
                    {"id": "c_rb", "type": "Resistor", "reference": "RB", "value": "10k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 200, "y": 250}},
                    {"id": "c_q1", "type": "Transistor", "reference": "Q1", "value": "2N3904", "unit": "", "pins": [{"id": "p1"}, {"id": "p2"}, {"id": "p3"}], "position": {"x": 300, "y": 250}},
                    {"id": "c_gnd", "type": "Ground", "reference": "GND1", "value": "", "unit": "", "pins": [{"id": "p1"}], "position": {"x": 300, "y": 350}}
                ]
                # Assuming Transistor pins: p1=Collector, p2=Base, p3=Emitter
                mock_circuit["connections"] = [
                    {"id": "w1", "sourceComponent": "c_vcc", "sourcePin": "p1", "targetComponent": "c_rc", "targetPin": "p1"},
                    {"id": "w2", "sourceComponent": "c_rc", "sourcePin": "p2", "targetComponent": "c_q1", "targetPin": "p1"},
                    {"id": "w3", "sourceComponent": "c_vin", "sourcePin": "p1", "targetComponent": "c_rb", "targetPin": "p1"},
                    {"id": "w4", "sourceComponent": "c_rb", "sourcePin": "p2", "targetComponent": "c_q1", "targetPin": "p2"},
                    {"id": "w5", "sourceComponent": "c_q1", "sourcePin": "p3", "targetComponent": "c_gnd", "targetPin": "p1"},
                    {"id": "w6", "sourceComponent": "c_gnd", "sourcePin": "p1", "targetComponent": "c_vcc", "targetPin": "p2"},
                    {"id": "w7", "sourceComponent": "c_gnd", "sourcePin": "p1", "targetComponent": "c_vin", "targetPin": "p2"}
                ]
                mock_circuit["theory"] = "This is a basic Transistor Inverter (NOT gate). When VIN is HIGH (5V), the transistor turns ON, pulling the output at the collector LOW (~0V). When VIN is LOW (0V), the transistor is OFF, and the output is pulled HIGH to VCC by RC."
            
            else:
                mock_circuit["name"] = "RC Low-Pass Filter (Mock Fallback)"
                mock_circuit["components"] = [
                    {"id": "c_v1", "type": "AC Source", "reference": "V1", "value": "10", "unit": "V", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 200}},
                    {"id": "c_r1", "type": "Resistor", "reference": "R1", "value": "1k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 250, "y": 100}},
                    {"id": "c_c1", "type": "Capacitor", "reference": "C1", "value": "1", "unit": "µF", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 400, "y": 200}},
                    {"id": "c_gnd", "type": "Ground", "reference": "GND1", "value": "", "unit": "", "pins": [{"id": "p1"}], "position": {"x": 250, "y": 300}}
                ]
                mock_circuit["connections"] = [
                    {"id": "w1", "sourceComponent": "c_v1", "sourcePin": "p1", "targetComponent": "c_r1", "targetPin": "p1"},
                    {"id": "w2", "sourceComponent": "c_r1", "sourcePin": "p2", "targetComponent": "c_c1", "targetPin": "p1"},
                    {"id": "w3", "sourceComponent": "c_c1", "sourcePin": "p2", "targetComponent": "c_gnd", "targetPin": "p1"},
                    {"id": "w4", "sourceComponent": "c_gnd", "sourcePin": "p1", "targetComponent": "c_v1", "targetPin": "p2"}
                ]
                mock_circuit["theory"] = "This is a Low-Pass RC Filter. High frequency signals are shunted to ground through the capacitor, while low frequency signals pass through."
                mock_circuit["calculations"] = [
                    {"description": "Cutoff Frequency", "formula": "f_c = 1 / (2 * π * R * C)", "values": "1 / (2 * 3.14 * 1000 * 0.000001)", "result": "159.15 Hz"}
                ]

            return {
                "status": "success",
                "circuit": mock_circuit
            }
        return {"status": "error", "message": result["error"]}

    return {
        "status": "success",
        "circuit": {
            "id": result.get("id", "gen_1"),
            "name": result.get("name", "Generated Circuit"),
            "components": result.get("components", []),
            "connections": result.get("connections", []),
            "theory": result.get("theory", ""),
            "calculations": result.get("calculations", []),
            "step_by_step": result.get("step_by_step", []),
            "explanation": result.get("explanation", ""),
            "currentVersion": 1
        }
    }

@app.post("/api/simulate")
async def simulate(request: Request):
    circuit = await request.json()
    return {
        "status": "success",
        "results": {
            "type": "dc",
            "voltages": {"n1": 12.0, "n2": 8.16},
            "currents": {"v1": -0.00082},
            "power": {"r1": 0.0031, "r2": 0.0067}
        }
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    message = request.message
    circuit = request.circuit
    logging.info(f"Chat message: {message}")
    
    result = llm.modify_circuit(message, circuit)
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    
    return {
        "status": "success",
        "reply": result.get("reply", "I have updated the circuit."),
        "circuit": result.get("circuit") # may be None if it's just a conversation
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
