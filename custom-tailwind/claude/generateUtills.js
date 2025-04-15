/**
 * Tailwind CSS 유틸리티 생성기를 실행하고 결과를 파일로 저장하는 스크립트
 */

const fs = require('fs')
const path = require('path')
const { generateUtilities, defaultConfig } = require('./utility-generator')

// 결과 CSS를 저장할 디렉토리
const OUTPUT_DIR = './dist'

/**
 * 파일 내용에서 Tailwind CSS 클래스 이름을 추출합니다.
 * @param {string} content - 파일 내용
 * @return {Set<string>} 추출된 클래스 이름 집합
 */
function extractClassesFromContent(content) {
  const classNames = new Set()

  // 1. HTML의 class 속성에서 클래스 추출 (class="...")
  const classRegex = /class=["']([^"']+)["']/g
  let match
  while ((match = classRegex.exec(content)) !== null) {
    const classString = match[1]
    const individualClasses = classString.split(/\s+/)
    individualClasses.forEach(cls => {
      if (cls) classNames.add(cls)
    })
  }

  // 2. JSX/TSX에서 클래스 추출 (className="...")
  const classNameRegex = /className=["']([^"']+)["']/g
  while ((match = classNameRegex.exec(content)) !== null) {
    const classString = match[1]
    const individualClasses = classString.split(/\s+/)
    individualClasses.forEach(cls => {
      if (cls) classNames.add(cls)
    })
  }

  // 3. 템플릿 리터럴에서 클래스 추출 (`...${...}...`)
  const templateRegex = /`[^`]*`/g
  while ((match = templateRegex.exec(content)) !== null) {
    const template = match[0]
    const templateClasses = extractClassesFromTemplate(template)
    templateClasses.forEach(cls => classNames.add(cls))
  }

  // 4. 문자열에서 클래스 추출 (문자열 내에 클래스 이름이 있을 수 있음)
  const stringRegex = /["']([^"']+)["']/g
  while ((match = stringRegex.exec(content)) !== null) {
    const str = match[1]
    // 문자열이 공백을 포함하고 Tailwind 클래스처럼 보이면 처리
    if (str.includes(' ') && isTailwindClassPattern(str)) {
      const possibleClasses = str.split(/\s+/)
      possibleClasses.forEach(cls => {
        if (cls && isTailwindClassPattern(cls)) classNames.add(cls)
      })
    }
  }

  return classNames
}

/**
 * 템플릿 리터럴 문자열에서 클래스 이름을 추출합니다.
 * @param {string} template - 템플릿 리터럴 문자열
 * @return {Set<string>} 추출된 클래스 이름 집합
 */
function extractClassesFromTemplate(template) {
  const classNames = new Set()

  // 템플릿에서 'class' 또는 'className' 키워드 찾기
  if (template.includes('class') || template.includes('className')) {
    // 단순화된 접근법: 템플릿에서 단어 추출 후 Tailwind 클래스처럼 보이는지 확인
    const words = template.split(/[\s{}$+\-*/%&|^<>=!?:;,.()[\]`'"]+/)
    words.forEach(word => {
      if (isTailwindClassPattern(word)) {
        classNames.add(word)
      }
    })
  }

  return classNames
}

/**
 * 문자열이 Tailwind 클래스 패턴과 일치하는지 확인합니다.
 * @param {string} str - 확인할 문자열
 * @return {boolean} Tailwind 클래스 패턴인 경우 true
 */
function isTailwindClassPattern(str) {
  // Tailwind 클래스 패턴에 대한 간단한 휴리스틱
  // 실제 구현에서는 더 복잡한 검사가 필요할 수 있음

  // 일반적인 Tailwind 접두사 패턴
  const prefixPatterns = [
    /^(m|p)[trblxy]?-\d+$/, // 마진, 패딩
    /^(w|h)-\d+$/, // 너비, 높이
    /^(bg|text|border)-/, // 배경, 텍스트, 테두리 색상
    /^(flex|grid|block|inline|hidden)$/, // 디스플레이
    /^(rounded|shadow|font|text|align|justify|items|content)-/, // 기타 일반적인 유틸리티
    /^(hover|focus|active|group-hover|md|lg|xl):/, // 변형자
  ]

  return prefixPatterns.some(pattern => pattern.test(str))
}

/**
 * CSS에서 사용하지 않는 선택자를 제거합니다.
 * @param {string} css - CSS 문자열
 * @param {Set<string>} usedClasses - 사용된 클래스 이름 집합
 * @return {string} 최적화된 CSS 문자열
 */
