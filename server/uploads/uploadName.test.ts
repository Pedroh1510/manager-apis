// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseUploadName } from './uploadName.js'

describe('parseUploadName', () => {
  it('accepts plain video and subtitle names only', () => {
    for (const name of ['Ep 07.mkv', 'a.MP4', 'x.ass']) expect(parseUploadName(name)).toBe(name)
    const tooLong = `${'a'.repeat(252)}.mkv`
    for (const name of ['../a.mkv', 'a/b.mkv', 'a\\b.mkv', '.hidden.mkv', 'a.txt', 'a.mkv.part', '', tooLong]) {
      expect(() => parseUploadName(name), name).toThrow(`nome de arquivo inválido: "${name}", esperado nome simples com extensão .mkv, .mp4, .avi, .srt ou .ass`)
    }
  })
})
