import { useState, useEffect, useRef } from 'react'

// 간단한 쿼리 클라이언트(캐시 역할)
const queryCache = new Map()

function useQueryClaude<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    retry?: number
    onSuccess?: (data: T) => void
    onError?: (error: unknown) => void
  } = {}
) {
  const {
    enabled = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5분
    retry = 3,
    onSuccess,
    onError,
  } = options

  // 상태 관리
  const [state, setState] = useState<{
    data: T | undefined
    error: unknown | null
    isLoading: boolean
    isError: boolean
    isSuccess: boolean
  }>({
    data: undefined,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
  })

  // 캐시 키 (문자열로 변환)
  const cacheKey = JSON.stringify(queryKey)

  // 마운트 여부 확인용 ref
  const mounted = useRef(true)
  // 재시도 카운터
  const retryCount = useRef(0)

  // 데이터 페칭 함수
  const fetchData = async () => {
    // 이미 캐시에 데이터가 있고 staleTime이 지나지 않았다면 사용
    const cachedData = queryCache.get(cacheKey)
    if (cachedData && Date.now() - cachedData.timestamp < staleTime) {
      setState({
        data: cachedData.data,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const data = await queryFn()

      if (mounted.current) {
        // 데이터 캐시에 저장
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        })

        setState({
          data,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        })

        if (onSuccess) onSuccess(data)
      }
    } catch (error) {
      if (mounted.current) {
        setState({
          data: undefined,
          error,
          isLoading: false,
          isError: true,
          isSuccess: false,
        })

        if (onError) onError(error)

        // 재시도 로직
        if (retryCount.current < retry) {
          retryCount.current += 1
          setTimeout(fetchData, 1000 * retryCount.current) // 지수 백오프
        }
      }
    }
  }

  // 쿼리 무효화 (다시 가져오기)
  const refetch = () => {
    retryCount.current = 0
    return fetchData()
  }

  useEffect(() => {
    mounted.current = true

    if (enabled) {
      fetchData()
    }

    // 캐시 정리 타이머
    const cleanupTimer = setTimeout(() => {
      if (queryCache.has(cacheKey)) {
        queryCache.delete(cacheKey)
      }
    }, cacheTime)

    return () => {
      mounted.current = false
      clearTimeout(cleanupTimer)
    }
  }, [cacheKey, enabled])

  return {
    ...state,
    refetch,
  }
}

export { useQueryClaude }
