import { describe, expect, it } from 'vitest'
import { validateUploadFile } from './uploadRules'

describe('validateUploadFile', () => {
  it('accepts video and subtitles up to 20 GB', () => {
    expect(validateUploadFile({ name: 'a.mkv', size: 1024 ** 3 })).toBeNull()
    expect(validateUploadFile({ name: 'x.SRT', size: 10 })).toBeNull()
    expect(validateUploadFile({ name: 'a.txt', size: 1 })).toBe('extensão não aceita: .txt')
    expect(validateUploadFile({ name: 'semextensao', size: 1 })).toBe('extensão não aceita: (nenhuma)')
    expect(validateUploadFile({ name: 'big.mkv', size: 21474836481 })).toBe('maior que 20 GB')
  })
})
