// // ✅ 유틸리티 타입 총정리 주관식 퀴즈 (총 20문제)

// type TObj = { foo: string; bar?: number }
// type TUnion = 'foo' | 'bar' | null
// type TFunc = (foo: any, bar: any) => typeof foo
// class ClassFoo {
//   constructor(foo: any, bar: any) {}
// }

// // 1. 객체의 모든 필드를 선택적(Optional)으로 만드는 유틸리티 타입을 작성하라.
// type TPartial = Partial<TObj>
// // 2. 객체의 모든 필드를 필수로 만드는 유틸리티 타입을 작성하라.
// type TRequiered = Required<TObj>
// // 3. 객체의 모든 필드를 읽기 전용으로 만드는 유틸리티 타입을 작성하라.
// type TReadonly = Readonly<TObj>
// // 4. 특정 key만 뽑아 새 객체를 만드는 유틸리티 타입을 작성하라.
// type TPick = Pick<TObj, 'foo'>
// // 5. 특정 key만 제거한 새 객체를 만드는 유틸리티 타입을 작성하라.
// type TOmit = Omit<TObj, 'foo'>
// // 6. 유니언 타입에서 특정 타입을 제거하는 유틸리티 타입을 작성하라.
// type TExclude = Exclude<TUnion, 'foo'>
// // 7. 유니언 타입에서 특정 타입만 남기는 유틸리티 타입을 작성하라.
// type TExtract = Extract<TUnion, 'foo'>
// // 8. null과 undefined를 제거하는 유틸리티 타입을 작성하라.
// type TNonNullable = NonNullable<TUnion>
// // 9. 모든 key를 특정 값 타입으로 갖는 객체를 생성하는 유틸리티 타입을 작성하라.
// type TKeyToVal<T> = Record<keyof T, Number>
// type TAllNumber = TKeyToVal<TObj>
// // 10. 함수 타입의 리턴값을 추출하는 유틸리티 타입을 작성하라.
// type TReturnType = ReturnType<TFunc>
// // 11. 함수 타입의 인자들을 튜플로 추출하는 유틸리티 타입을 작성하라.
// type TParameter = Parameters<TFunc>
// // 12. 생성자 함수의 인자들을 튜플로 추출하는 유틸리티 타입을 작성하라.
// type TConParam = ConstructorParameters<typeof ClassFoo>
// // 13. 생성자 함수로부터 생성된 인스턴스 타입을 추출하는 유틸리티 타입을 작성하라.
// type TInstance = InstanceType<typeof ClassFoo>
// // 14. 함수 타입에서 this 타입만 추출하는 유틸리티 타입을 작성하라.
// type TFuncThis = ThisParameterType<TFunc>
// // 15. 함수 타입에서 this 타입을 제거하는 유틸리티 타입을 작성하라.
// type TFuncOmitThis = OmitThisParameter<TFunc>
// // 16. 객체 리터럴 안에서 this의 타입 컨텍스트를 설정해주는 유틸리티 타입을 작성하라.
// type TThis = ThisType<TObj>
// // 17. 객체 타입 T에서 string 타입을 가진 key만 추출하라.
// type TKeyStringVal<T> = {
//   [K in keyof T]: T[K] extends String ? K : never
// }[keyof T]
// type TFooKeyStringVal = TKeyStringVal<TObj>
// // 18. 객체 타입 T에서 optional한 key만 추출하라.
// // 질문 : {} extends Pick<T, K>는 T에서 K를 키로 가지는 필드를 뽑았는데 그 필드가 없다면 value를 K로 만들겠다는 뜻이야?
// type TKeyOptionalKey<T> = {
//   [K in keyof T]-?: {} extends Pick<T, K> ? K : never
// }[keyof T]
// type TBarKeyOptional = TKeyOptionalKey<TObj>
// // 19. 객체 타입 T에서 required한 key만 추출하라.
// type TRequiredKeys<T> = {
//   [K in keyof T]-?: {} extends Pick<T, K> ? never : K
// }[keyof T]

// type TRequiredKey = TRequiredKeys<TObj>
// // 20. 객체 타입 T의 모든 필드 타입을 boolean으로 바꾸는 mapped type을 작성하라.
// type TAllToBoolean<T> = { [K in keyof T]-?: boolean }
// type TAllBoolean = TAllToBoolean<TObj>

type Key = 'foo' | 'bar'
type Value = string | number

type TString = Extract<Value, string>
type TNumber = Exclude<Value, string>

type TMap = {
  [K in Key]: Value
}

type TRecord = Record<Key, Value>

type TPartial = Partial<TRecord>

type TRequeired = Required<TPartial>

type TReadonly = Readonly<TRequeired>

type TFoo = Pick<TReadonly, 'foo'>

type TBar = Omit<TReadonly, 'foo'>
