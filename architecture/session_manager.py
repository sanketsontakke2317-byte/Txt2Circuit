import uuid
from typing import Dict, List

class SessionManager:
    """
    State manager for multi-turn conversational circuit editing.
    Maintains isolated environments for active netlists, spatial metadata, and chat histories.
    """
    def __init__(self):
        # In-memory storage dictionary. 
        # For production scalability, this should interface with Redis or a NoSQL DB.
        self.sessions: Dict[str, dict] = {}

    def create_session(self) -> str:
        """Initializes a new isolated session with a unique UUID."""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "active_netlist": {},
            "spatial_metadata": {},
            "chat_history": []
        }
        return session_id

    def get_session(self, session_id: str) -> dict:
        """Retrieves active session state or raises an error if invalid."""
        if session_id not in self.sessions:
            raise ValueError(f"CRITICAL: Session ID {session_id} not found. Cross-contamination prevented.")
        return self.sessions[session_id]

    def commit_state(self, session_id: str, new_netlist: dict, spatial_metadata: dict):
        """Commits a DRC-validated netlist and layout to the active session state."""
        session = self.get_session(session_id)
        session["active_netlist"] = new_netlist
        session["spatial_metadata"] = spatial_metadata

    def append_chat(self, session_id: str, role: str, message: str, sliding_window_limit: int = 10):
        """
        Appends messages to the session's conversational history.
        Enforces a sliding window to prevent exceeding LLM context limits.
        """
        session = self.get_session(session_id)
        session["chat_history"].append({"role": role, "content": message})
        
        # Enforce sliding window
        if len(session["chat_history"]) > sliding_window_limit:
            # Keep the oldest entry (system prompt context if applicable) 
            # and slice the most recent N messages
            session["chat_history"] = session["chat_history"][-sliding_window_limit:]

if __name__ == "__main__":
    print("Session Manager Scaffold Initialized.")
