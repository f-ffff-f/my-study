/**
 * 기본 Tailwind CSS 유틸리티 생성기
 * 설정 객체를 기반으로 CSS 유틸리티 클래스를 생성합니다.
 */

// 기본 설정 객체
const defaultConfig = {
  // 색상 팔레트
  colors: {
    black: '#000000',
    white: '#ffffff',
    'gray-100': '#f3f4f6',
    'gray-200': '#e5e7eb',
    'gray-300': '#d1d5db',
    'gray-400': '#9ca3af',
    'gray-500': '#6b7280',
    'gray-600': '#4b5563',
    'gray-700': '#374151',
    'gray-800': '#1f2937',
    'gray-900': '#111827',
    'red-100': '#fee2e2',
    'red-500': '#ef4444',
    'red-700': '#b91c1c',
    'blue-100': '#dbeafe',
    'blue-500': '#3b82f6',
    'blue-700': '#1d4ed8',
    'green-100': '#dcfce7',
    'green-500': '#22c55e',
    'green-700': '#15803d',
    'yellow-100': '#fef9c3',
    'yellow-500': '#eab308',
    'yellow-700': '#a16207',
    'purple-500': '#a855f7',
    'pink-500': '#ec4899',
  },

  // 간격 시스템 (margin, padding 등에 사용)
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },

  // 글꼴 크기
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },

  // 폰트 두께
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // 테두리 둥글기
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },

  // 반응형 화면 크기
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}

/**
 * CSS 유틸리티 클래스를 생성합니다.
 * @param {Object} config - 설정 객체
 * @return {string} 생성된 CSS 문자열
 */
function generateUtilities(config = {}) {
  // 설정 합치기 (사용자 설정 + 기본 설정)
  const mergedConfig = mergeConfig(defaultConfig, config)

  // CSS 문자열을 저장할 변수
  let css = ''

  // 색상 유틸리티 생성
  css += generateColorUtilities(mergedConfig.colors)

  // 간격 유틸리티 생성
  css += generateSpacingUtilities(mergedConfig.spacing)

  // 글꼴 크기 유틸리티 생성
  css += generateFontSizeUtilities(mergedConfig.fontSize)

  // 글꼴 두께 유틸리티 생성
  css += generateFontWeightUtilities(mergedConfig.fontWeight)

  // 테두리 둥글기 유틸리티 생성
  css += generateBorderRadiusUtilities(mergedConfig.borderRadius)

  // 디스플레이 유틸리티 생성
  css += generateDisplayUtilities()

  // Flexbox 유틸리티 생성
  css += generateFlexUtilities()

  // 그리드 유틸리티 생성
  css += generateGridUtilities()

  // 너비와 높이 유틸리티
  css += generateSizingUtilities()

  return css
}

/**
 * 두 설정 객체를 병합합니다.
 * @param {Object} defaultConfig - 기본 설정
 * @param {Object} userConfig - 사용자 설정
 * @return {Object} 병합된 설정
 */
function mergeConfig(defaultConfig, userConfig) {
  const merged = { ...defaultConfig }

  // 각 최상위 키에 대해 병합 수행
  for (const key in userConfig) {
    if (typeof userConfig[key] === 'object' && userConfig[key] !== null) {
      merged[key] = { ...defaultConfig[key], ...userConfig[key] }
    } else {
      merged[key] = userConfig[key]
    }
  }

  return merged
}

/**
 * 색상 관련 유틸리티를 생성합니다.
 * @param {Object} colors - 색상 설정
 * @return {string} 생성된 CSS 문자열
 */
function generateColorUtilities(colors) {
  let css = '/* 색상 유틸리티 */\n'

  // 각 색상에 대해 유틸리티 생성
  for (const [colorName, colorValue] of Object.entries(colors)) {
    // 텍스트 색상
    css += `.text-${colorName} { color: ${colorValue}; }\n`

    // 배경 색상
    css += `.bg-${colorName} { background-color: ${colorValue}; }\n`

    // 테두리 색상
    css += `.border-${colorName} { border-color: ${colorValue}; }\n`
  }

  return css + '\n'
}

/**
 * 간격 관련 유틸리티를 생성합니다. (마진, 패딩)
 * @param {Object} spacing - 간격 설정
 * @return {string} 생성된 CSS 문자열
 */
