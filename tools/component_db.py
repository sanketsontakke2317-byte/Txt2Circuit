import json
import os

class ComponentDatabase:
    """
    Structured JSON database engine for the Txt2Circuit component library.
    Acts as the strict source of truth for physical pin mapping, preventing LLM hallucinations.
    """
    def __init__(self, db_path: str = "components.json"):
        self.db_path = os.path.join(os.path.dirname(__file__), db_path)
        self.components = self._load_db()

    def _load_db(self) -> dict:
        """Loads the JSON component library. Scaffolds default library if missing."""
        if not os.path.exists(self.db_path):
            return self._scaffold_default_library()
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("[DB Error] Corrupt DB. Resetting to defaults.")
            return self._scaffold_default_library()

    def _scaffold_default_library(self) -> dict:
        """Initializes standard component schema (e.g. Arduino, OLED, Hover Pad parts)."""
        default_db = {
            "OLED_128x64_I2C": {
                "part_name": "0.96 inch OLED 128x64 I2C",
                "category": "Display",
                "svg_asset_path": "/assets/components/oled_i2c.svg",
                "pins": [
                    {"id": "GND", "type": "power", "direction": "in"},
                    {"id": "VCC", "type": "power", "direction": "in"},
                    {"id": "SCL", "type": "i2c_clock", "direction": "in"},
                    {"id": "SDA", "type": "i2c_data", "direction": "inout"}
                ]
            },
            "ARDUINO_UNO": {
                "part_name": "Arduino Uno R3",
                "category": "MCU",
                "svg_asset_path": "/assets/components/arduino_uno.svg",
                "pins": [
                    {"id": "5V", "type": "power", "direction": "out"},
                    {"id": "GND", "type": "power", "direction": "inout"},
                    {"id": "A4", "type": "i2c_data", "direction": "inout"},
                    {"id": "A5", "type": "i2c_clock", "direction": "out"}
                ]
            }
        }
        self.save_db(default_db)
        return default_db

    def save_db(self, data: dict = None):
        """Commits components back to the JSON file."""
        if data:
            self.components = data
        with open(self.db_path, "w") as f:
            json.dump(self.components, f, indent=4)

    def get_component(self, part_id: str) -> dict:
        """Retrieves a component's strict pinout data. Useful for the AI validation loop."""
        return self.components.get(part_id)

    def validate_pins(self, part_id: str, requested_pins: list) -> bool:
        """Validates if the LLM's requested pins physically exist on the component."""
        comp = self.get_component(part_id)
        if not comp:
            return False
        valid_pin_ids = [pin["id"] for pin in comp["pins"]]
        return all(pin in valid_pin_ids for pin in requested_pins)

    def add_custom_component(self, part_id: str, metadata: dict):
        """Endpoint for the Custom Component Builder UI (Step 3)."""
        self.components[part_id] = metadata
        self.save_db()

if __name__ == "__main__":
    db = ComponentDatabase()
    print("Component Database Scaffold Initialized.")
