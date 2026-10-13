import { describe, expect, it } from 'vitest'
import { fileNameOf, formatErrorDate, formatGigabytes, formatPercent, workerTypeLabel } from './formatTdarr'

describe('formatTdarr', () => {
  it('gigabytes switch to terabytes at 1024', () => {
    expect(formatGigabytes(592.95)).toBe('592,95 GB')
    expect(formatGigabytes(1023.99)).toBe('1023,99 GB')
    expect(formatGigabytes(1024)).toBe('1,00 TB')
    expect(formatGigabytes(1536)).toBe('1,50 TB')
    expect(formatGigabytes(2.8299)).toBe('2,83 GB')
  })

  it('file name drops the folders', () => {
    expect(fileNameOf('/movies/Zootopia 2 (2025)/Zootopia 2 (2025) WEBDL-1080p.mkv')).toBe('Zootopia 2 (2025) WEBDL-1080p.mkv')
    expect(fileNameOf('solto.mkv')).toBe('solto.mkv')
  })

  it('percent keeps one decimal in pt-BR', () => {
    expect(formatPercent(72.9)).toBe('72,9%')
    expect(formatPercent(50)).toBe('50%')
  })

  it('error date is local day and time, or a dash', () => {
    expect(formatErrorDate('2026-10-12T10:00:00.000Z')).toBe('12/10/2026 07:00')
    expect(formatErrorDate(null)).toBe('—')
  })

  it('worker type label names job and hardware', () => {
    expect(workerTypeLabel('transcode', 'gpu')).toBe('Transcode GPU')
    expect(workerTypeLabel('healthCheck', 'cpu')).toBe('Health check CPU')
  })
})
