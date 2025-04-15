import { useState, useEffect, useRef, useCallback } from 'react'

// ======== 타입 정의 ========
export type QueryKey = string | readonly unknown[]
export type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export interface QueryOptions<TData = unknown, TError = Error> {
  enabled?: boolean // 자동 실행 여부
  staleTime?: number // 데이터 신선도 유지 시간 (ms)
  cacheTime?: number // 캐시 유지 시간 (ms)
  retry?: number | boolean // 재시도 횟수 또는 활성화 여부
  retryDelay?: (attempt: number) => number // 재시도 간격 함수
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  onSettled?: (data: TData | undefined, error: TError | null) => void
  initialData?: TData // 초기 데이터
  refetchOnWindowFocus?: boolean // 창 포커스 시 리패치 여부
  refetchOnReconnect?: boolean // 네트워크 재연결 시 리패치 여부
  refetchInterval?: number | false // 주기적 리패치 간격 (ms)
  keepPreviousData?: boolean // 새 쿼리 로딩 시 이전 데이터 유지
}

export interface QueryResult<TData = unknown, TError = Error> {
  data: TData | undefined
  error: TError | null
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  isError: boolean
  isStale: boolean
  status: QueryStatus
  refetch: () => Promise<TData>
  invalidate: () => Promise<TData>
}

interface CacheEntry<TData = unknown, TError = Error> {
  data?: TData
  error?: TError
  timestamp: number
  promise?: Promise<TData>
  subscribers: Set<() => void>
  gcTimeout?: ReturnType<typeof setTimeout>
}

// ======== 전역 캐시 관리 ========
const queryCache = new Map<string, CacheEntry<any, any>>()

// 안정적인 캐시 키 생성 함수
const createCacheKey = (queryKey: QueryKey): string => {
  if (typeof queryKey === 'string') return queryKey
  try {
    return JSON.stringify(queryKey, (_, value) => {
      if (typeof value === 'function') return undefined
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sortedKeys = Object.keys(value).sort()
        return sortedKeys.reduce((acc, key) => {
          acc[key] = value[key]
          return acc
        }, {} as Record<string, any>)
      }
      return value
    })
  } catch (e) {
    console.warn('캐시 키 직렬화 실패:', queryKey)
    return String(queryKey)
  }
}