function generateSpacingUtilities(spacing) {
  let css = '/* 간격 유틸리티 */\n'

  // 각 간격에 대해 유틸리티 생성
  for (const [size, value] of Object.entries(spacing)) {
    // 패딩 (모든 방향)
    css += `.p-${size} { padding: ${value}; }\n`

    // 패딩 (개별 방향)
    css += `.pt-${size} { padding-top: ${value}; }\n`
    css += `.pr-${size} { padding-right: ${value}; }\n`
    css += `.pb-${size} { padding-bottom: ${value}; }\n`
    css += `.pl-${size} { padding-left: ${value}; }\n`

    // 패딩 (수평, 수직)
    css += `.px-${size} { padding-left: ${value}; padding-right: ${value}; }\n`
    css += `.py-${size} { padding-top: ${value}; padding-bottom: ${value}; }\n`

    // 마진 (모든 방향)
    css += `.m-${size} { margin: ${value}; }\n`

    // 마진 (개별 방향)
    css += `.mt-${size} { margin-top: ${value}; }\n`
    css += `.mr-${size} { margin-right: ${value}; }\n`
    css += `.mb-${size} { margin-bottom: ${value}; }\n`
    css += `.ml-${size} { margin-left: ${value}; }\n`

    // 마진 (수평, 수직)
    css += `.mx-${size} { margin-left: ${value}; margin-right: ${value}; }\n`
    css += `.my-${size} { margin-top: ${value}; margin-bottom: ${value}; }\n`
  }

  // 특수 마진 (auto)
  css += `.m-auto { margin: auto; }\n`
  css += `.mx-auto { margin-left: auto; margin-right: auto; }\n`
  css += `.my-auto { margin-top: auto; margin-bottom: auto; }\n`

  return css + '\n'
}

/**
 * 글꼴 크기 유틸리티를 생성합니다.
 * @param {Object} fontSizes - 글꼴 크기 설정
 * @return {string} 생성된 CSS 문자열
 */
function generateFontSizeUtilities(fontSizes) {
  let css = '/* 글꼴 크기 유틸리티 */\n'

  for (const [size, value] of Object.entries(fontSizes)) {
    css += `.text-${size} { font-size: ${value}; }\n`
  }

  return css + '\n'
}

/**
 * 글꼴 두께 유틸리티를 생성합니다.
 * @param {Object} fontWeights - 글꼴 두께 설정
 * @return {string} 생성된 CSS 문자열
 */
function generateFontWeightUtilities(fontWeights) {
  let css = '/* 글꼴 두께 유틸리티 */\n'

  for (const [weight, value] of Object.entries(fontWeights)) {
    css += `.font-${weight} { font-weight: ${value}; }\n`
  }

  return css + '\n'
}

/**
 * 테두리 둥글기 유틸리티를 생성합니다.
 * @param {Object} radiusValues - 테두리 둥글기 설정
 * @return {string} 생성된 CSS 문자열
 */
function generateBorderRadiusUtilities(radiusValues) {
  let css = '/* 테두리 둥글기 유틸리티 */\n'

  for (const [size, value] of Object.entries(radiusValues)) {
    if (size === 'DEFAULT') {
      css += `.rounded { border-radius: ${value}; }\n`
    } else {
      css += `.rounded-${size} { border-radius: ${value}; }\n`
    }
  }

  // 개별 모서리 둥글기
  for (const [size, value] of Object.entries(radiusValues)) {
    if (size === 'DEFAULT') continue

    css += `.rounded-t-${size} { border-top-left-radius: ${value}; border-top-right-radius: ${value}; }\n`
    css += `.rounded-r-${size} { border-top-right-radius: ${value}; border-bottom-right-radius: ${value}; }\n`
    css += `.rounded-b-${size} { border-bottom-left-radius: ${value}; border-bottom-right-radius: ${value}; }\n`
    css += `.rounded-l-${size} { border-top-left-radius: ${value}; border-bottom-left-radius: ${value}; }\n`
  }

  return css + '\n'
}

/**
 * 디스플레이 속성 유틸리티를 생성합니다.
 * @return {string} 생성된 CSS 문자열
 */
function generateDisplayUtilities() {
  let css = '/* 디스플레이 유틸리티 */\n'

  const displays = [
    'block',
    'inline-block',
    'inline',
    'flex',
    'inline-flex',
    'grid',
    'inline-grid',
    'table',
    'hidden',
  ]

  for (const display of displays) {
    css += `.${display} { display: ${
      display === 'hidden' ? 'none' : display
    }; }\n`
  }

  return css + '\n'
}

/**
 * Flexbox 관련 유틸리티를 생성합니다.
 * @return {string} 생성된 CSS 문자열
 */
