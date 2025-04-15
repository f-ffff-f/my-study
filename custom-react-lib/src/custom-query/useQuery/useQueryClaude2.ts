import { useState, useEffect, useRef, useCallback } from 'react'

// ======== 타입 정의 ========
export type QueryKey = string | readonly unknown[]
export type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export interface QueryOptions<TData = unknown, TError = Error> {
  // 핵심 옵션
  enabled?: boolean // 자동 실행 여부
  staleTime?: number // 데이터가 신선한 상태로 간주되는 시간 (ms)
  cacheTime?: number // 캐시가 메모리에 유지되는 시간 (ms)

  // 재시도 관련 옵션
  retry?: number | boolean // 실패 시 재시도 횟수
  retryDelay?: (attempt: number) => number // 재시도 간격 함수

  // 콜백 함수들
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  onSettled?: (data: TData | undefined, error: TError | null) => void

  // 추가 기능
  initialData?: TData // 초기 데이터
  refetchOnWindowFocus?: boolean // 창 포커스 시 리패치
  refetchOnReconnect?: boolean // 네트워크 재연결 시 리패치
  refetchInterval?: number | false // 주기적 리패치 간격 (ms)
  keepPreviousData?: boolean // 새 쿼리 로딩 중 이전 데이터 유지
}

export interface QueryResult<TData = unknown, TError = Error> {
  // 데이터 및 에러 상태
  data: TData | undefined
  error: TError | null

  // 상태 플래그
  isLoading: boolean // 첫 로딩 중
  isFetching: boolean // 데이터 페칭 중 (백그라운드 포함)
  isSuccess: boolean // 성공 상태
  isError: boolean // 에러 상태
  isStale: boolean // 데이터가 오래된(stale) 상태인지
  status: QueryStatus // 상태 문자열

  // 함수
  refetch: () => Promise<TData> // 수동 리패치 함수
  invalidate: () => Promise<TData> // 캐시 무효화 함수
}

// 캐시 항목 인터페이스
interface CacheEntry<TData = unknown, TError = Error> {
  data?: TData // 캐시된 데이터
  error?: TError // 캐시된 에러
  timestamp: number // 마지막 업데이트 시간
  promise?: Promise<TData> // 진행 중인 요청
  gcTimeout?: ReturnType<typeof setTimeout> // GC 타이머
  subscribers: Set<() => void> // 구독자 목록
}

// ======== 전역 캐시 관리 ========
const queryCache = new Map<string, CacheEntry<any, any>>()

// 안정적인 캐시 키 생성
const createCacheKey = (queryKey: QueryKey): string => {
  if (typeof queryKey === 'string') return queryKey
  try {
    // 배열인 경우 안정적인 직렬화 수행
    return JSON.stringify(queryKey, (_, value) => {
      // 함수는 제외, 객체는 속성 기준 정렬
      if (typeof value === 'function') return undefined
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return Object.keys(value)
          .sort()
          .reduce((result, key) => {
            result[key] = value[key]
            return result
          }, {} as Record<string, any>)
      }
      return value
    })
  } catch (e) {
    console.warn('Failed to serialize query key:', queryKey)
    return String(queryKey)
  }
}

// 캐시 가비지 컬렉션 스케줄링
const scheduleGC = <TData, TError>(cacheKey: string, cacheTime: number) => {
  const entry = queryCache.get(cacheKey)
  if (!entry) return

  // 이전 타이머 정리
  if (entry.gcTimeout) clearTimeout(entry.gcTimeout)

  // 구독자가 없을 때만 GC 예약
  if (entry.subscribers.size === 0) {
    entry.gcTimeout = setTimeout(() => {
      const currentEntry = queryCache.get(cacheKey)
      if (currentEntry?.subscribers.size === 0) {
        queryCache.delete(cacheKey)
      }
    }, cacheTime)
  }
}

