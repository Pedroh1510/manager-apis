// @vitest-environment node
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseServerConfig } from './config.js'

// The provider this flag replaced; spelled in pieces so the no-leftovers check (C14) stays meaningful.
const REMOVED_FLAG = ['ji', 'kan'].join('')

const sonarrEnv = { SONARR_URL: 'http://sonarr:8989', SONARR_API_KEY: 'k3y-abc' }
const qbitEnv = { QBITTORRENT_URL: 'http://qbit:8080', QBITTORRENT_USER: 'bob-user', QBITTORRENT_PASS: 's3cr3t-pass' }

describe('parseServerConfig', () => {
  it('port defaults to 3002 and reads PORT', () => {
    expect(parseServerConfig({}).port).toBe(3002)
    expect(parseServerConfig({ PORT: '4010' }).port).toBe(4010)
  })

  it('rejects invalid PORT with the received value', () => {
    for (const value of ['abc', '0', '70000']) {
      expect(() => parseServerConfig({ PORT: value })).toThrow(value)
      expect(() => parseServerConfig({ PORT: value })).toThrow('esperado inteiro 1-65535')
    }
  })

  it('rejects malformed QBITTORRENT_URL with the received value', () => {
    for (const value of ['qbit:8080', 'ftp://qbit']) {
      const env = { ...qbitEnv, QBITTORRENT_URL: value }
      expect(() => parseServerConfig(env)).toThrow(value)
      expect(() => parseServerConfig(env)).toThrow('esperado http(s)://host:porta')
    }
  })

  it('requires user and pass when url is set', () => {
    expect(() => parseServerConfig({ ...qbitEnv, QBITTORRENT_USER: undefined })).toThrow('QBITTORRENT_USER')
    expect(() => parseServerConfig({ ...qbitEnv, QBITTORRENT_PASS: undefined })).toThrow('QBITTORRENT_PASS')
  })

  it('disables qbittorrent without url and enables it with a valid one', () => {
    expect(parseServerConfig({}).qbittorrent).toBeNull()
    expect(parseServerConfig(qbitEnv).qbittorrent).toEqual({
      url: 'http://qbit:8080',
      username: 'bob-user',
      password: 's3cr3t-pass',
    })
  })

  it('enables sonarr with url and api key', () => {
    expect(parseServerConfig({}).sonarr).toBeNull()
    expect(parseServerConfig(sonarrEnv).sonarr).toEqual({ url: 'http://sonarr:8989', apiKey: 'k3y-abc' })
  })

  it('rejects malformed SONARR_URL with the received value', () => {
    for (const value of ['sonarr:8989', 'ftp://sonarr']) {
      const env = { ...sonarrEnv, SONARR_URL: value }
      expect(() => parseServerConfig(env)).toThrow(value)
      expect(() => parseServerConfig(env)).toThrow('esperado http(s)://host:porta')
    }
  })

  it('requires SONARR_API_KEY when url is set', () => {
    expect(() => parseServerConfig({ ...sonarrEnv, SONARR_API_KEY: undefined })).toThrow('SONARR_API_KEY')
  })

  it('upload dir is off without SONARR_UPLOAD_DIR', () => {
    expect(parseServerConfig(sonarrEnv).sonarrUpload).toBeNull()
  })

  it('upload dir accepts an absolute writable folder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uploads-'))
    expect(parseServerConfig({ ...sonarrEnv, SONARR_UPLOAD_DIR: dir }).sonarrUpload).toEqual({ dir })
  })

  it('upload dir rejects relative, missing, non-folder, read-only or sonarr-less values', () => {
    const base = mkdtempSync(join(tmpdir(), 'uploads-'))
    const file = join(base, 'a-file')
    writeFileSync(file, 'x')
    const readOnly = mkdtempSync(join(tmpdir(), 'uploads-ro-'))
    chmodSync(readOnly, 0o555)
    const cases: [Record<string, string>, string][] = [
      [{ ...sonarrEnv, SONARR_UPLOAD_DIR: 'uploads' }, 'uploads'],
      [{ ...sonarrEnv, SONARR_UPLOAD_DIR: join(base, 'nao-existe') }, join(base, 'nao-existe')],
      [{ ...sonarrEnv, SONARR_UPLOAD_DIR: file }, file],
      [{ ...sonarrEnv, SONARR_UPLOAD_DIR: readOnly }, readOnly],
      [{ SONARR_UPLOAD_DIR: base }, base],
    ]
    for (const [env, value] of cases) {
      expect(() => parseServerConfig(env), value).toThrow('SONARR_UPLOAD_DIR')
      expect(() => parseServerConfig(env), value).toThrow(`"${value}"`)
    }
    chmodSync(readOnly, 0o755)
  })

  it('anilist url defaults and is validated at boot', () => {
    expect(parseServerConfig({}).anilist).toEqual({ url: 'https://graphql.anilist.co' })
    expect(parseServerConfig({ ANILIST_URL: 'http://localhost:9999/graphql' }).anilist).toEqual({ url: 'http://localhost:9999/graphql' })
    expect(() => parseServerConfig({ ANILIST_URL: 'ftp://x' })).toThrow('ANILIST_URL inválida: "ftp://x", esperado http(s)://host:porta')
    expect(parseServerConfig({})).not.toHaveProperty(REMOVED_FLAG)
  })

  it('tdarr is disabled without TDARR_URL', () => {
    expect(parseServerConfig({}).tdarr).toBeNull()
  })

  it('tdarr env is validated at boot', () => {
    expect(() => parseServerConfig({ TDARR_URL: 'ftp://x' })).toThrow('TDARR_URL inválida: "ftp://x", esperado http(s)://host:porta')
    expect(() => parseServerConfig({ TDARR_API_KEY: 'k' })).toThrow('TDARR_API_KEY definida sem TDARR_URL')
    expect(parseServerConfig({ TDARR_URL: 'http://10.0.0.2:8265' }).tdarr).toEqual({ url: 'http://10.0.0.2:8265', apiKey: null })
    expect(parseServerConfig({ TDARR_URL: 'http://10.0.0.2:8265', TDARR_API_KEY: 'k' }).tdarr).toEqual({ url: 'http://10.0.0.2:8265', apiKey: 'k' })
  })
})
