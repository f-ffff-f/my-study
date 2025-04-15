import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  useDebugValue, // 디버깅 정보 추가
} from 'react'

// ======== 타입 정의 (유저 코드 재사용) ========
export type QueryKey = string | readonly unknown[]
export type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export interface QueryOptions<TData = unknown, TError = Error> {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number | boolean
  retryDelay?: (attempt: number) => number
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  onSettled?: (data: TData | undefined, error: TError | null) => void
  initialData?: TData
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  refetchInterval?: number | false
  keepPreviousData?: boolean
}

// 상태 인터페이스 (useReducer 용)
interface QueryState<TData = unknown, TError = Error> {
  data: TData | undefined
  error: TError | null
  status: QueryStatus
  isFetching: boolean
  isStale: boolean
}

// 리듀서 액션 타입
type QueryAction<TData, TError> =
  | { type: 'FETCHING'; payload?: { keepPreviousData?: boolean } }
  | { type: 'SUCCESS'; payload: { data: TData; staleTime: number } }
  | { type: 'ERROR'; payload: { error: TError } }
  | { type: 'OBSERVER_UPDATE'; payload: Partial<QueryState<TData, TError>> }
  | { type: 'RESET' }

// 캐시 항목 인터페이스 (유저 코드 재사용)
interface CacheEntry<TData = unknown, TError = Error> {
  data?: TData
  error?: TError
  timestamp: number
  promise?: Promise<TData>
  gcTimeout?: ReturnType<typeof setTimeout>
  subscribers: Set<() => void>
}

// ======== 전역 캐시 관리 (유저 코드 재사용, 약간 수정) ========
const queryCache = new Map<string, CacheEntry<any, any>>()