// ======== useQuery 훅 구현 ========
export function useQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: QueryOptions<TData, TError> = {}
): QueryResult<TData, TError> {
  const {
    enabled = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5분
    retry = 3,
    retryDelay = attempt => Math.min(1000 * 2 ** attempt, 30000), // 지수 백오프
    onSuccess,
    onError,
    onSettled,
    initialData,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    refetchInterval = false,
    keepPreviousData = false,
  } = options

  // 안정적인 캐시 키 생성
  const cacheKey = createCacheKey(queryKey)

  // Ref 생성
  const mountedRef = useRef<boolean>(true)
  const queryFnRef = useRef(queryFn)
  const optionsRef = useRef(options)
  const retryCountRef = useRef(0)
  const previousDataRef = useRef<TData | undefined>(undefined)

  // 최신 참조 업데이트
  useEffect(() => {
    queryFnRef.current = queryFn
    optionsRef.current = options
  }, [queryFn, options])

  // 상태 초기화
  const [state, setState] = useState<QueryResult<TData, TError>>(() => {
    const entry = queryCache.get(cacheKey)
    const initialState: QueryResult<TData, TError> = {
      data: initialData,
      error: null,
      isLoading: !entry && !initialData && enabled,
      isFetching: !entry && enabled,
      isSuccess: !!initialData || (!!entry?.data && !entry?.error),
      isError: false,
      isStale: !entry || Date.now() - entry.timestamp > staleTime,
      status: initialData
        ? 'success'
        : entry?.data
        ? 'success'
        : entry?.error
        ? 'error'
        : 'idle',
      refetch: async () => fetchData(true),
      invalidate: async () => invalidateQuery(),
    }

    // 캐시된 데이터가 있으면 적용
    if (entry?.data) {
      initialState.data = entry.data as TData
      previousDataRef.current = entry.data as TData
    } else if (entry?.error) {
      initialState.error = entry.error as TError
      initialState.isError = true
      initialState.status = 'error'
    }

    return initialState
  })

  // 쿼리 페칭 함수
  const fetchData = useCallback(
    async (isManualRefetch = false): Promise<TData> => {
      // 이미 진행 중인 요청이 있으면 재사용
      let entry = queryCache.get(cacheKey)
      if (entry?.promise) {
        return entry.promise as Promise<TData>
      }

      if (!mountedRef.current) {
        return Promise.reject(new Error('Component unmounted'))
      }

      // 캐시가 신선하고 수동 리패치가 아니면 캐시 반환
      if (
        entry?.data &&
        !entry.error &&
        Date.now() - entry.timestamp <= staleTime &&
        !isManualRefetch
      ) {
        // 이전 데이터 업데이트
        previousDataRef.current = entry.data as TData

        // fetching 상태만 false로 변경
        if (state.isFetching) {
          setState(prev => ({ ...prev, isFetching: false }))
        }

        return Promise.resolve(entry.data as TData)
      }

      // 로딩 상태 업데이트
      setState(prev => {
        const nextState = { ...prev }
        nextState.isFetching = true

        // 첫 로딩인 경우 (데이터가 없거나 keepPreviousData가 false인 경우)
        if (!prev.data || !keepPreviousData) {
          nextState.isLoading = !prev.data
          if (!prev.data && !keepPreviousData) {
            nextState.status = 'loading'
          }
        }

        return nextState
      })

      // 재시도 로직이 포함된 fetch 함수
      const fetchWithRetry = async (): Promise<TData> => {
        retryCountRef.current = 0

        while (true) {
          try {
            const result = await queryFnRef.current()
            return result
          } catch (error) {
            const maxRetries =
              typeof retry === 'boolean' ? (retry ? 3 : 0) : retry

            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              const delay = retryDelay(retryCountRef.current)
              await new Promise(resolve => setTimeout(resolve, delay))
              // 재시도 계속
            } else {
              throw error
            }
          }
        }
      }

      // Promise 생성 및 캐시에 저장
      const fetchPromise = fetchWithRetry()

      // 캐시 항목 갱신 또는 생성
      if (!entry) {
        entry = {
          timestamp: Date.now(),
          promise: fetchPromise,
          subscribers: new Set(),
        }
        queryCache.set(cacheKey, entry)
      } else {
        entry.promise = fetchPromise

        // GC 타이머 클리어 (페칭 중에는 캐시 삭제 방지)
        if (entry.gcTimeout) {
          clearTimeout(entry.gcTimeout)
          entry.gcTimeout = undefined
        }
      }

      // 구독자 추가
      entry.subscribers.add(notifySubscribers)

      try {
        const data = await fetchPromise

        if (mountedRef.current) {
          // 성공 시 상태 및 캐시 업데이트
          setState(prev => ({
            ...prev,
            data,
            error: null,
            isLoading: false,
            isFetching: false,
            isSuccess: true,
            isError: false,
            isStale: false,
            status: 'success',
          }))

          // 이전 데이터 업데이트
          previousDataRef.current = data

          // 캐시 업데이트
          const currentEntry = queryCache.get(cacheKey)
          if (currentEntry) {
            currentEntry.data = data
            currentEntry.error = undefined
            currentEntry.timestamp = Date.now()
            delete currentEntry.promise
          }

          // 콜백 호출
          optionsRef.current.onSuccess?.(data)
          optionsRef.current.onSettled?.(data, null)

          // 구독자에게 알림
          notifySubscribers()
        }

        return data
      } catch (error) {
        if (mountedRef.current) {
          // 실패 시 상태 및 캐시 업데이트
          setState(prev => ({
            ...prev,
            error: error as TError,
            isLoading: false,
            isFetching: false,
            isSuccess: false,
            isError: true,
            status: 'error',
          }))

          // 캐시 업데이트
          const currentEntry = queryCache.get(cacheKey)
          if (currentEntry) {
            currentEntry.error = error as TError
            currentEntry.timestamp = Date.now()
            delete currentEntry.promise
          }

          // 콜백 호출
          optionsRef.current.onError?.(error as TError)
          optionsRef.current.onSettled?.(undefined, error as TError)

          // 구독자에게 알림
          notifySubscribers()
        }

        return Promise.reject(error)
      } finally {
        // Promise 참조 제거
        const finalEntry = queryCache.get(cacheKey)
        if (finalEntry?.promise === fetchPromise) {
          delete finalEntry.promise
        }

        // GC 스케줄링
        scheduleGC(cacheKey, cacheTime)
      }
    },
    [cacheKey, staleTime, cacheTime, state.isFetching]
  )

  // 쿼리 무효화 함수
  const invalidateQuery = useCallback(async (): Promise<TData> => {
    const entry = queryCache.get(cacheKey)
    if (entry) {
      // timestamp만 0으로 만들어 stale하게 만듦
      entry.timestamp = 0
    }
    // 즉시 refetch
    return fetchData(true)
  }, [cacheKey, fetchData])

  // 구독자 알림 함수
  const notifySubscribers = useCallback(() => {
    const entry = queryCache.get(cacheKey)
    if (!entry) return

    // 구독자에게 알림 (자신 제외)
    entry.subscribers.forEach(callback => {
      if (callback !== notifySubscribers) {
        callback()
      }
    })

    // 자신의 상태 업데이트
    if (mountedRef.current) {
      setState(prev => {
        const nextState = { ...prev }

        // 데이터와 에러 상태 업데이트
        if (entry.data !== undefined) {
          nextState.data = entry.data as TData
        }

        if (entry.error !== undefined) {
          nextState.error = entry.error as TError
        }

        // 상태 플래그 업데이트
        nextState.isLoading = false
        nextState.isFetching = !!entry.promise
        nextState.isSuccess = !!entry.data && !entry.error
        nextState.isError = !!entry.error
        nextState.isStale = Date.now() - entry.timestamp > staleTime
        nextState.status = entry.error
          ? 'error'
          : entry.data
          ? 'success'
          : 'loading'

        // 변경 사항이 있을 때만 업데이트 (불필요한 리렌더링 방지)
        return JSON.stringify(prev) !== JSON.stringify(nextState)
          ? nextState
          : prev
      })
    }
  }, [cacheKey, staleTime])

  // 마운트 효과 및 이벤트 리스너 설정
  useEffect(() => {
    mountedRef.current = true

    // 캐시 항목 생성 또는 획득 및 구독 등록
    let entry = queryCache.get(cacheKey)
    if (!entry) {
      entry = { timestamp: 0, subscribers: new Set() }
      queryCache.set(cacheKey, entry)
    }

    // 구독 등록
    entry.subscribers.add(notifySubscribers)

    // GC 타이머 클리어
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout)
      entry.gcTimeout = undefined
    }

    // 쿼리 실행 조건
    if (enabled) {
      const shouldFetch =
        !entry.data ||
        !!entry.error || //Another way to implement this might be to get rid of the double check and the shouldFetch variable -- fetchData already checks if the data is stale and can decide on its own
        Date.now() - entry.timestamp > staleTime

      if (shouldFetch) {
        fetchData()
      } else {
        // 캐시 데이터가 신선하면 상태 동기화
        notifySubscribers()
      }
    }

    // 윈도우 포커스 이벤트 핸들러
    const handleFocus = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnWindowFocus
      ) {
        const entry = queryCache.get(cacheKey)
        if (
          entry &&
          Date.now() - entry.timestamp > (optionsRef.current.staleTime ?? 0)
        ) {
          fetchData(true)
        }
      }
    }

    // 네트워크 상태 이벤트 핸들러
    const handleOnline = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnReconnect
      ) {
        fetchData(true)
      }
    }

    // 이벤트 리스너 등록
    if (refetchOnWindowFocus) {
      window.addEventListener('focus', handleFocus)
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          handleFocus()
        }
      })
    }

    if (refetchOnReconnect) {
      window.addEventListener('online', handleOnline)
    }

    // Interval Refetch 설정
    let intervalId: ReturnType<typeof setInterval> | undefined
    if (
      refetchInterval &&
      typeof refetchInterval === 'number' &&
      refetchInterval > 0
    ) {
      intervalId = setInterval(() => {
        if (mountedRef.current && optionsRef.current.enabled) {
          fetchData(true)
        }
      }, refetchInterval)
    }

    // 클린업 함수
    return () => {
      mountedRef.current = false

      // 구독 해제
      const currentEntry = queryCache.get(cacheKey)
      if (currentEntry) {
        currentEntry.subscribers.delete(notifySubscribers)

        // 구독자가 없으면 GC 스케줄링
        if (currentEntry.subscribers.size === 0) {
          scheduleGC(cacheKey, cacheTime)
        }
      }

      // 이벤트 리스너 제거
      if (refetchOnWindowFocus) {
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            handleFocus()
          }
        })
      }

      if (refetchOnReconnect) {
        window.removeEventListener('online', handleOnline)
      }

      // 인터벌 클리어
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [
    cacheKey,
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchOnReconnect,
    refetchInterval,
    fetchData,
    notifySubscribers,
  ])

  // refetch와 invalidate 함수 업데이트
  useEffect(() => {
    setState(prev => ({
      ...prev,
      refetch: () => fetchData(true),
      invalidate: invalidateQuery,
    }))
  }, [fetchData, invalidateQuery])

  // 최종 상태 반환
  return state
}