function generateFlexUtilities() {
  let css = '/* Flexbox 유틸리티 */\n'

  // Flex 방향
  css += `.flex-row { flex-direction: row; }\n`
  css += `.flex-row-reverse { flex-direction: row-reverse; }\n`
  css += `.flex-col { flex-direction: column; }\n`
  css += `.flex-col-reverse { flex-direction: column-reverse; }\n`

  // Flex 래핑
  css += `.flex-wrap { flex-wrap: wrap; }\n`
  css += `.flex-nowrap { flex-wrap: nowrap; }\n`
  css += `.flex-wrap-reverse { flex-wrap: wrap-reverse; }\n`

  // Flex 아이템 크기
  css += `.flex-1 { flex: 1 1 0%; }\n`
  css += `.flex-auto { flex: 1 1 auto; }\n`
  css += `.flex-initial { flex: 0 1 auto; }\n`
  css += `.flex-none { flex: none; }\n`

  // 정렬 - 주축
  css += `.justify-start { justify-content: flex-start; }\n`
  css += `.justify-end { justify-content: flex-end; }\n`
  css += `.justify-center { justify-content: center; }\n`
  css += `.justify-between { justify-content: space-between; }\n`
  css += `.justify-around { justify-content: space-around; }\n`
  css += `.justify-evenly { justify-content: space-evenly; }\n`

  // 정렬 - 교차축
  css += `.items-start { align-items: flex-start; }\n`
  css += `.items-end { align-items: flex-end; }\n`
  css += `.items-center { align-items: center; }\n`
  css += `.items-baseline { align-items: baseline; }\n`
  css += `.items-stretch { align-items: stretch; }\n`

  // 개별 아이템 정렬
  css += `.self-auto { align-self: auto; }\n`
  css += `.self-start { align-self: flex-start; }\n`
  css += `.self-end { align-self: flex-end; }\n`
  css += `.self-center { align-self: center; }\n`
  css += `.self-stretch { align-self: stretch; }\n`

  return css + '\n'
}

/**
 * Grid 관련 유틸리티를 생성합니다.
 * @return {string} 생성된 CSS 문자열
 */
function generateGridUtilities() {
  let css = '/* Grid 유틸리티 */\n'

  // Grid 템플릿 열
  for (let i = 1; i <= 12; i++) {
    css += `.grid-cols-${i} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }\n`
  }

  // Grid 열 시작/끝
  for (let i = 1; i <= 13; i++) {
    css += `.col-start-${i} { grid-column-start: ${i}; }\n`
    css += `.col-end-${i} { grid-column-end: ${i}; }\n`
  }

  // Grid 열 스팬
  for (let i = 1; i <= 12; i++) {
    css += `.col-span-${i} { grid-column: span ${i} / span ${i}; }\n`
  }

  // Grid 간격
  css += `.gap-1 { gap: 0.25rem; }\n`
  css += `.gap-2 { gap: 0.5rem; }\n`
  css += `.gap-4 { gap: 1rem; }\n`
  css += `.gap-6 { gap: 1.5rem; }\n`
  css += `.gap-8 { gap: 2rem; }\n`

  return css + '\n'
}

/**
 * 크기 관련 유틸리티를 생성합니다. (너비, 높이)
 * @return {string} 생성된 CSS 문자열
 */
function generateSizingUtilities() {
  let css = '/* 크기 유틸리티 */\n'

  // 반응형 너비 값
  const widths = {
    auto: 'auto',
    full: '100%',
    screen: '100vw',
    '1/2': '50%',
    '1/3': '33.333333%',
    '2/3': '66.666667%',
    '1/4': '25%',
    '3/4': '75%',
  }

  // 너비 유틸리티
  for (const [name, value] of Object.entries(widths)) {
    css += `.w-${name} { width: ${value}; }\n`
  }

  // 고정 너비
  for (let i = 1; i <= 12; i++) {
    css += `.w-${i} { width: ${i * 0.25}rem; }\n`
  }

  // 높이 유틸리티
  for (const [name, value] of Object.entries(widths)) {
    css += `.h-${name} { height: ${value}; }\n`
  }

  // 고정 높이
  for (let i = 1; i <= 12; i++) {
    css += `.h-${i} { height: ${i * 0.25}rem; }\n`
  }

  // 최소/최대 높이 및 너비
  css += `.min-h-screen { min-height: 100vh; }\n`
  css += `.min-w-full { min-width: 100%; }\n`
  css += `.max-w-full { max-width: 100%; }\n`
  css += `.max-w-screen-sm { max-width: 640px; }\n`
  css += `.max-w-screen-md { max-width: 768px; }\n`
  css += `.max-w-screen-lg { max-width: 1024px; }\n`
  css += `.max-w-screen-xl { max-width: 1280px; }\n`

  return css + '\n'
}

// 유틸리티 생성 함수를 내보냅니다.
module.exports = {
  generateUtilities,
  defaultConfig,
}

// 기본 설정으로 유틸리티를 생성하는 예시
const css = generateUtilities()
// console.log(css) // 결과 CSS 출력

// 설정을 커스터마이징하는 예시
const customConfig = {
  colors: {
    'brand-primary': '#ff0000',
    'brand-secondary': '#00ff00',
  },
  spacing: {
    xl: '10rem',
  },
}

const customCss = generateUtilities(customConfig)
// console.log(customCss); // 커스텀 설정으로 생성된 CSS 출력
