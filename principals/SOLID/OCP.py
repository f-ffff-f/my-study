### OCP 위반
class PaymentProcessor:
    def process_payment(self, amount, method):
        if method == "credit_card":
            print(f"Processing credit card payment of ${amount}")
            # 신용카드 처리 로직...
        elif method == "paypal":
            print(f"Processing PayPal payment of ${amount}")
            # 페이팔 처리 로직...
        elif method == "bank_transfer": # 새로운 결제 방식 추가
            print(f"Processing bank transfer payment of ${amount}")
            # 계좌 이체 처리 로직...
        else:
            raise ValueError("Unsupported payment method")

# 사용 예
# processor = PaymentProcessor()
# processor.process_payment(100, "credit_card")
# processor.process_payment(50, "bank_transfer") # 새로운 방식 추가 시 PaymentProcessor 코드 변경 필요

### OCP 준수
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

class CreditCardPayment(PaymentStrategy):
    def pay(self, amount):
        print(f"Processing credit card payment of ${amount}")
        # 신용카드 처리 로직...

class PayPalPayment(PaymentStrategy):
    def pay(self, amount):
        print(f"Processing PayPal payment of ${amount}")
        # 페이팔 처리 로직...

class BankTransferPayment(PaymentStrategy): # 새로운 결제 방식 추가
    def pay(self, amount):
        print(f"Processing bank transfer payment of ${amount}")
        # 계좌 이체 처리 로직...

class PaymentProcessor:
    def process_payment(self, amount, strategy: PaymentStrategy):
        strategy.pay(amount)

# 사용 예
# credit_card_strategy = CreditCardPayment()
# paypal_strategy = PayPalPayment()
# bank_transfer_strategy = BankTransferPayment()

# processor = PaymentProcessor()
# processor.process_payment(100, credit_card_strategy)
# processor.process_payment(50, paypal_strategy)
# processor.process_payment(200, bank_transfer_strategy) # 기존 PaymentProcessor 코드 변경 없이 새 기능 사용