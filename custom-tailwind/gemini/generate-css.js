// generate-css.js
const fs = require('fs')
const path = require('path')
const glob = require('glob') // glob 패키지 사용
const config = require('./my-tailwind-config.js')

// --- Helper Functions ---

function escapeClassName(className) {
  return className.replace(/[:/.]/g, '\\$&')
}

// highlight-start
// 파일 내용에서 클래스 이름 추출하는 함수
function extractClassesFromContent(contentPatterns) {
  const usedClasses = new Set()
  // Tailwind에서 사용하는 정규표현식과 유사 (넓은 범위)
  const classRegex = /[^\s"'`<>]+/g

  contentPatterns.forEach(pattern => {
    const files = glob.sync(pattern) // 패턴에 맞는 파일 목록 가져오기
    files.forEach(file => {
      try {
        const fileContent = fs.readFileSync(file, 'utf8')
        const matches = fileContent.match(classRegex) || []
        matches.forEach(match => usedClasses.add(match))
      } catch (err) {
        console.error(`Error reading file ${file}:`, err)
      }
    })
  })
  // console.log('Extracted potential classes:', usedClasses); // 디버깅용
  return usedClasses
}
// highlight-end

// --- Modified Generator Functions (with usedClassNames check) ---

function generateColorUtilities(themeColors, property, prefix, usedClassNames) {
  // usedClassNames 추가
  let css = ''
  for (const colorName in themeColors) {
    if (typeof themeColors[colorName] === 'string') {
      // highlight-start
      const rawClassName = `${prefix}-${colorName}`
      if (usedClassNames.has(rawClassName)) {
        // 사용된 클래스인지 확인
        const escapedClassName = escapeClassName(rawClassName)
        css += `.${escapedClassName} { ${property}: ${themeColors[colorName]}; }\n`
      }
      // highlight-end
    } else {
      for (const shade in themeColors[colorName]) {
        // highlight-start
        const rawClassName = `${prefix}-${colorName}-${shade}`
        if (usedClassNames.has(rawClassName)) {
          const escapedClassName = escapeClassName(rawClassName)
          const colorValue = themeColors[colorName][shade]
          css += `.${escapedClassName} { ${property}: ${colorValue}; }\n`
        }
        // highlight-end
      }
    }
  }
  return css
}

function generateSpacingUtilities(
  themeSpacing,
  propertyPrefix,
  cssProperty,
  usedClassNames
) {
  // usedClassNames 추가
  let css = ''
  const directions = {
    '': '',
    t: '-top',
    b: '-bottom',
    l: '-left',
    r: '-right',
    x: ['-left', '-right'],
    y: ['-top', '-bottom'],
  }

  for (const spacingKey in themeSpacing) {
    const spacingValue = themeSpacing[spacingKey]
    for (const dirKey in directions) {
      // highlight-start
      const rawClassName = `${propertyPrefix}${dirKey}-${spacingKey}`
      if (usedClassNames.has(rawClassName)) {
        const escapedClassName = escapeClassName(rawClassName)
        const cssSuffix = directions[dirKey]

        if (Array.isArray(cssSuffix)) {
          css += `.${escapedClassName} {\n`
          cssSuffix.forEach(suffix => {
            css += `  ${cssProperty}${suffix}: ${spacingValue};\n`
          })
          css += `}\n`
        } else {
          css += `.${escapedClassName} { ${cssProperty}${cssSuffix}: ${spacingValue}; }\n`
        }
      }
      // highlight-end
    }
  }
  return css
}

function generateSpaceUtilities(themeSpacing, usedClassNames) {
  // usedClassNames 추가
  let css = ''
  const selectorSuffix = '> :not([hidden]) ~ :not([hidden])'

  for (const spacingKey in themeSpacing) {
    const spacingValue = themeSpacing[spacingKey]
    if (spacingKey === 'auto') continue

    // space-y
    // highlight-start
    const rawClassNameY = `space-y-${spacingKey}`
    if (usedClassNames.has(rawClassNameY)) {
      const classNameY = escapeClassName(rawClassNameY)
      css += `.${classNameY}${selectorSuffix} { --tw-space-y-reverse: 0; margin-top: calc(${spacingValue} * calc(1 - var(--tw-space-y-reverse))); margin-bottom: calc(${spacingValue} * var(--tw-space-y-reverse)); }\n`
    }
    // highlight-end

    // space-x
    // highlight-start
    const rawClassNameX = `space-x-${spacingKey}`
    if (usedClassNames.has(rawClassNameX)) {
      const classNameX = escapeClassName(rawClassNameX)
      css += `.${classNameX}${selectorSuffix} { --tw-space-x-reverse: 0; margin-right: calc(${spacingValue} * var(--tw-space-x-reverse)); margin-left: calc(${spacingValue} * calc(1 - var(--tw-space-x-reverse))); }\n`
    }
    // highlight-end
  }
  // 이 변수 정의는 항상 포함하는 것이 안전합니다.
  // if (css) { // space-* 유틸리티가 하나라도 생성되었을 때만 추가
  //    css += `:root { --tw-space-y-reverse: 0; --tw-space-x-reverse: 0; }\n`
  // }
  return css
}

// --- CSS Generation ---

// highlight-start
// 1. Extract used class names from content files
const usedClassNames = extractClassesFromContent(config.content)
// highlight-end

let outputCss = `
/* Generated CSS - Purged */

/* Basic Reset / Preflight (Always include) */
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: ${
  config.theme.colors.gray?.[300] || '#d1d5db'
}; }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; font-feature-settings: normal; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
body { margin: 0; }

/* CSS Variable Defaults (Always include for safety) */
:root {
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-ring-color: rgba(59, 130, 246, 0.5);
  --tw-ring-offset-width: 0px;
  --tw-space-y-reverse: 0;
  --tw-space-x-reverse: 0;
}

`

const theme = config.theme

// --- Base Utilities Generation (Passing usedClassNames) ---
outputCss += '/* Base Utilities */\n'
outputCss += generateColorUtilities(
  theme.colors,
  'background-color',
  'bg',
  usedClassNames
)
outputCss += generateColorUtilities(
  theme.colors,
  'color',
  'text',
  usedClassNames
)
outputCss += generateColorUtilities(
  theme.colors,
  'border-color',
  'border',
  usedClassNames
)

outputCss += generateSpacingUtilities(
  theme.spacing,
  'p',
  'padding',
  usedClassNames
)
outputCss += generateSpacingUtilities(
  theme.spacing,
  'm',
  'margin',
  usedClassNames
)
outputCss += generateSpacingUtilities(
  theme.spacing,
  'gap',
  'gap',
  usedClassNames
)
outputCss += generateSpaceUtilities(theme.spacing, usedClassNames)

// --- Static Base Utilities (Check if used) ---
const staticClasses = {
  'min-h-screen': `.min-h-screen { min-height: ${
    theme.minHeight?.screen || '100vh'
  }; }`,
  'w-full': '.w-full { width: 100%; }',
  container: `.container { width: 100%; ${
    theme.container?.center ? 'margin-right: auto; margin-left: auto;' : ''
  } ${
    theme.container?.padding
      ? `padding-right: ${theme.container.padding}; padding-left: ${theme.container.padding};`
      : ''
  } }`, // container max-width는 반응형에서 처리
  flex: '.flex { display: flex; }',
  'flex-col': '.flex-col { flex-direction: column; }',
  'flex-row': '.flex-row { flex-direction: row; }',
  grid: '.grid { display: grid; }',
  'flex-1': '.flex-1 { flex: 1 1 0%; }',
  'items-center': '.items-center { align-items: center; }',
  italic: '.italic { font-style: italic; }',
  underline: '.underline { text-decoration-line: underline; }',
  border: `.border { border-width: ${theme.borderWidth?.DEFAULT || '1px'}; }`,
  group: '.group {}', // group 클래스 자체는 스타일이 없지만, group-hover 등을 위해 필요
}
for (let i = 1; i <= 3; i++) {
  // grid-cols-*
  staticClasses[
    `grid-cols-${i}`
  ] = `.grid-cols-${i} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }`
}
for (const className in staticClasses) {
  if (usedClassNames.has(className)) {
    outputCss += staticClasses[className] + '\n'
  }
}

// Typography, Borders, Shadows (Loop + Check)
for (const sizeKey in theme.fontSize) {
  if (usedClassNames.has(`text-${sizeKey}`))
    outputCss += `.text-${sizeKey} { font-size: ${theme.fontSize[sizeKey]}; }\n`
}
for (const weightKey in theme.fontWeight) {
  if (usedClassNames.has(`font-${weightKey}`))
    outputCss += `.font-${weightKey} { font-weight: ${theme.fontWeight[weightKey]}; }\n`
}
for (const radiusKey in theme.borderRadius) {
  const rawClassName =
    radiusKey === 'DEFAULT' ? 'rounded' : `rounded-${radiusKey}`
  if (usedClassNames.has(rawClassName)) {
    const escapedClassName = escapeClassName(rawClassName)
    outputCss += `.${escapedClassName} { border-radius: ${theme.borderRadius[radiusKey]}; }\n`
  }
}
for (const shadowKey in theme.boxShadow) {
  const rawClassName = `shadow-${shadowKey}`
  if (usedClassNames.has(rawClassName)) {
    const escapedClassName = escapeClassName(rawClassName)
    const shadowValue = theme.boxShadow[shadowKey]
    outputCss += `.${escapedClassName} { --tw-shadow: ${shadowValue}; --tw-shadow-colored: ${shadowValue}; box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }\n`
  }
}

// --- Variants Generation (Passing usedClassNames) ---

// Responsive Variants
outputCss += '\n/* Responsive Variants */\n'
if (theme.screens) {
  for (const screenKey in theme.screens) {
    let responsiveCss = ''
    const screenPrefix = `${screenKey}:` // Raw prefix for checking

    // Generate potential responsive classes inside this function and check if used
    function generateResponsiveRules() {
      let rules = ''
      // Colors
      rules += generateColorUtilities(
        theme.colors,
        'background-color',
        `${screenPrefix}bg`,
        usedClassNames
      )
      rules += generateColorUtilities(
        theme.colors,
        'color',
        `${screenPrefix}text`,
        usedClassNames
      )
      // Layout
      if (usedClassNames.has(`${screenPrefix}flex-row`))
        rules += `.${escapeClassName(
          `${screenPrefix}flex-row`
        )} { flex-direction: row; }\n`
      for (let i = 1; i <= 3; i++) {
        if (usedClassNames.has(`${screenPrefix}grid-cols-${i}`))
          rules += `.${escapeClassName(
            `${screenPrefix}grid-cols-${i}`
          )} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }\n`
      }
      // Add other utilities that need responsive versions
      // Container max-width update
      if (usedClassNames.has('container'))
        rules += `.container { max-width: ${theme.screens[screenKey]}; } \n`

      return rules
    }

    const generatedRules = generateResponsiveRules()
    if (generatedRules) {
      // Only add @media block if there are rules inside
      const screenValue = theme.screens[screenKey]
      outputCss += `@media (min-width: ${screenValue}) {\n`
      outputCss += generatedRules.replace(/^/gm, '  ') // Indent rules
      outputCss += `}\n`
    }
  }
}

// State Variants
outputCss += '\n/* State Variants */\n'
let stateCss = ''

// Hover
function generateHoverRules() {
  let rules = ''
  for (const colorName in theme.colors) {
    if (typeof theme.colors[colorName] === 'string') {
      if (usedClassNames.has(`hover:bg-${colorName}`))
        rules += `.${escapeClassName(
          `hover:bg-${colorName}`
        )}:hover { background-color: ${theme.colors[colorName]}; }\n`
      if (usedClassNames.has(`hover:text-${colorName}`))
        rules += `.${escapeClassName(
          `hover:text-${colorName}`
        )}:hover { color: ${theme.colors[colorName]}; }\n`
    } else {
      for (const shade in theme.colors[colorName]) {
        if (usedClassNames.has(`hover:bg-${colorName}-${shade}`))
          rules += `.${escapeClassName(
            `hover:bg-${colorName}-${shade}`
          )}:hover { background-color: ${theme.colors[colorName][shade]}; }\n`
        if (usedClassNames.has(`hover:text-${colorName}-${shade}`))
          rules += `.${escapeClassName(
            `hover:text-${colorName}-${shade}`
          )}:hover { color: ${theme.colors[colorName][shade]}; }\n`
      }
    }
  }
  // Add hover:bg-gray-100 from example explicitly if needed
  if (usedClassNames.has('hover:bg-gray-100'))
    rules += `.${escapeClassName(
      'hover:bg-gray-100'
    )}:hover { background-color: ${theme.colors.gray[100]}; }\n`
  return rules
}
stateCss += generateHoverRules()

// Focus
function generateFocusRules() {
  let rules = ''
  for (const colorName in theme.colors) {
    if (typeof theme.colors[colorName] === 'string') {
      if (usedClassNames.has(`focus:border-${colorName}`))
        rules += `.${escapeClassName(
          `focus:border-${colorName}`
        )}:focus { border-color: ${theme.colors[colorName]}; }\n`
    } else {
      for (const shade in theme.colors[colorName]) {
        if (usedClassNames.has(`focus:border-${colorName}-${shade}`))
          rules += `.${escapeClassName(
            `focus:border-${colorName}-${shade}`
          )}:focus { border-color: ${theme.colors[colorName][shade]}; }\n`
      }
    }
  }
  // focus:ring (Include rule only if 'focus:ring' is used)
  if (usedClassNames.has('focus:ring')) {
    const ringWidth = theme.ringWidth?.DEFAULT || '3px'
    rules += `.${escapeClassName('focus:ring')}:focus { \n`
    rules += `  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n`
    rules += `  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(${ringWidth} + var(--tw-ring-offset-width)) var(--tw-ring-color);\n`
    rules += `  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n`
    rules += `}\n`
  }
  // focus:ring-color-*
  for (const colorKey in theme.ringColor) {
    if (usedClassNames.has(`focus:ring-${colorKey}`)) {
      rules += `.${escapeClassName(
        `focus:ring-${colorKey}`
      )}:focus { --tw-ring-color: ${theme.ringColor[colorKey]}; }\n`
    }
  }
  return rules
}
stateCss += generateFocusRules()

// Group Hover
function generateGroupHoverRules() {
  let rules = ''
  // Only generate group-hover rules if 'group' class is potentially used
  // A more robust check would see if *any* group-hover:* class is used.
  if (
    usedClassNames.has('group') ||
    Array.from(usedClassNames).some(c => c.startsWith('group-hover:'))
  ) {
    // group-hover:text-black example
    if (usedClassNames.has('group-hover:text-black')) {
      rules += `.group:hover .${escapeClassName(
        'group-hover:text-black'
      )} { color: ${theme.colors.black}; }\n`
    }
    // Add other group-hover combinations here if needed
  }
  return rules
}
stateCss += generateGroupHoverRules()

outputCss += stateCss

// --- Final Write ---
fs.writeFileSync('your-tailwind.css', outputCss.trim())

console.log(
  `Purged CSS generated successfully to your-tailwind.css! Found ${usedClassNames.size} potential classes.`
)
