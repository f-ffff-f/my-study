### DIP 위반

class LightBulb: # 하위 수준 모듈 (구체적인 구현)
    def turn_on(self):
        print("LightBulb: Turned ON")

    def turn_off(self):
        print("LightBulb: Turned OFF")

class ElectricPowerSwitch: # 상위 수준 모듈
    def __init__(self):
        self.bulb = LightBulb() # 하위 수준 모듈의 구체적인 클래스에 직접 의존
        self.on = False

    def press(self):
        if self.on:
            self.bulb.turn_off()
            self.on = False
        else:
            self.bulb.turn_on()
            self.on = True

# 사용 예
# switch = ElectricPowerSwitch()
# switch.press() # LightBulb 켜짐
# switch.press() # LightBulb 꺼짐

### DIP 준수

from abc import ABC, abstractmethod

class Switchable(ABC): # 추상화 (인터페이스)
    @abstractmethod
    def activate(self):
        pass

    @abstractmethod
    def deactivate(self):
        pass

class LightBulb(Switchable): # 하위 수준 모듈 (추상화 구현)
    def activate(self):
        print("LightBulb: Turned ON")

    def deactivate(self):
        print("LightBulb: Turned OFF")

class Fan(Switchable): # 또 다른 하위 수준 모듈
    def activate(self):
        print("Fan: Turned ON")

    def deactivate(self):
        print("Fan: Turned OFF")

class ElectricPowerSwitch: # 상위 수준 모듈
    def __init__(self, device: Switchable): # 추상화(Switchable)에 의존 (의존성 주입)
        self.device = device
        self.on = False

    def press(self):
        if self.on:
            self.device.deactivate()
            self.on = False
        else:
            self.device.activate()
            self.on = True

# 사용 예
# bulb = LightBulb()
# fan = Fan()

# switch_for_bulb = ElectricPowerSwitch(bulb)
# switch_for_bulb.press() # LightBulb 켜짐

# switch_for_fan = ElectricPowerSwitch(fan)
# switch_for_fan.press() # Fan 켜짐