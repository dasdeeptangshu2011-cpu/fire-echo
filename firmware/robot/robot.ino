// FIRE-ECHO mobile verification robot starter.
// The ESP32 receives a mission from the BLE gateway and performs local obstacle handling.

String mission = "STANDBY";

void setup() {
  Serial.begin(115200);
  Serial.println("FIRE-ECHO ROBOT READY");
}

void loop() {
  // Replace Serial input with the BLE command characteristic in the assembled robot.
  if (Serial.available()) {
    mission = Serial.readStringUntil('\n');
    mission.trim();
    Serial.print("{\"type\":\"ack\",\"command\":\"");
    Serial.print(mission);
    Serial.println("\",\"status\":\"ACCEPTED\"}");
  }

  // Navigation remains local to the robot: read obstacle sensors, adjust motor outputs,
  // and stop safely if the path is blocked. The app supplies the mission target.
  delay(50);
}
