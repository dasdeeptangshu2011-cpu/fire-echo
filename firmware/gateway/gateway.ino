#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID "7b6f0001-6d1e-4e5a-9a31-464952452d01"
#define TELEMETRY_UUID "7b6f0002-6d1e-4e5a-9a31-464952452d01"
#define COMMAND_UUID "7b6f0003-6d1e-4e5a-9a31-464952452d01"
#define STATUS_UUID "7b6f0004-6d1e-4e5a-9a31-464952452d01"

BLECharacteristic* statusChar;
class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    String command=c->getValue().c_str();
    Serial.println(command);
    statusChar->setValue("{\"type\":\"ack\",\"status\":\"ACCEPTED\"}");
    statusChar->notify();
  }
};
void setup(){
  Serial.begin(115200);
  BLEDevice::init("FIRE-ECHO-GATEWAY");
  BLEServer* server=BLEDevice::createServer();
  BLEService* service=server->createService(SERVICE_UUID);
  BLECharacteristic* telemetry=service->createCharacteristic(TELEMETRY_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);
  telemetry->addDescriptor(new BLE2902());
  BLECharacteristic* command=service->createCharacteristic(COMMAND_UUID,BLECharacteristic::PROPERTY_WRITE);
  command->setCallbacks(new CommandCallbacks());
  statusChar=service->createCharacteristic(STATUS_UUID,BLECharacteristic::PROPERTY_READ|BLECharacteristic::PROPERTY_NOTIFY);
  statusChar->addDescriptor(new BLE2902());
  service->start();
  BLEAdvertising* adv=BLEDevice::getAdvertising();adv->addServiceUUID(SERVICE_UUID);adv->start();
  statusChar->setValue("{\"type\":\"status\",\"state\":\"READY\"}");statusChar->notify();
}
void loop(){
  // The gateway deliberately sends no fabricated sensor values. A real implementation
  // should aggregate packets from the selected sentinel transport here.
  delay(1000);
}
