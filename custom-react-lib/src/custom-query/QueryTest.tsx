import { useState, useCallback } from 'react'
import useQueryGPT from '../useQuery/useQueryGPT'
import { useQueryClaude } from '../useQuery/useQueryClaude'
import useQueryGemini from '../useQuery/useQueryGemini'
import { useQuery as useQueryGPT2 } from '../useQuery/useQueryGPT2'
import { useQuery as useQueryClaude2 } from '../useQuery/useQueryClaude2'
import { useQuery as useQueryGemini2 } from '../useQuery/useQueryGemini2'

type HookType = 'GPT' | 'Claude' | 'Gemini' | 'GPT2' | 'Claude2' | 'Gemini2'

interface MockResponse {
  message: string
  timestamp: string
}

const QueryTest = () => {
  const [selectedHook, setSelectedHook] = useState<HookType>('GPT')
  const [queryInput, setQueryInput] = useState('')
  const [queryKey, setQueryKey] = useState('')
  const [mockDelay, setMockDelay] = useState(1500)
  const [mockError, setMockError] = useState(false)

  // Mock fetcher function
  const mockFetcher = useCallback(async () => {
    // Simulate API call with artificial delay
    await new Promise((resolve, reject) =>
      setTimeout(() => {
        if (mockError) {
          reject(new Error(`Mock error from ${selectedHook}`))
        } else {
          resolve(null)
        }
      }, mockDelay)
    )

    return {
      message: `Response from ${selectedHook} with query: "${
        queryInput || 'empty query'
      }"`,
      timestamp: new Date().toISOString(),
      hookType: selectedHook,
    } as MockResponse
  }, [selectedHook, queryInput, mockDelay, mockError])

  // Initialize all hooks with the same fetcher
  const gptQuery = useQueryGPT<MockResponse>(
    queryKey || 'default-gpt',
    mockFetcher
  )

  const claudeQuery = useQueryClaude<MockResponse>(
    queryKey || 'default-claude',
    mockFetcher,
    { enabled: selectedHook === 'Claude' }
  )

  const geminiQuery = useQueryGemini<MockResponse>(
    queryKey || 'default-gemini',
    mockFetcher,
    { enabled: selectedHook === 'Gemini' }
  )

  const gpt2Query = useQueryGPT2<MockResponse, Error>(
    queryKey || 'default-gpt2',
    mockFetcher,
    {
      enabled: selectedHook === 'GPT2',
      retry: mockError ? 0 : 3, // Disable retry when mockError is true
    }
  )

  const claude2Query = useQueryClaude2<MockResponse, Error>(
    queryKey || 'default-claude2',
    mockFetcher,
    {
      enabled: selectedHook === 'Claude2',
      retry: mockError ? 0 : 3,
    }
  )

  const gemini2Query = useQueryGemini2<MockResponse, Error>(
    queryKey || 'default-gemini2',
    mockFetcher,
    {
      enabled: selectedHook === 'Gemini2',
      retry: mockError ? 0 : 3,
    }
  )

  // Get the active query based on selected hook
  const getActiveQuery = () => {
    switch (selectedHook) {
      case 'GPT':
        return gptQuery
      case 'Claude':
        return claudeQuery
      case 'Gemini':
        return geminiQuery
      case 'GPT2':
        return gpt2Query
      case 'Claude2':
        return claude2Query
      case 'Gemini2':
        return gemini2Query
      default:
        return gptQuery
    }
  }

  const activeQuery = getActiveQuery()

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQueryKey(`${selectedHook}-${queryInput}-${Date.now()}`)
    // For hooks with refetch method
    if ('refetch' in activeQuery && typeof activeQuery.refetch === 'function') {
      activeQuery.refetch()
    }
  }

  // Check if a property exists on the query object
  const hasProperty = (prop: string) => {
    return prop in activeQuery
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Query Hooks Tester</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Hook:</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              'GPT',
              'Claude',
              'Gemini',
              'GPT2',
              'Claude2',
              'Gemini2',
            ] as HookType[]
          ).map(hook => (
            <button
              key={hook}
              onClick={() => setSelectedHook(hook)}
              className={`px-4 py-2 rounded-md ${
                selectedHook === hook
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {hook}
            </button>
          ))}
        </div>

        <div className="flex items-center mb-4">
          <input
            id="errorToggle"
            type="checkbox"
            checked={mockError}
            onChange={() => setMockError(!mockError)}
            className="mr-2"
          />
          <label htmlFor="errorToggle" className="text-sm">
            Simulate Error
          </label>
        </div>

        <div className="mb-4">
          <label
            htmlFor="delayInput"
            className="block text-sm font-medium mb-2"
          >
            Mock Delay (ms): {mockDelay}
          </label>
          <input
            id="delayInput"
            type="range"
            min="500"
            max="5000"
            step="500"
            value={mockDelay}
            onChange={e => setMockDelay(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label
            htmlFor="queryInput"
            className="block text-sm font-medium mb-2"
          >
            Query Input:
          </label>
          <input
            id="queryInput"
            type="text"
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your query"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={hasProperty('isLoading') && activeQuery.isLoading}
        >
          {hasProperty('isLoading') && activeQuery.isLoading
            ? 'Loading...'
            : 'Submit Query'}
        </button>
      </form>

      <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Response:</h2>

        <div className="mb-4">
          <p>
            <strong>Hook Type:</strong> {selectedHook}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {hasProperty('isLoading') && activeQuery.isLoading
              ? 'Loading...'
              : hasProperty('isError') && activeQuery.isError
              ? 'Error'
              : hasProperty('isSuccess') && activeQuery.isSuccess
              ? 'Success'
              : 'Unknown'}
          </p>
          {hasProperty('error') && activeQuery.error && (
            <p className="text-red-600 mt-2">
              Error: {String(activeQuery.error)}
            </p>
          )}
        </div>

        {hasProperty('data') && activeQuery.data && (
          <div className="bg-white p-4 rounded-md border border-gray-300">
            <pre className="whitespace-pre-wrap overflow-auto">
              {JSON.stringify(activeQuery.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
          <h3 className="text-md font-medium mb-2">Hook Properties:</h3>
          <ul className="text-xs space-y-1">
            {Object.keys(activeQuery).map(key => (
              <li key={key}>
                <strong>{key}:</strong>{' '}
                {typeof activeQuery[key as keyof typeof activeQuery] ===
                'function'
                  ? '[Function]'
                  : JSON.stringify(
                      activeQuery[key as keyof typeof activeQuery]
                    )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default QueryTest
