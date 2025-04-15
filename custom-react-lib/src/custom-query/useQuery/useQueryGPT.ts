import { useState, useEffect, useCallback } from 'react'

// 캐시에 저장될 데이터의 타입 정의
interface CacheValue<T> {
  data: T
  timestamp: number
}

// 간단한 전역 캐시 (key는 string으로 제한)
const cache: Record<string, CacheValue<any>> = {}

function useQueryGPT<T>(queryKey: string, fetcher: () => Promise<T>) {
  // 캐시가 존재하면 초기 데이터로 사용, 없으면 null
  const cached = cache[queryKey]
  const [data, setData] = useState<T | null>(cached ? cached.data : null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!cached)

  // 데이터 fetch 및 캐시 업데이트 함수
  const execute = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      // fetch 성공 시 결과를 캐시에 저장하고 상태 업데이트
      cache[queryKey] = { data: result, timestamp: Date.now() }
      setData(result)
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [queryKey, fetcher])

  // 마운트 시 캐시가 없으면 데이터 로드 시작
  useEffect(() => {
    if (!cache[queryKey]) {
      execute()
    }
  }, [queryKey, execute])

  // 수동 리패치 기능
  const refetch = useCallback(() => {
    execute()
  }, [execute])

  return { data, error, isLoading, refetch }
}

export default useQueryGPT
