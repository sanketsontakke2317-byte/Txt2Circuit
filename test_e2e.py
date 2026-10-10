import requests
import json
import time

API_URL = "http://localhost:5000/api"

def run_test(name, prompt):
    print(f"\n--- Running Test {name}: {prompt} ---")
    try:
        start = time.time()
        res = requests.post(f"{API_URL}/process_prompt", json={"prompt": prompt})
        end = time.time()
        
        print(f"Status Code: {res.status_code}, Time: {end-start:.2f}s")
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success":
                circuit = data.get("circuit", {})
                print(f"Success! Name: {circuit.get('name')}")
                print(f"Components: {len(circuit.get('components', []))}")
                print(f"Connections: {len(circuit.get('connections', []))}")
                print(f"AI Explanation: {data.get('ai_explanation')[:100]}...")
                
                # Test chat context
                print(f"Testing Chat context for {name}...")
                chat_res = requests.post(f"{API_URL}/chat", json={
                    "message": "Explain the purpose of the components",
                    "circuit": circuit
                })
                print(f"Chat Response: {chat_res.json().get('reply')[:100]}...")
            else:
                print(f"API Error: {data}")
        else:
            print(f"HTTP Error: {res.text}")
    except Exception as e:
        print(f"Exception: {e}")

# Mandatory tests
run_test("A - LED Circuit", "Create an LED circuit using a 9V battery.")
run_test("B - Bridge Rectifier", "Create a bridge rectifier with four 1N4007 diodes, a 1000µF smoothing capacitor and a 1kΩ load.")
run_test("C - RC Low-pass filter", "Create an RC low-pass filter with a cutoff frequency of 1kHz.")
run_test("D - Transistor switching circuit", "Create an NPN transistor switching circuit using BC547.")
run_test("E - Op-amp circuit", "Create an inverting amplifier using an op-amp.")