function purgeUnusedCSS(css, contentFiles) {
  // 모든 콘텐츠 파일에서 사용된 클래스 추출
  const usedClasses = new Set()

  contentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8')
      const extractedClasses = extractClassesFromContent(content)
      extractedClasses.forEach(cls => usedClasses.add(cls))
    } catch (error) {
      console.error(`파일 읽기 오류 (${file}):`, error)
    }
  })

  console.log(`추출된 클래스 수: ${usedClasses.size}`)

  // CSS를 규칙 단위로 분할
  const cssRules = css.split(/}\s*/).filter(rule => rule.trim())

  // 사용된 클래스만 포함하는 CSS 규칙 필터링
  const purgedRules = cssRules.filter(rule => {
    // 미디어 쿼리 및 keyframes와 같은 규칙은 항상 유지
    if (
      rule.includes('@media') ||
      rule.includes('@keyframes') ||
      !rule.includes('{')
    ) {
      return true
    }

    // 선택자 부분 추출
    const selectorPart = rule.split('{')[0].trim()

    // 여러 선택자가 있을 경우 쉼표로 분리
    const selectors = selectorPart.split(',').map(s => s.trim())

    // 선택자 중 하나라도 사용된 클래스와 일치하면 규칙 유지
    return selectors.some(selector => {
      // 선택자에서 클래스 이름 추출 (점 뒤의 텍스트)
      const classMatch = selector.match(/\.([^.:\s]+)(?::|\s|$|::)/)
      if (!classMatch) return false

      const className = classMatch[1]

      // \를 포함하는 경우 이스케이프된 문자 처리 (예: md\:text-blue)
      const normalizedClassName = className.replace(/\\/g, '')

      return usedClasses.has(normalizedClassName)
    })
  })

  // 규칙 뒤에 닫는 중괄호를 추가하고 연결
  const purgedCSS = purgedRules.map(rule => rule + '}').join('\n')

  console.log(`원래 CSS 크기: ${css.length} 바이트`)
  console.log(`최적화된 CSS 크기: ${purgedCSS.length} 바이트`)
  console.log(`절약: ${Math.round((1 - purgedCSS.length / css.length) * 100)}%`)

  return purgedCSS
}

// 기본 설정으로 유틸리티 생성
function buildDefaultCSS() {
  console.log('기본 Tailwind CSS 생성 중...')
  const css = generateUtilities()

  // 출력 디렉토리가 존재하는지 확인하고 없으면 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // CSS 파일 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'your-tailwind.css'), css)
  console.log('CSS 생성 완료: ./dist/your-tailwind.css')

  return css
}

// 사용자 정의 설정으로 유틸리티 생성
function buildCustomCSS(customConfig) {
  console.log('사용자 정의 Tailwind CSS 생성 중...')
  const css = generateUtilities(customConfig)

  // 출력 디렉토리가 존재하는지 확인하고 없으면 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // CSS 파일 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'custom-tailwind.css'), css)
  console.log('CSS 생성 완료: ./dist/custom-tailwind.css')

  return css
}

// 반응형 변형자를 추가한 CSS 생성
function buildWithResponsiveVariants() {
  console.log('반응형 변형자를 포함한 Tailwind CSS 생성 중...')

  // 기본 CSS 생성
  let css = generateUtilities()

  // 반응형 변형자 추가
  const responsiveCSS = generateResponsiveVariants(defaultConfig)
  css += responsiveCSS

  // CSS 파일 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'responsive-tailwind.css'), css)
  console.log('CSS 생성 완료: ./dist/responsive-tailwind.css')

  return css
}

/**
 * 반응형 변형자를 생성합니다.
 * @param {Object} config - 설정 객체
 * @return {string} 생성된 CSS 문자열
 */
function generateResponsiveVariants(config) {
  let css = '\n/* 반응형 변형자 */\n'

  // 화면 크기별로 미디어 쿼리 생성
  for (const [breakpointName, breakpointValue] of Object.entries(
    config.screens
  )) {
    css += `\n@media (min-width: ${breakpointValue}) {\n`

    // 색상 유틸리티의 반응형 변형자
    for (const [colorName, colorValue] of Object.entries(config.colors)) {
      css += `  .${breakpointName}\\:text-${colorName} { color: ${colorValue}; }\n`
      css += `  .${breakpointName}\\:bg-${colorName} { background-color: ${colorValue}; }\n`
    }

    // 간격 유틸리티의 반응형 변형자 (일부만 구현)
    for (const [spaceName, spaceValue] of Object.entries(config.spacing)) {
      css += `  .${breakpointName}\\:p-${spaceName} { padding: ${spaceValue}; }\n`
      css += `  .${breakpointName}\\:m-${spaceName} { margin: ${spaceValue}; }\n`
    }

    // 디스플레이 유틸리티의 반응형 변형자
    const displays = ['block', 'flex', 'grid', 'hidden']
    for (const display of displays) {
      css += `  .${breakpointName}\\:${display} { display: ${
        display === 'hidden' ? 'none' : display
      }; }\n`
    }

    // Flex 방향의 반응형 변형자
    css += `  .${breakpointName}\\:flex-row { flex-direction: row; }\n`
    css += `  .${breakpointName}\\:flex-col { flex-direction: column; }\n`

    css += '}\n'
  }

  return css
}

/**
 * 상태 변형자를 생성합니다.
 * @param {Object} config - 설정 객체
 * @return {string} 생성된 CSS 문자열
 */
