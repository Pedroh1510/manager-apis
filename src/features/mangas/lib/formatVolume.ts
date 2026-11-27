/**
 * NUMERIC volumes arrive as "376.0000"; show them as 376 or 12.5.
 * @example formatVolume('177.0000') // '177'
 */
export const formatVolume = (volume: string | number): string => String(Number(volume));