// 캐시 가비지 컬렉션 스케줄링 함수
const scheduleGC = (cacheKey: string, cacheTime: number) => {
  const entry = queryCache.get(cacheKey)
  if (!entry) return
  if (entry.gcTimeout) clearTimeout(entry.gcTimeout)
  if (entry.subscribers.size === 0) {
    entry.gcTimeout = setTimeout(() => {
      const currentEntry = queryCache.get(cacheKey)
      if (currentEntry && currentEntry.subscribers.size === 0) {
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
    cacheTime = 5 * 60 * 1000, // 기본 5분
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

  const cacheKey = createCacheKey(queryKey)
  const mountedRef = useRef(true)
  const queryFnRef = useRef(queryFn)
  const optionsRef = useRef(options)
  const retryCountRef = useRef(0)
  const previousDataRef = useRef<TData | undefined>(initialData)

  useEffect(() => {
    queryFnRef.current = queryFn
    optionsRef.current = options
  }, [queryFn, options])

  const [state, setState] = useState<QueryResult<TData, TError>>(() => {
    const entry = queryCache.get(cacheKey)
    const initialState: QueryResult<TData, TError> = {
      data: entry?.data ?? initialData,
      error: entry?.error ?? null,
      isLoading: !entry && !initialData && enabled,
      isFetching: !entry && enabled,
      isSuccess: Boolean(entry?.data ?? initialData),
      isError: Boolean(entry?.error),
      isStale: !entry || Date.now() - entry.timestamp > staleTime,
      status:
        initialData || entry?.data
          ? 'success'
          : entry?.error
          ? 'error'
          : 'idle',
      refetch: async () => fetchData(true),
      invalidate: async () => invalidateQuery(),
    }
    if (entry?.data) previousDataRef.current = entry.data
    return initialState
  })

  // 구독자 업데이트 함수
  const notifySubscribers = useCallback(() => {
    const entry = queryCache.get(cacheKey)
    if (!entry) return
    entry.subscribers.forEach(callback => callback())
  }, [cacheKey])

  // 실제 데이터 페칭 및 재시도 로직
  const fetchData = useCallback(
    async (isManualRefetch = false): Promise<TData> => {
      let entry = queryCache.get(cacheKey)
      // 진행 중인 요청이 있다면 재사용
      if (entry?.promise) return entry.promise
      if (!mountedRef.current)
        return Promise.reject(new Error('컴포넌트가 언마운트 되었습니다'))

      // 캐시 데이터가 존재하고 신선하면 그대로 반환
      if (
        entry?.data &&
        !entry.error &&
        Date.now() - entry.timestamp <= staleTime &&
        !isManualRefetch
      ) {
        previousDataRef.current = entry.data
        setState(prev => ({ ...prev, isFetching: false }))
        return Promise.resolve(entry.data)
      }

      // 로딩/페칭 상태 업데이트
      setState(prev => {
        const nextState = { ...prev, isFetching: true }
        if (!prev.data || !keepPreviousData) {
          nextState.isLoading = true
          nextState.status = 'loading'
        }
        return nextState
      })

      // 재시도 포함 fetch 함수
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
              await new Promise(res => setTimeout(res, delay))
            } else {
              throw error
            }
          }
        }
      }

      const fetchPromise = fetchWithRetry()

      if (!entry) {
        entry = {
          timestamp: Date.now(),
          subscribers: new Set(),
          promise: fetchPromise,
        }
        queryCache.set(cacheKey, entry)
      } else {
        entry.promise = fetchPromise
        if (entry.gcTimeout) {
          clearTimeout(entry.gcTimeout)
          entry.gcTimeout = undefined
        }
      }

      entry.subscribers.add(notifySubscribers)

      try {
        const data = await fetchPromise
        if (mountedRef.current) {
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
          previousDataRef.current = data
          const currentEntry = queryCache.get(cacheKey)
          if (currentEntry) {
            currentEntry.data = data
            currentEntry.error = undefined
            currentEntry.timestamp = Date.now()
            delete currentEntry.promise
          }
          onSuccess && onSuccess(data)
          onSettled && onSettled(data, null)
          notifySubscribers()
        }
        return data
      } catch (error: any) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            error,
            isLoading: false,
            isFetching: false,
            isSuccess: false,
            isError: true,
            status: 'error',
          }))
          const currentEntry = queryCache.get(cacheKey)
          if (currentEntry) {
            currentEntry.error = error
            currentEntry.timestamp = Date.now()
            delete currentEntry.promise
          }
          onError && onError(error)
          onSettled && onSettled(undefined, error)
          notifySubscribers()
        }
        return Promise.reject(error)
      } finally {
        const finalEntry = queryCache.get(cacheKey)
        if (finalEntry?.promise === fetchPromise) delete finalEntry.promise
        scheduleGC(cacheKey, cacheTime)
      }
    },
    [
      cacheKey,
      staleTime,
      cacheTime,
      keepPreviousData,
      notifySubscribers,
      retry,
      retryDelay,
      onSuccess,
      onError,
      onSettled,
    ]
  )

  // 쿼리 무효화 함수
  const invalidateQuery = useCallback(async (): Promise<TData> => {
    const entry = queryCache.get(cacheKey)
    if (entry) entry.timestamp = 0 // 강제로 stale 처리
    return fetchData(true)
  }, [cacheKey, fetchData])

  // 마운트 및 이벤트 리스너 설정
  useEffect(() => {
    mountedRef.current = true
    let entry = queryCache.get(cacheKey)
    if (!entry) {
      entry = { timestamp: 0, subscribers: new Set() }
      queryCache.set(cacheKey, entry)
    }
    entry.subscribers.add(notifySubscribers)
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout)
      entry.gcTimeout = undefined
    }
    if (enabled) {
      const shouldFetch =
        !entry.data || !!entry.error || Date.now() - entry.timestamp > staleTime
      if (shouldFetch) {
        fetchData()
      } else {
        notifySubscribers()
      }
    }

    const handleFocus = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnWindowFocus
      ) {
        const curEntry = queryCache.get(cacheKey)
        if (
          curEntry &&
          Date.now() - curEntry.timestamp > (optionsRef.current.staleTime || 0)
        ) {
          fetchData(true)
        }
      }
    }

    const handleOnline = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnReconnect
      ) {
        fetchData(true)
      }
    }

    if (refetchOnWindowFocus) {
      window.addEventListener('focus', handleFocus)
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') handleFocus()
      })
    }
    if (refetchOnReconnect) {
      window.addEventListener('online', handleOnline)
    }
    let intervalId: ReturnType<typeof setInterval> | undefined
    if (
      refetchInterval &&
      typeof refetchInterval === 'number' &&
      refetchInterval > 0
    ) {
      intervalId = setInterval(() => {
        if (mountedRef.current && optionsRef.current.enabled) fetchData(true)
      }, refetchInterval)
    }
    return () => {
      mountedRef.current = false
      const currentEntry = queryCache.get(cacheKey)
      if (currentEntry) {
        currentEntry.subscribers.delete(notifySubscribers)
        if (currentEntry.subscribers.size === 0) {
          scheduleGC(cacheKey, cacheTime)
        }
      }
      if (refetchOnWindowFocus) {
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') handleFocus()
        })
      }
      if (refetchOnReconnect) {
        window.removeEventListener('online', handleOnline)
      }
      if (intervalId) clearInterval(intervalId)
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

  // refetch와 invalidate 최신 함수로 상태 업데이트
  useEffect(() => {
    setState(prev => ({
      ...prev,
      refetch: () => fetchData(true),
      invalidate: invalidateQuery,
    }))
  }, [fetchData, invalidateQuery])

  return state
}

// ======== 추가 유틸리티 ========

// 전역 queryClient 객체
export const queryClient = {
  getQueryData: <TData = unknown>(queryKey: QueryKey): TData | undefined => {
    const key = createCacheKey(queryKey)
    return queryCache.get(key)?.data as TData | undefined
  },
  setQueryData: <TData = unknown>(queryKey: QueryKey, data: TData): void => {
    const key = createCacheKey(queryKey)
    let entry = queryCache.get(key)
    if (!entry) {
      entry = {
        data,
        timestamp: Date.now(),
        subscribers: new Set(),
      }
      queryCache.set(key, entry)
    } else {
      entry.data = data
      entry.timestamp = Date.now()
      entry.subscribers.forEach(callback => callback())
    }
  },
  invalidateQueries: (queryKey: QueryKey): void => {
    const key = createCacheKey(queryKey)
    const entry = queryCache.get(key)
    if (entry) {
      entry.timestamp = 0
      entry.subscribers.forEach(callback => callback())
    }
  },
  removeQuery: (queryKey: QueryKey): void => {
    const key = createCacheKey(queryKey)
    queryCache.delete(key)
  },
  clear: (): void => {
    queryCache.clear()
  },
}

// 다중 쿼리 훅: 여러 쿼리를 한꺼번에 사용하고 싶을 때
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