function generateStateVariants(config) {
  let css = '\n/* 상태 변형자 */\n'

  // hover 변형자
  for (const [colorName, colorValue] of Object.entries(config.colors)) {
    css += `.hover\\:text-${colorName}:hover { color: ${colorValue}; }\n`
    css += `.hover\\:bg-${colorName}:hover { background-color: ${colorValue}; }\n`
  }

  // focus 변형자
  for (const [colorName, colorValue] of Object.entries(config.colors)) {
    css += `.focus\\:text-${colorName}:focus { color: ${colorValue}; }\n`
    css += `.focus\\:bg-${colorName}:focus { background-color: ${colorValue}; }\n`
    css += `.focus\\:border-${colorName}:focus { border-color: ${colorValue}; }\n`
  }

  // focus-within 변형자
  for (const [colorName, colorValue] of Object.entries(config.colors)) {
    css += `.focus-within\\:border-${colorName}:focus-within { border-color: ${colorValue}; }\n`
  }

  // active 변형자
  for (const [colorName, colorValue] of Object.entries(config.colors)) {
    css += `.active\\:bg-${colorName}:active { background-color: ${colorValue}; }\n`
  }

  // group-hover 변형자 (그룹 변형자)
  css += `.group:hover .group-hover\\:text-black { color: #000000; }\n`
  css += `.group:hover .group-hover\\:bg-gray-100 { background-color: #f3f4f6; }\n`

  return css
}

// 상태 변형자를 추가한 CSS 생성
function buildWithStateVariants() {
  console.log('상태 변형자를 포함한 Tailwind CSS 생성 중...')

  // 기본 CSS 생성
  let css = generateUtilities()

  // 상태 변형자 추가
  const stateCSS = generateStateVariants(defaultConfig)
  css += stateCSS

  // CSS 파일 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'state-variants-tailwind.css'), css)
  console.log('CSS 생성 완료: ./dist/state-variants-tailwind.css')

  return css
}

// 전체 기능을 포함한 CSS 생성 (기본 + 반응형 + 상태 변형자)
function buildFullTailwind(contentFiles) {
  console.log('전체 기능을 포함한 Tailwind CSS 생성 중...')

  // 기본 CSS 생성
  let css = generateUtilities()

  // 반응형 변형자 추가
  const responsiveCSS = generateResponsiveVariants(defaultConfig)
  css += responsiveCSS

  // 상태 변형자 추가
  const stateCSS = generateStateVariants(defaultConfig)
  css += stateCSS

  // 사용하지 않는 CSS 제거 (Purge CSS)
  if (contentFiles && contentFiles.length > 0) {
    console.log('사용하지 않는 CSS 제거 중...')
    css = purgeUnusedCSS(css, contentFiles)
  }

  // CSS 파일 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'full-tailwind.css'), css)
  console.log('CSS 생성 완료: ./dist/full-tailwind.css')

  return css
}

// HTML 템플릿 복사 및 CSS 경로 업데이트
function copyAndUpdateHtmlTemplate(cssFilename = 'full-tailwind.css') {
  console.log('HTML 템플릿 복사 및 CSS 경로 업데이트 중...')

  // 템플릿 읽기
  const templatePath = path.join(__dirname, 'tailwind-template.html')
  let templateContent = fs.readFileSync(templatePath, 'utf8')

  // CSS 경로 업데이트
  templateContent = templateContent.replace(
    /href="\.\/your-tailwind\.css"/,
    `href="./${cssFilename}"`
  )

  // 업데이트된 HTML 저장
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), templateContent)
  console.log('HTML 템플릿 업데이트 완료: ./dist/index.html')
}

// 사용자 정의 설정 예시
const customConfig = {
  colors: {
    'brand-primary': '#4f46e5', // 인디고
    'brand-secondary': '#0ea5e9', // 스카이 블루
    'brand-accent': '#f59e0b', // 앰버
  },
  spacing: {
    xl: '10rem',
    '2xl': '20rem',
    '3xl': '30rem',
  },
}

// 메인 실행 코드
function main() {
  // HTML 및 기타 콘텐츠 파일 목록
  const contentFiles = [
    'tailwind-template.html',
    // 다른 HTML, JS 파일 등을 추가할 수 있습니다
  ]

  // 1. 기본 CSS 생성
  buildDefaultCSS()

  // 2. 사용자 정의 CSS 생성
  buildCustomCSS(customConfig)

  // 3. 반응형 변형자를 포함한 CSS 생성
  buildWithResponsiveVariants()

  // 4. 상태 변형자를 포함한 CSS 생성
  buildWithStateVariants()

  // 5. 전체 기능을 포함한 CSS 생성
  buildFullTailwind(contentFiles)

  // 6. HTML 템플릿 복사 및 업데이트
  copyAndUpdateHtmlTemplate('full-tailwind.css')

  console.log('\n모든 작업이 완료되었습니다!')
  console.log('브라우저에서 ./dist/index.html 파일을 열어 결과를 확인하세요.')
}

// 실행
main()
