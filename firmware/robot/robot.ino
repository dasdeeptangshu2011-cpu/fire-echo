#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID "7b6f0001-6d1e-4e5a-9a31-464952452d01"
#define COMMAND_UUID "7b6f0003-6d1e-4e5a-9a31-464952452d01"
#define STATUS_UUID "7b6f0004-6d1e-4e5a-9a31-464952452d01"

BLECharacteristic* statusChar;
String mission="STANDBY";
volatile bool emergencyStop=false;

void acknowledge(const String& command,const char* status){
  String packet=String("{\"type\":\"ack\",\"command\":\"")+command+"\",\"status\":\""+status+"\"}";
  statusChar->setValue(packet.c_str());statusChar->notify();Serial.println(packet);
}
class CommandCallbacks: public BLECharacteristicCallbacks{
  void onWrite(BLECharacteristic* c) override{
    String command=c->getValue().c_str();
    if(command.indexOf("STOP")>=0){emergencyStop=true;mission="STOPPED";acknowledge(command,"STOPPED");return;}
    if(emergencyStop){acknowledge(command,"BLOCKED_BY_EMERGENCY_STOP");return;}
    mission=command;acknowledge(command,"ACCEPTED");
  }
};
void setup(){
  Serial.begin(115200);
  // Configure actual motor, obstacle and environmental sensor pins here after BOM selection.
  BLEDevice::init("FIRE-ECHO-ROBOT-R01");
  BLEServer* server=BLEDevice::createServer();
  BLEService* service=server->createService(SERVICE_UUID);
  BLECharacteristic* command=service->createCharacteristic(COMMAND_UUID,BLECharacteristic::PROPERTY_WRITE);
  command->setCallbacks(new CommandCallbacks());
  statusChar=service->createCharacteristic(STATUS_UUID,BLECharacteristic::PROPERTY_NOTIFY|BLECharacteristic::PROPERTY_READ);
  statusChar->addDescriptor(new BLE2902());
  service->start();BLEAdvertising* adv=BLEDevice::getAdvertising();adv->addServiceUUID(SERVICE_UUID);adv->start();
  acknowledge("BOOT","READY");
}
void loop(){
  // Physical navigation must remain local to the robot. Read obstacle sensors before
  // every motor command and stop motors on obstacle detection or emergencyStop.
  // No motor pins are activated in this starter until the physical BOM is configured.
  delay(50);
}
