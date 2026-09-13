#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// FIRE-ECHO 2.0 Sentinel — Arduino IDE + ESP32.
// Sensor readers are explicit placeholders until the selected physical modules are wired.
const char* NODE_ID = "S01";
const char* SERVICE_UUID = "7b6f0001-6d1e-4e5a-9a31-464952452d01";
const char* TELEMETRY_UUID = "7b6f0002-6d1e-4e5a-9a31-464952452d01";
BLECharacteristic* telemetry = nullptr;

float readTemperature(){ return NAN; }
float readHumidity(){ return NAN; }
int readSmoke(){ return -1; }
bool readFlame(){ return false; }
float readBattery(){ return -1; }

void setup(){
  Serial.begin(115200);
  BLEDevice::init(NODE_ID);
  BLEServer* server=BLEDevice::createServer();
  BLEService* service=server->createService(SERVICE_UUID);
  telemetry=service->createCharacteristic(TELEMETRY_UUID,BLECharacteristic::PROPERTY_NOTIFY|BLECharacteristic::PROPERTY_READ);
  telemetry->addDescriptor(new BLE2902());
  service->start();
  BLEAdvertising* advertising=BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();
}

void loop(){
  float temperature=readTemperature(),humidity=readHumidity(),battery=readBattery();
  int smoke=readSmoke();
  // Do not label unconnected sensors as real measurements.
  String packet=String("{\"type\":\"sentinel_telemetry\",\"deviceId\":\"")+NODE_ID+
    "\",\"timestamp\":"+String((unsigned long)millis())+
    ",\"temperature\":"+(isnan(temperature)?String("null"):String(temperature,1))+
    ",\"humidity\":"+(isnan(humidity)?String("null"):String(humidity,1))+
    ",\"smoke\":"+String(smoke)+
    ",\"flame\":"+(readFlame()?String("true"):String("false"))+
    ",\"battery\":"+(battery<0?String("null"):String(battery,0))+
    ",\"signal\":0}";
  telemetry->setValue(packet.c_str());
  telemetry->notify();
  Serial.println(packet);
  delay(1000);
}
