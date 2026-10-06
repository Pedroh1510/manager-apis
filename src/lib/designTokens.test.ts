/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const ROOT = resolve(__dirname, '../..')

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry: string) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return listSourceFiles(path)
    return /\.(css|tsx?)$/.test(entry) ? [path] : []
  })
}

describe('design tokens', () => {
  it('uses Inter and JetBrains Mono from fontsource', () => {
    const tailwindConfig = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf-8')
    expect(tailwindConfig).toMatch(/sans:\s*\[\s*'Inter'/)
    expect(tailwindConfig).toMatch(/mono:\s*\[\s*'JetBrains Mono'/)

    const main = readFileSync(join(ROOT, 'src/main.tsx'), 'utf-8')
    for (const css of [
      '@fontsource/inter/400.css',
      '@fontsource/inter/500.css',
      '@fontsource/inter/600.css',
      '@fontsource/jetbrains-mono/400.css',
    ]) {
      expect(main).toContain(`import '${css}'`)
    }
  })

  it('loads no font from an external domain', () => {
    const files = [join(ROOT, 'index.html'), ...listSourceFiles(join(ROOT, 'src'))].filter(
      (file) => !file.endsWith('designTokens.test.ts')
    )
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      expect(content, file).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
    }
  })
})
