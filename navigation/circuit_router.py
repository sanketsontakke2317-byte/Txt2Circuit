import json
import sys
import os

# Append the parent directory to sys.path to import tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.llm_client import LLMClient
from tools.netlist_validator import NetlistValidator

class CircuitRouter:
    def __init__(self):
        self.llm = LLMClient()
        self.validator = NetlistValidator()
        self.max_retries = 3

    def process_request(self, user_prompt: str) -> dict:
        """
        Navigation layer logic: 
        Accepts the prompt, calls LLM, and triggers self-correction loop if DRC fails.
        """
        current_prompt = user_prompt
        attempts = 0
        
        print(f"[Router] Initiating Txt2Circuit generation pipeline...")

        while attempts <= self.max_retries:
            print(f"\n[Router] --- Synthesis Attempt {attempts + 1}/{self.max_retries + 1} ---")
            
            # 1. Synthesis Phase
            payload = self.llm.generate_netlist(current_prompt)
            
            if "error" in payload:
                print(f"[Router] FATAL: LLM API Error - {payload['error']}")
                return {"status": "FATAL_ERROR", "details": payload}
                
            # 2. Validation Phase
            validation_result = self.validator.validate(payload)
            
            if not validation_result:
                print("[Router] SUCCESS: Netlist passed DRC and syntax validation.")
                payload["status"] = "SUCCESS"
                return payload
                
            # 3. Self-Correction Loop Phase
            print("[Router] WARNING: Validation Failed. Defect log:")
            for err in validation_result.get("validation_errors", []):
                print(f"  -> {err}")
                
            if attempts == self.max_retries:
                print("[Router] ERROR: Maximum retries reached. Outputting failed payload.")
                payload["status"] = "DRC_VIOLATION"
                payload["diagnostic_logs"] = validation_result.get("validation_errors", [])
                return payload
                
            print("[Router] Constructing self-correction prompt and rerouting to LLM...")
            
            error_feedback = json.dumps(validation_result, indent=2)
            current_prompt = (
                f"Your previous netlist generation failed Design Rule Checks (DRC) with the following errors:\n"
                f"{error_feedback}\n\n"
                f"Please regenerate the netlist and fix these specific structural errors. "
                f"Original request: {user_prompt}"
            )
            
            attempts += 1

if __name__ == "__main__":
    router = CircuitRouter()
    # Dummy test to run through the router directly
    result = router.process_request('{"user_prompt": "Generate a Basic Hover Pad."}')
    print("\n[Router] Final Output Dump:")
    print(json.dumps(result, indent=2))
