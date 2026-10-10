import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from tools.llm_client import LLMClient

llm = LLMClient()
print("Starting generation...")
res = llm.generate_circuit("half adder circuit")
print("Final Output:")
print(res)
