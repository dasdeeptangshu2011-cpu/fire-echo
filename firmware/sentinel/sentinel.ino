// FIRE-ECHO stationary sentinel starter for Arduino IDE + ESP32.
// Replace the safe demo values with the exact sensors used in the prototype.

const char *SENTINEL_ID = "S-01";
const float X = 18.0;
const float Y = 25.0;

void setup() {
  Serial.begin(115200);
}

void loop() {
  // Safe synthetic values until the physical sensor modules are wired.
  float temperature = 29.5;
  float humidity = 67.0;
  int smokeIndex = 7;
  float flameIndex = 0.0;
  int battery = 96;

  Serial.printf(
    "{\"type\":\"telemetry\",\"source\":\"REAL\",\"sentinel\":\"%s\",\"x\":%.1f,\"y\":%.1f,\"temperature\":%.1f,\"humidity\":%.1f,\"smoke\":%d,\"flame\":%.2f,\"battery\":%d}\n",
    SENTINEL_ID, X, Y, temperature, humidity, smokeIndex, flameIndex, battery
  );
  delay(2000);
}