const createCacheKey = (queryKey: QueryKey): string => {
  // (유저 코드의 createCacheKey 함수와 동일하게 유지)
  if (typeof queryKey === 'string') return queryKey
  try {
    return JSON.stringify(queryKey, (_, value) => {
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

const scheduleGC = <TData, TError>(cacheKey: string, cacheTime: number) => {
  const entry = queryCache.get(cacheKey)
  if (!entry) return
  if (entry.gcTimeout) clearTimeout(entry.gcTimeout)
  if (entry.subscribers.size === 0 && cacheTime !== Infinity && cacheTime > 0) {
    entry.gcTimeout = setTimeout(() => {
      const currentEntry = queryCache.get(cacheKey)
      if (currentEntry?.subscribers.size === 0) {
        queryCache.delete(cacheKey)
        // console.log(`[Query Cache] Entry removed: ${cacheKey}`);
      }
    }, cacheTime)
  }
}

// ======== 상태 리듀서 ========
function queryReducer<TData, TError>(
  state: QueryState<TData, TError>,
  action: QueryAction<TData, TError>
): QueryState<TData, TError> {
  switch (action.type) {
    case 'FETCHING':
      return {
        ...state,
        isFetching: true,
        status:
          state.data && action.payload?.keepPreviousData
            ? 'success'
            : 'loading', // 로딩 중 상태 조정
      }
    case 'SUCCESS':
      return {
        ...state,
        data: action.payload.data,
        error: null,
        status: 'success',
        isFetching: false,
        isStale:
          Date.now() - (queryCache.get(createCacheKey(state))?.timestamp ?? 0) >
          action.payload.staleTime, // stale 상태 업데이트
      }
    case 'ERROR':
      return {
        ...state,
        error: action.payload.error,
        status: 'error',
        isFetching: false,
        isStale: true, // 에러 시 stale로 간주
      }
    case 'OBSERVER_UPDATE':
      // 외부 캐시 변경에 따른 상태 동기화
      // isFetching 상태는 내부 로직으로 관리하므로 payload에서 제외
      const { isFetching, ...restPayload } = action.payload
      return {
        ...state,
        ...restPayload,
        isFetching: state.isFetching, // isFetching은 유지
      }
    case 'RESET':
      // 초기 상태 또는 캐시 기반 상태로 리셋 (필요시 구현)
      // 예시: return getInitialState(...);
      return state // 현재는 단순 반환
    default:
      return state
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
    cacheTime = 5 * 60 * 1000,
    retry = 3,
    retryDelay = attempt => Math.min(1000 * 2 ** attempt, 30000),
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

  // Refs
  const mountedRef = useRef<boolean>(true)
  const queryFnRef = useRef(queryFn)
  const optionsRef = useRef(options) // 옵션 참조를 위해 useRef 사용
  const retryCountRef = useRef(0)
  const previousDataRef = useRef<TData | undefined>(initialData) // 초기값으로 initialData 설정

  // 최신 함수 및 옵션 참조 업데이트
  useEffect(() => {
    queryFnRef.current = queryFn
    optionsRef.current = options
  }, [queryFn, options])

  // 초기 상태 계산 함수
  const getInitialState = useCallback((): QueryState<TData, TError> => {
    const entry = queryCache.get(cacheKey)
    let data = initialData
    let error = null
    let status: QueryStatus = 'idle'
    let isStale = true

    if (entry) {
      // 캐시 데이터 우선 사용 (initialData 보다 우선)
      data = entry.data !== undefined ? (entry.data as TData) : initialData
      error = entry.error ? (entry.error as TError) : null
      status = error ? 'error' : data !== undefined ? 'success' : 'idle'
      isStale =
        Date.now() - entry.timestamp > (optionsRef.current.staleTime ?? 0)
    } else if (initialData !== undefined) {
      data = initialData
      status = 'success'
      isStale = true // initialData는 항상 stale로 시작 (fetch 유도 가능)
    }

    previousDataRef.current = data // 이전 데이터 초기화

    return {
      data: data,
      error: error,
      status: status,
      isFetching: enabled && (!entry || isStale) && data === undefined, // 초기 fetch 여부 결정
      isStale: isStale,
    }
  }, [cacheKey, initialData, enabled]) // 의존성 배열 조정

  // useReducer 사용
  const [state, dispatch] = useReducer(queryReducer, undefined, getInitialState)

  // 쿼리 페칭 로직 (useCallback 사용 및 의존성 최소화)
  const fetchData = useCallback(
    async (isManualRefetch = false): Promise<TData> => {
      // 캐시 키 최신화 (queryKey 변경 감지)
      const currentCacheKey = createCacheKey(queryKeyRef.current) // queryKeyRef 사용
      let entry = queryCache.get(currentCacheKey)

      // 중복 요청 방지
      if (entry?.promise) {
        return entry.promise as Promise<TData>
      }

      // 컴포넌트 언마운트 확인
      if (!mountedRef.current) {
        return Promise.reject(new Error('Component unmounted'))
      }

      const {
        staleTime: currentStaleTime = 0,
        cacheTime: currentCacheTime = 5 * 60 * 1000,
        retry: currentRetry = 3,
        retryDelay: currentRetryDelay = attempt =>
          Math.min(1000 * 2 ** attempt, 30000),
        keepPreviousData: currentKeepPreviousData = false,
      } = optionsRef.current // 최신 옵션 사용

      // 캐시가 신선하고 수동 리패치가 아니면 종료
      if (
        entry?.data !== undefined &&
        !entry.error &&
        Date.now() - entry.timestamp <= currentStaleTime &&
        !isManualRefetch
      ) {
        // notifyObserver 에서 isFetching 상태는 관리되므로 여기서는 dispatch 불필요
        return Promise.resolve(entry.data as TData)
      }

      // Fetch 시작 알림
      dispatch({
        type: 'FETCHING',
        payload: { keepPreviousData: currentKeepPreviousData },
      })

      // 재시도 로직 포함 함수
      const fetchWithRetry = async (): Promise<TData> => {
        retryCountRef.current = 0
        while (true) {
          try {
            return await queryFnRef.current() // 최신 queryFn 사용
          } catch (error) {
            const maxRetries =
              typeof currentRetry === 'boolean'
                ? currentRetry
                  ? 3
                  : 0
                : currentRetry
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              const delay = currentRetryDelay(retryCountRef.current)
              await new Promise(resolve => setTimeout(resolve, delay))
            } else {
              throw error
            }
          }
        }
      }

      // Promise 생성 및 캐시 등록
      const fetchPromise = fetchWithRetry()
      if (!entry) {
        entry = { timestamp: 0, subscribers: new Set() } // timestamp는 성공 시 업데이트
        queryCache.set(currentCacheKey, entry)
      }
      entry.promise = fetchPromise
      entry.subscribers.add(notifyObserver) // 구독자 추가
      if (entry.gcTimeout) {
        // GC 타이머 클리어
        clearTimeout(entry.gcTimeout)
        entry.gcTimeout = undefined
      }

      try {
        const data = await fetchPromise
        if (mountedRef.current) {
          const successTimestamp = Date.now()
          dispatch({
            type: 'SUCCESS',
            payload: { data, staleTime: currentStaleTime },
          })

          // 캐시 업데이트
          const cacheEntry = queryCache.get(currentCacheKey)
          if (cacheEntry) {
            cacheEntry.data = data
            cacheEntry.error = undefined
            cacheEntry.timestamp = successTimestamp
            delete cacheEntry.promise
          }

          previousDataRef.current = data // 이전 데이터 업데이트

          // 콜백 및 알림
          optionsRef.current.onSuccess?.(data)
          optionsRef.current.onSettled?.(data, null)
          notifyObserver(true) // 다른 구독자에게 알림 (자신 제외)
        }
        return data
      } catch (error) {
        if (mountedRef.current) {
          const errorTimestamp = Date.now()
          dispatch({ type: 'ERROR', payload: { error: error as TError } })

          // 캐시 업데이트 (에러 정보)
          const cacheEntry = queryCache.get(currentCacheKey)
          if (cacheEntry) {
            cacheEntry.error = error as TError
            // data는 유지될 수 있음 (stale error data)
            cacheEntry.timestamp = errorTimestamp
            delete cacheEntry.promise
          }

          // 콜백 및 알림
          optionsRef.current.onError?.(error as TError)
          optionsRef.current.onSettled?.(undefined, error as TError)
          notifyObserver(true) // 다른 구독자에게 알림
        }
        throw error // 에러를 다시 throw하여 Promise reject 처리
      } finally {
        if (mountedRef.current) {
          // GC 스케줄링
          scheduleGC(currentCacheKey, currentCacheTime)
        }
      }
    },
    [queryKey]
  ) // queryKey 변경 시 fetchData 재생성 (내부에서 cacheKey 재생성)

  // 쿼리 무효화 함수
  const invalidateQuery = useCallback(async (): Promise<void> => {
    const currentCacheKey = createCacheKey(queryKeyRef.current)
    const entry = queryCache.get(currentCacheKey)
    if (entry) {
      entry.timestamp = 0 // Stale 상태로 만듦
      notifyObserver(true) // 구독자에게 즉시 stale 상태 알림
    }
    // refetch 실행 (fetchData 내부에서 stale 체크 후 실행)
    await fetchData(true)
  }, [fetchData]) // fetchData 의존성

  // 구독자 알림 및 상태 동기화 함수
  const notifyObserver = useCallback(
    (skipSelf = false) => {
      if (!skipSelf && mountedRef.current) {
        // 자기 자신에게 알림 (외부 변경 시)
        const currentCacheKey = createCacheKey(queryKeyRef.current)
        const entry = queryCache.get(currentCacheKey)
        if (entry) {
          // 캐시 상태를 기반으로 로컬 상태 업데이트
          dispatch({
            type: 'OBSERVER_UPDATE',
            payload: {
              data: entry.data as TData,
              error: entry.error ? (entry.error as TError) : null,
              isStale:
                Date.now() - entry.timestamp >
                (optionsRef.current.staleTime ?? 0),
              status: entry.error
                ? 'error'
                : entry.data !== undefined
                ? 'success'
                : 'idle',
              // isFetching은 OBSERVER_UPDATE에서 직접 건드리지 않음
            },
          })
        }
      }
      // 다른 구독자에게 알림
      const currentCacheKey = createCacheKey(queryKeyRef.current)
      const entry = queryCache.get(currentCacheKey)
      entry?.subscribers.forEach(callback => {
        // 자기 자신(notifyObserver)이 아닌 다른 콜백 함수 호출
        if (callback !== notifyObserver) {
          callback()
        }
      })
    },
    [queryKey]
  ) // queryKey 변경 시 notifyObserver 재생성

  // queryKey Ref (useCallback 등에서 최신 queryKey 사용 위함)
  const queryKeyRef = useRef(queryKey)
  useEffect(() => {
    queryKeyRef.current = queryKey
    // queryKey 변경 시 캐시 키도 변경되었으므로, 상태 초기화 로직 필요
    // 예: dispatch({ type: 'RESET' }); fetchData();
    // 여기서는 단순화하여, 변경 시 자동으로 재조회되도록 함 (fetchData 의존성)
  }, [queryKey])

  // 마운트 효과 및 이벤트 리스너
  useEffect(() => {
    mountedRef.current = true
    const currentOptions = optionsRef.current // 클로저 문제 방지
    const currentCacheKey = createCacheKey(queryKeyRef.current)

    // 구독 등록
    let entry = queryCache.get(currentCacheKey)
    if (!entry) {
      entry = { timestamp: 0, subscribers: new Set() }
      queryCache.set(currentCacheKey, entry)
    }
    entry.subscribers.add(notifyObserver)
    if (entry.gcTimeout) {
      // GC 타이머 클리어
      clearTimeout(entry.gcTimeout)
      entry.gcTimeout = undefined
    }

    // 초기 데이터 로드 조건
    if (currentOptions.enabled) {
      // fetchData 내부에서 stale 체크하므로, 여기서는 호출만 결정
      if (
        !entry.data ||
        entry.error ||
        Date.now() - entry.timestamp > (currentOptions.staleTime ?? 0)
      ) {
        fetchData()
      } else {
        // 신선한 데이터가 있으면 상태 동기화 (초기 렌더링 후)
        notifyObserver()
      }
    } else {
      // 비활성화 시 isFetching 상태 false로 유지
      dispatch({ type: 'OBSERVER_UPDATE', payload: { isFetching: false } })
    }

    // --- 이벤트 리스너 설정 ---
    const handleFocus = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnWindowFocus
      ) {
        const currentEntry = queryCache.get(createCacheKey(queryKeyRef.current))
        if (
          currentEntry &&
          Date.now() - currentEntry.timestamp >
            (optionsRef.current.staleTime ?? 0)
        ) {
          fetchData(true) // stale할 때만 수동 리패치처럼 실행
        }
      }
    }
    const handleOnline = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnReconnect
      ) {
        fetchData(true) // 재연결 시 항상 리패치 시도
      }
    }

    if (currentOptions.refetchOnWindowFocus)
      window.addEventListener('focus', handleFocus)
    if (currentOptions.refetchOnReconnect)
      window.addEventListener('online', handleOnline)

    // --- Interval 설정 ---
    let intervalId: ReturnType<typeof setInterval> | undefined
    if (
      currentOptions.refetchInterval &&
      typeof currentOptions.refetchInterval === 'number' &&
      currentOptions.refetchInterval > 0
    ) {
      intervalId = setInterval(() => {
        if (mountedRef.current && optionsRef.current.enabled) {
          fetchData(true) // 인터벌마다 리패치
        }
      }, currentOptions.refetchInterval)
    }

    // --- 클린업 ---
    return () => {
      mountedRef.current = false
      const currentEntry = queryCache.get(currentCacheKey)
      if (currentEntry) {
        currentEntry.subscribers.delete(notifyObserver) // 구독 해제
        if (currentEntry.subscribers.size === 0) {
          scheduleGC(
            currentCacheKey,
            optionsRef.current.cacheTime ?? 5 * 60 * 1000
          ) // GC 예약
        }
      }
      // 리스너 및 인터벌 제거
      if (currentOptions.refetchOnWindowFocus)
        window.removeEventListener('focus', handleFocus)
      if (currentOptions.refetchOnReconnect)
        window.removeEventListener('online', handleOnline)
      if (intervalId) clearInterval(intervalId)
    }
  }, [enabled, cacheKey, fetchData, notifyObserver]) // 의존성 배열 관리

  // 디버깅 정보 추가 (React DevTools에 표시)
  useDebugValue(
    state,
    ({ status, data, error }) =>
      `Status: ${status}, Data: ${data ? 'Exists' : 'None'}, Error: ${
        error ? 'Exists' : 'None'
      }`
  )

  // 최종 결과 구성 (QueryResult 인터페이스 맞춤)
  const result: QueryResult<TData, TError> = {
    data: keepPreviousData ? state.data ?? previousDataRef.current : state.data,
    error: state.error,
    isLoading: state.status === 'loading' && !state.data && !keepPreviousData, // 로딩 상태 재정의
    isFetching: state.isFetching,
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isStale: state.isStale,
    status: state.status,
    refetch: useCallback(() => fetchData(true), [fetchData]), // 항상 최신 fetchData 참조
    invalidate: invalidateQuery, // invalidate 함수 추가
  }

  return result
}

// ======== 유틸리티 함수 (유저 코드 재사용) ========
export const queryClient = {
  /* ... 이전과 동일 ... */
}
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
export function createQueryKey(...parts: any[]): QueryKey {
  return parts.filter(part => part !== undefined && part !== null)
}
