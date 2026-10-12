// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseServerConfig } from './config.js'

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
})
