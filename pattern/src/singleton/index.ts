// src/singleton_central_bank/index.ts

/**
 * CentralBank 클래스 (싱글턴)
 *
 * 이 클래스는 애플리케이션 전체에서 단 하나의 인스턴스만 생성되도록 보장합니다.
 * 국가의 중앙 은행과 같이, 유일하게 존재해야 하는 시스템 구성 요소를 나타낼 때 사용될 수 있습니다.
 */
class CentralBank {
  /**
   * 유일한 CentralBank 인스턴스를 저장하기 위한 정적 멤버 변수입니다.
   * 이 변수는 클래스 자체에 속하며, 인스턴스가 아닌 클래스를 통해 접근합니다.
   * 초기값은 null로 설정하여, 아직 인스턴스가 생성되지 않았음을 나타냅니다.
   */
  private static instance: CentralBank | null = null

  /**
   * 중앙 은행의 정보를 저장하는 예시 멤버 변수입니다.
   */
  private country: string
  private currency: string
  private interestRate: number

  /**
   * 생성자를 'private'으로 선언합니다.
   * 이렇게 하면 외부에서 `new CentralBank()`와 같이 직접 인스턴스를 생성하는 것을 방지합니다.
   * 오직 클래스 내부의 정적 메서드 `getInstance()`를 통해서만 인스턴스에 접근할 수 있습니다.
   * @param country 은행이 속한 국가
   * @param currency 해당 국가의 통화
   */
  private constructor(country: string, currency: string) {
    this.country = country
    this.currency = currency
    this.interestRate = 0.0 // 초기 기준 금리
    console.log(
      `[CentralBank] ${this.country}의 중앙 은행이 설립되었습니다. (통화: ${this.currency})`
    )
    // 실제로는 여기서 데이터베이스 연결, 설정 파일 로드 등의 초기화 작업을 수행할 수 있습니다.
  }

  /**
   * CentralBank의 유일한 인스턴스를 반환하는 정적 메서드입니다.
   *
   * 이 메서드는 처음 호출될 때만 새로운 CentralBank 인스턴스를 생성하고,
   * 그 이후의 호출에서는 이미 생성된 인스턴스를 반환합니다.
   * 이를 통해 애플리케이션 전체에서 단 하나의 CentralBank 인스턴스만 사용됨을 보장합니다.
   *
   * @param country (선택적) 최초 생성 시 국가 이름
   * @param currency (선택적) 최초 생성 시 통화 이름
   * @returns {CentralBank} 유일한 CentralBank 인스턴스
   */
  public static getInstance(
    country: string = '대한민국',
    currency: string = 'KRW'
  ): CentralBank {
    // `CentralBank.instance`가 아직 null (즉, 인스턴스가 생성되지 않음)인 경우에만 새 인스턴스를 생성합니다.
    if (!CentralBank.instance) {
      // `new CentralBank()` 호출은 private 생성자이므로 클래스 내부에서는 가능합니다.
      CentralBank.instance = new CentralBank(country, currency)
    }
    // 이미 생성된 인스턴스가 있다면, 해당 인스턴스를 반환합니다.
    return CentralBank.instance
  }

  /**
   * 기준 금리를 설정하는 메서드입니다.
   * @param rate 새로운 기준 금리
   */
  public setInterestRate(rate: number): void {
    this.interestRate = rate
    console.log(
      `[CentralBank] ${this.country}의 기준 금리가 ${rate}%로 변경되었습니다.`
    )
  }

  /**
   * 현재 기준 금리를 가져오는 메서드입니다.
   * @returns 현재 기준 금리
   */
  public getInterestRate(): number {
    return this.interestRate
  }

  /**
   * 은행 정보를 출력하는 메서드입니다.
   */
  public displayBankInfo(): void {
    console.log(
      `--- ${this.country} 중앙 은행 정보 ---
        통화: ${this.currency}
        현재 기준 금리: ${this.interestRate}%
        --------------------------`
    )
  }
}

// --- 싱글턴 패턴 사용 예시 ---

// CentralBank.getInstance()를 통해 중앙 은행 인스턴스를 얻습니다.
// 이 시점에 생성자가 호출되어 인스턴스가 생성됩니다. (최초 1회)
const bankOfKorea = CentralBank.getInstance('대한민국', '원')
bankOfKorea.setInterestRate(1.5)

// 다시 CentralBank.getInstance()를 호출해도 새로운 인스턴스가 생성되지 않습니다.
// 이전에 생성된 동일한 인스턴스가 반환됩니다.
// 다른 매개변수를 전달해도, 이미 인스턴스가 존재하면 무시됩니다. (일반적인 싱글턴 구현 방식)
const anotherInstanceOfBank = CentralBank.getInstance('미국', '달러')

console.log(
  `bankOfKorea와 anotherInstanceOfBank는 같은 중앙 은행인가? ${
    bankOfKorea === anotherInstanceOfBank
  }`
) // true

console.log(
  `anotherInstanceOfBank에서 확인한 기준 금리: ${anotherInstanceOfBank.getInterestRate()}%`
) // 1.5% (bankOfKorea에서 설정한 값)

anotherInstanceOfBank.setInterestRate(1.75)

bankOfKorea.displayBankInfo()
// 출력 결과:
// [CentralBank] 대한민국의 중앙 은행이 설립되었습니다. (통화: 원)
// [CentralBank] 대한민국의 기준 금리가 1.5%로 변경되었습니다.
// bankOfKorea와 anotherInstanceOfBank는 같은 중앙 은행인가? true
// anotherInstanceOfBank에서 확인한 기준 금리: 1.5%
// [CentralBank] 대한민국의 기준 금리가 1.75%로 변경되었습니다.
// --- 대한민국 중앙 은행 정보 ---
//       통화: 원
//       현재 기준 금리: 1.75%
//       --------------------------

// 직접 new 키워드로 생성하려고 하면 TypeScript 컴파일 에러 발생
// const illegalBank = new CentralBank("일본", "엔"); // 오류: 'CentralBank' 클래스의 생성자는 private이며 클래스 선언 내에서만 액세스할 수 있습니다.

export { CentralBank }
