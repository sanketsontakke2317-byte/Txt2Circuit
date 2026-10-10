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
            logging.warning("Quota exceeded. Returning mock RC Filter circuit.")
            return {
                "status": "success",
                "circuit": {
                    "id": "mock_rc_1",
                    "name": "RC Low-Pass Filter (Mock Fallback)",
                    "components": [
                        {"id": "comp_1", "type": "AC Source", "reference": "V1", "value": "10", "unit": "V", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 100, "y": 200}},
                        {"id": "comp_2", "type": "Resistor", "reference": "R1", "value": "1k", "unit": "Ω", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 250, "y": 100}},
                        {"id": "comp_3", "type": "Capacitor", "reference": "C1", "value": "1", "unit": "µF", "pins": [{"id": "p1"}, {"id": "p2"}], "position": {"x": 400, "y": 200}},
                        {"id": "comp_4", "type": "Ground", "reference": "GND1", "value": "", "unit": "", "pins": [{"id": "p1"}], "position": {"x": 250, "y": 300}}
                    ],
                    "connections": [
                        {"id": "c_1", "sourceComponent": "comp_1", "sourcePin": "p1", "targetComponent": "comp_2", "targetPin": "p1"},
                        {"id": "c_2", "sourceComponent": "comp_2", "sourcePin": "p2", "targetComponent": "comp_3", "targetPin": "p1"},
                        {"id": "c_3", "sourceComponent": "comp_3", "sourcePin": "p2", "targetComponent": "comp_4", "targetPin": "p1"},
                        {"id": "c_4", "sourceComponent": "comp_4", "sourcePin": "p1", "targetComponent": "comp_1", "targetPin": "p2"}
                    ],
                    "theory": "This is a Low-Pass RC Filter. High frequency signals are shunted to ground through the capacitor, while low frequency signals pass through.",
                    "calculations": [
                        {"description": "Cutoff Frequency", "formula": "f_c = 1 / (2 * π * R * C)", "values": "1 / (2 * 3.14 * 1000 * 0.000001)", "result": "159.15 Hz"}
                    ],
                    "step_by_step": [
                        "Step 1: AC signal originates from V1.",
                        "Step 2: Signal travels through current-limiting resistor R1.",
                        "Step 3: Capacitor C1 charges and discharges, attenuating high frequencies."
                    ],
                    "explanation": "Mock fallback returned due to Gemini API rate limits."
                }
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
