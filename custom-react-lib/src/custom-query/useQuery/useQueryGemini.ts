import { useState, useEffect, useRef, useCallback } from 'react'

// --- 전역 캐시 및 관리 로직 ---

// 캐시 데이터 타입 정의
interface CacheEntry<TData = unknown> {
  data?: TData
  error?: unknown
  timestamp: number // 마지막 성공/실패 시간
  promise?: Promise<TData> // 진행 중인 요청 프라미스
  gcTimer?: ReturnType<typeof setTimeout> // 가비지 컬렉션 타이머
  subscribers: Set<() => void> // 이 캐시를 구독하는 컴포넌트 콜백
}

// 전역 캐시 (Map 사용)
const queryCache = new Map<string, CacheEntry<any>>()

// 캐시 키 직렬화 함수 (안정적인 키 생성을 위해)
// 실제 라이브러리는 더 정교한 직렬화 사용
const stableSerialize = (key: unknown): string => {
  try {
    // 배열인 경우 정렬하여 순서 불일치 문제 방지 시도
    if (Array.isArray(key)) {
      return JSON.stringify(key.sort())
    }
    return JSON.stringify(key)
  } catch (e) {
    console.error('Failed to serialize query key:', key, e)
    // 단순 문자열 변환으로 대체 (매우 기본적인 방법)
    return String(key)
  }
}

// 캐시 정리 로직 (더 이상 사용되지 않는 캐시 제거)
const scheduleGC = <TData>(cacheKey: string, cacheTime: number) => {
  const entry = queryCache.get(cacheKey)
  if (!entry || cacheTime === Infinity) return

  // 기존 타이머 클리어
  if (entry.gcTimer) {
    clearTimeout(entry.gcTimer)
  }

  // 구독자가 없으면 cacheTime 후 삭제 예약
  if (entry.subscribers.size === 0) {
    entry.gcTimer = setTimeout(() => {
      // 타이머 실행 시점에도 여전히 구독자가 없는지 확인
      if (queryCache.get(cacheKey)?.subscribers.size === 0) {
        queryCache.delete(cacheKey)
        // console.log(`Cache entry removed: ${cacheKey}`);
      }
    }, cacheTime)
  }
}

// --- useQuery 훅 구현 ---

type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

interface UseQueryOptions<TData = unknown, TError = unknown> {
  enabled?: boolean // 쿼리 자동 실행 여부
  staleTime?: number // 데이터가 신선(fresh)하다고 간주되는 시간 (ms), 기본값 0
  cacheTime?: number // 캐시가 메모리에 유지되는 시간 (ms), 기본값 5분
  retry?: number | boolean // 실패 시 재시도 횟수 (true는 3번)
  retryDelay?: (attemptIndex: number) => number // 재시도 간격 (ms)
  onSuccess?: (data: TData) => void // 성공 콜백
  onError?: (error: TError) => void // 실패 콜백
  onSettled?: (data: TData | undefined, error: TError | unknown | null) => void // 성공/실패 후 항상 호출
  initialData?: TData // 초기 데이터
  refetchOnWindowFocus?: boolean // 창 포커스 시 리패치 (간략화된 구현)
  refetchInterval?: number | false // 주기적 리패치 간격 (ms)
}

interface UseQueryResult<TData = unknown, TError = unknown> {
  data: TData | undefined
  error: TError | unknown | null
  isLoading: boolean // 첫 로딩 중 (캐시 없음)
  isFetching: boolean // 로딩 중 (백그라운드 포함)
  isSuccess: boolean // 성공 상태
  isError: boolean // 에러 상태
  isStale: boolean // 데이터가 stale 상태인지 여부
  status: QueryStatus
  refetch: () => Promise<void> // 수동 리패치 함수
}

