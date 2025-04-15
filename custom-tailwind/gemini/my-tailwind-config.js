// my-tailwind-config.js

const config = {
  // highlight-start
  content: [
    './*.html', // 현재 디렉토리의 모든 .html 파일을 스캔합니다.
    // 필요하다면 다른 패턴도 추가하세요. 예: './src/**/*.js'
  ],
  theme: {
    screens: {
      md: '768px',
      lg: '1024px',
    },
    colors: {
      // 예제에서 사용된 색상 + 필요한 상태 색상
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      gray: {
        100: '#f3f4f6', // bg-gray-100, hover:bg-gray-100
        300: '#d1d5db', // border-gray-300
        600: '#4b5563', // text-gray-600
        800: '#1f2937', // bg-gray-800, text-gray-800
      },
      blue: {
        100: '#dbeafe', // bg-blue-100
        200: '#bfdbfe', // bg-blue-200, focus:ring-blue-200
        300: '#93c5fd', // bg-blue-300
        500: '#3b82f6', // bg-blue-500, md:bg-blue-500, focus:border-blue-500
        700: '#1d4ed8', // hover:bg-blue-700
      },
      red: {
        500: '#ef4444', // bg-red-500
      },
      green: {
        500: '#22c55e', // bg-green-500, lg:bg-green-500
      },
      yellow: {
        500: '#eab308', // bg-yellow-500
      },
      purple: {
        500: '#a855f7', // bg-purple-500
      },
      pink: {
        500: '#ec4899', // bg-pink-500
      },
    },
    spacing: {
      // 예제에서 사용된 간격 값 (Tailwind 기본값 기준)
      0: '0px',
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      4: '1rem', // 16px (p-4, mb-4, gap-4, py-2, px-4, space-y-4)
      6: '1.5rem', // 24px (mb-6)
      8: '2rem', // 32px (p-8, mb-8, mt-8)
      auto: 'auto', // mx-auto
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: '400', // 기본값 (명시적으로 사용되진 않음)
      semibold: '600',
      bold: '700',
    },
    borderRadius: {
      DEFAULT: '0.25rem', // .rounded
      md: '0.375rem', // input 예제 기본값
      lg: '0.5rem', // .rounded-lg (예제엔 없지만 흔히 사용)
    },
    borderWidth: {
      DEFAULT: '1px', // .border
    },
    boxShadow: {
      // Tailwind CSS의 box-shadow 정의 방식 모방 (CSS 변수 사용)
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
    ringWidth: {
      // focus:ring 용
      DEFAULT: '3px', // Tailwind 기본값 유사하게
    },
    ringColor: {
      // focus:ring-blue-200 용 (실제로는 theme('colors') 참조)
      // colors 객체에서 직접 참조하도록 generator 수정 필요, 여기선 단순화
      'blue-200': '#bfdbfe',
    },
    minHeight: {
      screen: '100vh',
    },
    container: {
      // .container 클래스 설정
      center: true, // mx-auto 적용 여부
      padding: '1rem', // 기본 패딩 (px-4와 유사하게 동작)
      // maxWidth는 screens 값을 기반으로 generator에서 처리
    },
    // 필요한 다른 테마 값들 추가 가능 (예: fontFamily, letterSpacing 등)
  },
}

module.exports = config