// ======== 추가 유틸리티 함수 ========

// 쿼리 클라이언트 유틸리티 (선택적 사용)
export const queryClient = {
  // 쿼리 캐시 가져오기
  getQueryData: <TData = unknown>(queryKey: QueryKey): TData | undefined => {
    const cacheKey = createCacheKey(queryKey)
    return queryCache.get(cacheKey)?.data as TData | undefined
  },

  // 쿼리 데이터 설정
  setQueryData: <TData = unknown>(queryKey: QueryKey, data: TData): void => {
    const cacheKey = createCacheKey(queryKey)
    let entry = queryCache.get(cacheKey)

    if (!entry) {
      entry = {
        data,
        timestamp: Date.now(),
        subscribers: new Set(),
      }
      queryCache.set(cacheKey, entry)
    } else {
      entry.data = data
      entry.timestamp = Date.now()

      // 구독자에게 알림
      entry.subscribers.forEach(callback => callback())
    }
  },

  // 쿼리 무효화
  invalidateQueries: (queryKey: QueryKey): void => {
    const cacheKey = createCacheKey(queryKey)
    const entry = queryCache.get(cacheKey)

    if (entry) {
      entry.timestamp = 0 // stale로 표시

      // 구독자에게 알림
      entry.subscribers.forEach(callback => callback())
    }
  },

  // 쿼리 직접 제거
  removeQuery: (queryKey: QueryKey): void => {
    const cacheKey = createCacheKey(queryKey)
    queryCache.delete(cacheKey)
  },

  // 모든 쿼리 클리어
  clear: (): void => {
    queryCache.clear()
  },
}

// 다중 쿼리 훅
export function useQueries<TQueries extends any[]>(
  queries: {
    queryKey: QueryKey
    queryFn: () => Promise<any>
    options?: QueryOptions<any, any>
  }[]
): QueryResult<any, any>[] {
  return queries.map(({ queryKey, queryFn, options }) =>
    useQuery(queryKey, queryFn, options)
  )
}

// QueryKey 생성 헬퍼
export function createQueryKey(...parts: any[]): QueryKey {
  return parts.filter(part => part !== undefined && part !== null)
}
