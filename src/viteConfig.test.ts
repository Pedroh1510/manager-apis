/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

interface PackageJson {
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

const readRoot = (file: string) => readFileSync(join(__dirname, '..', file), 'utf-8')
const pkg = JSON.parse(readRoot('package.json')) as PackageJson
// Read as text: vite.config.ts belongs to tsconfig.node.json, not to the app project.
const viteConfigSource = readRoot('vite.config.ts')

describe('dev and build setup', () => {
  it('proxies /api to the local server', () => {
    expect(viteConfigSource).toMatch(/server:\s*\{\s*proxy:\s*\{\s*'\/api':\s*'http:\/\/localhost:3002'\s*\}/)
  })

  it('dev script runs vite and the server together', () => {
    expect(pkg.scripts.dev).toBe('tsx watch server/index.ts & vite')
  })

  it('declares the server dependencies', () => {
    expect(pkg.dependencies.express).toBeDefined()
    expect(pkg.dependencies['@ctrl/qbittorrent']).toMatch(/^\^9\.16\./)
    expect(pkg.devDependencies.tsx).toBeDefined()
    expect(pkg.devDependencies.concurrently).toBeUndefined()
    expect(pkg.dependencies.concurrently).toBeUndefined()
  })
})
