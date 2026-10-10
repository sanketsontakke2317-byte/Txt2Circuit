import sys
import os
import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from navigation.circuit_router import CircuitRouter

app = FastAPI(title="Txt2Circuit Batch Webhook Listener")
router = CircuitRouter()

class BatchRequest(BaseModel):
    prompts: List[str]
    target_platform: str = "SPICE"

def process_batch(prompts: List[str], target: str):
    """Background task to process a queue of text prompts."""
    print(f"Starting batch processing of {len(prompts)} prompts...")
    for i, prompt in enumerate(prompts):
        print(f"--- Processing Job {i+1}/{len(prompts)} ---")
        augmented_prompt = f"{prompt}\n\nConstraint: Target output format is {target}."
        
        # Isolated sandbox execution wrapper could be implemented here via subprocess
        # For now, it runs synchronously via the router
        result = router.process_request(augmented_prompt)
        
        if result.get("status") == "SUCCESS":
            print(f"Job {i+1} SUCCESS. Project: {result.get('project_name', 'Unknown')}")
        else:
            print(f"Job {i+1} FAILED. Status: {result.get('status')}")

@app.post("/webhook/batch-synthesize")
async def trigger_batch_synthesis(request: BatchRequest, background_tasks: BackgroundTasks):
    """
    Webhook endpoint to receive an array of natural language prompts
    and trigger batch processing in the background.
    """
    if not request.prompts:
        raise HTTPException(status_code=400, detail="Prompts list cannot be empty.")
        
    background_tasks.add_task(process_batch, request.prompts, request.target_platform)
    return {"status": "Accepted", "message": f"Queued {len(request.prompts)} synthesis jobs for background processing."}

if __name__ == "__main__":
    # Start the webhook listener on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
