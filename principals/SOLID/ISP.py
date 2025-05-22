from abc import ABC, abstractmethod

# 역할에 따라 인터페이스 분리
class IMachine(ABC):
    @abstractmethod
    def start_machine(self):
        pass

    @abstractmethod
    def stop_machine(self):
        pass

class IPrinter(ABC):
    @abstractmethod
    def print_document(self, document):
        pass

class IStapler(ABC):
    @abstractmethod
    def staple_document(self, document):
        pass

# 클래스들은 필요한 인터페이스만 선택적으로 구현
class SimplePrinter(IMachine, IPrinter): # 기계 기능과 프린터 기능만 구현
    def start_machine(self):
        print("SimplePrinter: ON")

    def stop_machine(self):
        print("SimplePrinter: OFF")

    def print_document(self, document):
        print(f"SimplePrinter: Printing '{document}'")

class AdvancedPrinterStapler(IMachine, IPrinter, IStapler): # 모든 기능 구현
    def start_machine(self):
        print("AdvancedPrinterStapler: ON")

    def stop_machine(self):
        print("AdvancedPrinterStapler: OFF")

    def print_document(self, document):
        print(f"AdvancedPrinterStapler: Printing '{document}'")

    def staple_document(self, document):
        print(f"AdvancedPrinterStapler: Stapling '{document}'")

# 클라이언트 코드
# def basic_print_job(printer: IPrinter, machine_control: IMachine, doc): # 필요한 인터페이스만 요구
#     machine_control.start_machine()
#     printer.print_document(doc)
#     machine_control.stop_machine()

# def advanced_print_and_staple_job(device: (IPrinter, IMachine, IStapler), doc): # 모든 기능 요구
#     device.start_machine()
#     device.print_document(doc)
#     device.staple_document(doc)
#     device.stop_machine()


# my_simple_printer = SimplePrinter()
# basic_print_job(my_simple_printer, my_simple_printer, "MySimpleReport.docx")

# my_advanced_device = AdvancedPrinterStapler()
# basic_print_job(my_advanced_device, my_advanced_device, "MyAdvancedReport_no_staple.docx")
# advanced_print_and_staple_job(my_advanced_device, "MyAdvancedReport_with_staple.docx")

# 타입 힌팅을 더 명확히 하기 위해 Protocol을 사용하거나, 클라이언트가 하나의 객체를 여러 인터페이스로 다룰 수 있음
# def process_printable_machine(device: (IMachine & IPrinter), doc): # Python 3.8+ Protocol
#     device.start_machine()
#     device.print_document(doc)
#     device.stop_machine()

# process_printable_machine(my_simple_printer, "Test.doc")
# process_printable_machine(my_advanced_device, "Test.doc")