function useQueryGemini<TData = unknown, TError = unknown>(
  queryKey: unknown,
  queryFn: () => Promise<TData>,
  options: UseQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  const {
    enabled = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5분
    retry = 3,
    retryDelay = attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    onSuccess,
    onError,
    onSettled,
    initialData,
    refetchOnWindowFocus = false, // 기본값 false
    refetchInterval = false, // 기본값 false
  } = options

  const cacheKey = stableSerialize(queryKey)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const queryFnRef = useRef(queryFn)
  const optionsRef = useRef(options) // 최신 옵션 참조

  // 옵션 업데이트 시 ref 업데이트
  useEffect(() => {
    queryFnRef.current = queryFn
    optionsRef.current = options
  })

  // 상태 관리
  const [state, setState] = useState<UseQueryResult<TData, TError>>(() => {
    const entry = queryCache.get(cacheKey)
    const initialStatus = initialData ? 'success' : 'idle'
    const initialIsLoading = !entry && enabled && !initialData

    return {
      data: initialData ?? entry?.data,
      error: entry?.error ?? null,
      isLoading: initialIsLoading,
      isFetching: initialIsLoading,
      isSuccess: !!(initialData ?? entry?.data) && !entry?.error,
      isError: !!entry?.error,
      isStale: !entry || Date.now() - entry.timestamp > staleTime,
      status: entry ? (entry.error ? 'error' : 'success') : initialStatus,
      refetch: () => fetchData(true), // 초기 refetch 함수
    }
  })

  // 데이터 페칭 로직
  const fetchData = useCallback(
    async (isManualRefetch = false): Promise<void> => {
      // 진행 중인 요청이 있으면 재사용 (중복 요청 방지)
      let entry = queryCache.get(cacheKey)
      if (entry?.promise) {
        try {
          await entry.promise // 기존 요청 완료 대기
          entry = queryCache.get(cacheKey) // 완료 후 최신 entry 가져오기
          // 상태 업데이트는 기존 프라미스가 알아서 할 것이므로 여기서 중복 업데이트 방지
          return
        } catch (error) {
          // 기존 프라미스에서 에러 발생 시, 여기서 처리할 필요 없이 해당 프라미스 catch에서 처리됨
          return
        }
      }

      // 컴포넌트 마운트 확인
      if (!mountedRef.current) return

      // 캐시가 있고, stale 하지 않으며, 수동 리패치가 아니면 데이터 반환 없이 종료
      if (
        entry &&
        !entry.error &&
        Date.now() - entry.timestamp <= (optionsRef.current.staleTime ?? 0) &&
        !isManualRefetch
      ) {
        // 이미 최신 데이터이므로 fetching 상태만 false로 변경
        if (state.isFetching) {
          setState(prev => ({ ...prev, isFetching: false }))
        }
        return
      }

      // 로딩 상태 업데이트
      setState(prev => ({
        ...prev,
        isLoading: !prev.data && !prev.error, // 데이터나 에러가 없으면 초기 로딩
        isFetching: true,
        status: !prev.data && !prev.error ? 'loading' : prev.status,
      }))

      let newData: TData | undefined = undefined
      let fetchError: TError | unknown | null = null

      // Fetch Promise 생성 및 캐시에 저장
      const fetchPromise = (async () => {
        retryCountRef.current = 0 // 재시도 카운트 초기화
        while (true) {
          try {
            const data = await queryFnRef.current()
            return data // 성공 시 데이터 반환
          } catch (err) {
            retryCountRef.current++
            const shouldRetry =
              optionsRef.current.retry === true ||
              (typeof optionsRef.current.retry === 'number' &&
                retryCountRef.current <= optionsRef.current.retry)

            if (shouldRetry) {
              const delay =
                optionsRef.current.retryDelay?.(retryCountRef.current) ?? 1000
              await new Promise(resolve => setTimeout(resolve, delay))
              // 루프 계속
            } else {
              throw err // 재시도 횟수 초과 시 에러 throw
            }
          }
        }
      })()

      // Promise를 캐시에 저장하여 중복 호출 방지
      if (!entry) {
        entry = {
          timestamp: Date.now(),
          subscribers: new Set(),
          promise: fetchPromise,
        }
        queryCache.set(cacheKey, entry)
      } else {
        entry.promise = fetchPromise
      }
      entry.subscribers.add(notify) // 구독자 추가

      // GC 타이머 클리어 (active fetch 중에는 삭제되면 안됨)
      if (entry.gcTimer) {
        clearTimeout(entry.gcTimer)
        entry.gcTimer = undefined
      }

      try {
        newData = await fetchPromise

        if (mountedRef.current) {
          // 성공 시 상태 업데이트
          setState(prev => ({
            ...prev,
            data: newData,
            error: null,
            isLoading: false,
            isFetching: false,
            isSuccess: true,
            isError: false,
            isStale: false,
            status: 'success',
          }))

          // 캐시 업데이트
          const cacheEntry = queryCache.get(cacheKey)
          if (cacheEntry) {
            cacheEntry.data = newData
            cacheEntry.error = undefined
            cacheEntry.timestamp = Date.now()
            delete cacheEntry.promise // 완료된 프라미스 제거
          } else {
            // 이론상 fetchPromise 저장 시점에 entry가 생성되었어야 함
            queryCache.set(cacheKey, {
              data: newData,
              timestamp: Date.now(),
              subscribers: new Set([notify]), // 자기 자신 추가
            })
          }

          // 콜백 호출
          optionsRef.current.onSuccess?.(newData as TData)
          optionsRef.current.onSettled?.(newData, null)

          // 구독자에게 알림 (다른 훅 인스턴스들)
          queryCache.get(cacheKey)?.subscribers.forEach(sub => sub())
        }
      } catch (error) {
        fetchError = error

        if (mountedRef.current) {
          // 실패 시 상태 업데이트
          setState(prev => ({
            ...prev,
            error: fetchError,
            isLoading: false,
            isFetching: false,
            isSuccess: false,
            isError: true,
            // isStale: true, // 에러 시 stale 여부는 정의하기 나름
            status: 'error',
          }))

          // 캐시 업데이트 (에러 정보 포함)
          const cacheEntry = queryCache.get(cacheKey)
          if (cacheEntry) {
            cacheEntry.error = fetchError
            cacheEntry.timestamp = Date.now() // 에러 발생 시간 기록
            delete cacheEntry.promise
          } else {
            queryCache.set(cacheKey, {
              error: fetchError,
              timestamp: Date.now(),
              subscribers: new Set([notify]),
            })
          }

          // 콜백 호출
          optionsRef.current.onError?.(fetchError as TError)
          optionsRef.current.onSettled?.(undefined, fetchError)

          // 구독자에게 알림
          queryCache.get(cacheKey)?.subscribers.forEach(sub => sub())
        }
      } finally {
        // 완료된 promise 캐시에서 제거 (성공/실패 무관하게)
        const finalEntry = queryCache.get(cacheKey)
        if (finalEntry?.promise === fetchPromise) {
          delete finalEntry.promise
        }
        // GC 스케줄링 (fetch 완료 후)
        scheduleGC(cacheKey, optionsRef.current.cacheTime ?? 5 * 60 * 1000)
      }
    },
    [cacheKey, state.isFetching]
  ) // isFetching 추가하여 불필요한 재실행 방지

  // 구독 알림 시 상태 업데이트 함수
  const notify = useCallback(() => {
    const entry = queryCache.get(cacheKey)
    if (!entry) return // 캐시가 GC 등으로 삭제된 경우

    setState(prev => {
      const nextState = {
        ...prev,
        data: entry.data,
        error: entry.error ?? null,
        isLoading: false, // 알림 시점에는 첫 로딩 아님
        isFetching: !!entry.promise, // 진행중인 fetch가 있으면 true
        isSuccess: !!entry.data && !entry.error,
        isError: !!entry.error,
        isStale:
          Date.now() - entry.timestamp > (optionsRef.current.staleTime ?? 0),
        status: entry.error
          ? 'error'
          : ((entry.data ? 'success' : 'loading') as QueryStatus), // loading은 promise 기준?
      }
      // 상태가 실제로 변경되었을 때만 업데이트 (불필요한 리렌더 방지)
      return JSON.stringify(prev) !== JSON.stringify(nextState)
        ? nextState
        : prev
    })
  }, [cacheKey])

  // 마운트 및 enabled 상태 변경 시 실행
  useEffect(() => {
    mountedRef.current = true
    const currentOptions = optionsRef.current // useEffect 클로저 내에서 최신 옵션 사용

    // 구독자 등록
    let entry = queryCache.get(cacheKey)
    if (!entry) {
      entry = { timestamp: 0, subscribers: new Set() }
      queryCache.set(cacheKey, entry)
    }
    entry.subscribers.add(notify)

    // GC 타이머 클리어 (컴포넌트 활성 상태)
    if (entry.gcTimer) {
      clearTimeout(entry.gcTimer)
      entry.gcTimer = undefined
    }

    if (currentOptions.enabled) {
      const entry = queryCache.get(cacheKey)
      // 캐시된 데이터가 없거나 stale 상태이면 fetch
      if (
        !entry ||
        entry.error ||
        Date.now() - entry.timestamp > (currentOptions.staleTime ?? 0)
      ) {
        fetchData()
      } else {
        // fresh한 캐시 데이터가 있으면 상태 동기화 및 isFetching false 처리
        notify() // 최신 캐시 상태 반영
        setState(prev => ({ ...prev, isFetching: false }))
      }
    } else {
      // enabled: false 이면 isFetching 상태 false로 설정
      setState(prev => ({ ...prev, isFetching: false }))
    }

    // --- 추가 기능: Window Focus Refetch ---
    const handleFocus = () => {
      if (
        mountedRef.current &&
        optionsRef.current.enabled &&
        optionsRef.current.refetchOnWindowFocus
      ) {
        const entry = queryCache.get(cacheKey)
        // stale 할 때만 refetch
        if (
          entry &&
          Date.now() - entry.timestamp > (optionsRef.current.staleTime ?? 0)
        ) {
          // console.log('Refetching on window focus...');
          fetchData(true) // 수동 리패치처럼 동작
        }
      }
    }

    if (refetchOnWindowFocus) {
      window.addEventListener('focus', handleFocus)
    }

    // --- 추가 기능: Interval Refetch ---
    let intervalTimer: ReturnType<typeof setInterval> | undefined
    if (
      refetchInterval &&
      typeof refetchInterval === 'number' &&
      refetchInterval > 0
    ) {
      intervalTimer = setInterval(() => {
        if (mountedRef.current && optionsRef.current.enabled) {
          // console.log('Refetching on interval...');
          fetchData(true) // 수동 리패치처럼 동작
        }
      }, refetchInterval)
    }

    // 클린업 함수
    return () => {
      mountedRef.current = false
      const entry = queryCache.get(cacheKey)
      if (entry) {
        entry.subscribers.delete(notify) // 구독 해제
        // 구독자 없으면 GC 스케줄링
        if (entry.subscribers.size === 0) {
          scheduleGC(cacheKey, optionsRef.current.cacheTime ?? 5 * 60 * 1000)
        }
      }
      // 이벤트 리스너 및 인터벌 제거
      if (refetchOnWindowFocus) {
        window.removeEventListener('focus', handleFocus)
      }
      if (intervalTimer) {
        clearInterval(intervalTimer)
      }
      // 진행중인 재시도 타이머 등 정리 (fetchData 내부에서 처리되거나 여기에 추가)
    }
  }, [cacheKey, enabled, fetchData]) // fetchData 추가 (useCallback 의존성)

  // 수동 refetch 함수 업데이트
  // state 객체 내의 refetch를 최신 fetchData로 업데이트
  useEffect(() => {
    setState(prev => ({ ...prev, refetch: () => fetchData(true) }))
  }, [fetchData])

  // 최종 상태 반환 (refetch 함수 포함)
  return state
}

export default useQueryGemini
