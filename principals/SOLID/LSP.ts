// // LSP 위반
// // 금쪽이 엄마가 자식의 특성을 무시하고 규칙을 세웠다.
// class Rectangle {
//     // protected 키워드를 사용해 하위 클래스에서 접근 가능하도록 함
//     protected width: number
//     protected height: number

//     constructor(width: number, height: number) {
//       this.width = width
//       this.height = height
//     }

//     // 너비 설정
//     public setWidth(width: number): void {
//       this.width = width
//     }

//     // 높이 설정
//     public setHeight(height: number): void {
//       this.height = height
//     }

//     // 너비 반환
//     public getWidth(): number {
//       return this.width
//     }

//     // 높이 반환
//     public getHeight(): number {
//       return this.height
//     }

//     // 넓이 계산
//     public getArea(): number {
//       return this.width * this.height
//     }
//   }

//   // 자식은 그렇게 생겨먹어서 엄마가 세운 규칙을 따르는게 불가능하다.
//   class Square extends Rectangle {
//     constructor(size: number) {
//       // 정사각형은 너비와 높이가 같으므로 size로 초기화
//       super(size, size)
//     }

//     // 정사각형의 너비를 설정하면 높이도 함께 변경되어야 함
//     // 이는 Rectangle의 setWidth가 높이에 영향을 주지 않는다는 암묵적 계약을 위반
//     public setWidth(width: number): void {
//       this.width = width
//       this.height = width // 부작용: 높이도 변경됨
//     }

//     // 정사각형의 높이를 설정하면 너비도 함께 변경되어야 함
//     // 이는 Rectangle의 setHeight가 너비에 영향을 주지 않는다는 암묵적 계약을 위반
//     public setHeight(height: number): void {
//       this.height = height
//       this.width = height // 부작용: 너비도 변경됨
//     }
//   }

//   // 클라이언트 코드 예시
//   function printAreaDetails(rectangle: Rectangle) {
//     // rectangle 파라미터는 Rectangle 타입이므로,
//     // 클라이언트는 Rectangle의 행동 규약을 기대함
//     rectangle.setWidth(5)
//     rectangle.setHeight(10)
//     // 클라이언트는 너비 5, 높이 10으로 설정했으므로 넓이가 50일 것이라고 기대
//     console.log(`기대 넓이: 50, 실제 넓이: ${rectangle.getArea()}`)
//     if (rectangle.getArea() !== 50) {
//       console.error('LSP 위반! Rectangle의 행동 규약과 다르게 동작합니다.')
//       console.log(
//         ` - 실제 너비: ${rectangle.getWidth()}, 실제 높이: ${rectangle.getHeight()}`
//       )
//     }
//   }

//   const rect = new Rectangle(2, 3)
//   printAreaDetails(rect) // 기대 넓이: 50, 실제 넓이: 50

//   const square = new Square(2)
//   printAreaDetails(square)
// 기대 넓이: 50, 실제 넓이: 100 (setWidth(5)로 너비/높이 5, setHeight(10)로 너비/높이 10이 됨)
// LSP 위반! Rectangle의 행동 규약과 다르게 동작합니다.
//  - 실제 너비: 10, 실제 높이: 10

// LSP 만족
// 공통적인 도형의 기능을 정의하는 인터페이스
// 하희라씨는 자식들의 공통적인 특성을 고려하여 규칙을 세웠다.
interface Shape {
  getArea(): number
}
// 자식은 엄마의 규칙을 따르는게 자기자신을 모순하지 않기 때문에 지킬 수 있다.
class Rectangle implements Shape {
  private width: number
  private height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  public setWidth(width: number): void {
    this.width = width
  }

  public setHeight(height: number): void {
    this.height = height
  }

  public getArea(): number {
    return this.width * this.height
  }
}

// 자식은 엄마의 규칙을 따르는게 자기자신을 모순하지 않기 때문에 지킬 수 있다.
class Square implements Shape {
  private size: number

  constructor(size: number) {
    this.size = size
  }

  // Square는 size만 변경 가능
  public setSize(size: number): void {
    this.size = size
  }

  public getArea(): number {
    return this.size * this.size
  }
}

// 클라이언트 코드는 Shape 인터페이스에 의존하여 넓이를 구함
function printShapeArea(shape: Shape) {
  console.log(`도형의 넓이: ${shape.getArea()}`)
}

const rectShape = new Rectangle(5, 10)
printShapeArea(rectShape) // 도형의 넓이: 50

const squareShape = new Square(5)
printShapeArea(squareShape) // 도형의 넓이: 25

// 만약 너비/높이 설정이 필요하다면, 클라이언트는 구체 타입을 확인하거나
// 다른 인터페이스(예: ResizableRectangle)를 사용해야 함.
// function adjustAndPrintRectangle(rect: Rectangle) {
//   rect.setWidth(4);
//   rect.setHeight(8);
//   console.log(`조정된 사각형 넓이: ${rect.getArea()}`);
// }
// adjustAndPrintRectangle(rectShape);
