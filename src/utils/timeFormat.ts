/**
 * Formats seconds into MM:SS.S or HH:MM:SS.S
 */
export function formatTimecode(seconds: number, includeHours = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';

  const totalMilliseconds = Math.floor(seconds * 1000);
  const hrs = Math.floor(totalMilliseconds / 3600000);
  const mins = Math.floor((totalMilliseconds % 3600000) / 60000);
  const secs = Math.floor((totalMilliseconds % 60000) / 1000);
  const tenths = Math.floor((totalMilliseconds % 1000) / 100);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (includeHours || hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${tenths}`;
  }
  return `${pad(mins)}:${pad(secs)}.${tenths}`;
}

/**
 * Formats seconds into HH:MM:SS.mmm for high precision inputs
 */
export function formatPreciseTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00.000';

  const totalMilliseconds = Math.floor(seconds * 1000);
  const hrs = Math.floor(totalMilliseconds / 3600000);
  const mins = Math.floor((totalMilliseconds % 3600000) / 60000);
  const secs = Math.floor((totalMilliseconds % 60000) / 1000);
  const ms = Math.floor(totalMilliseconds % 1000);

  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}

/**
 * Parses user input string into seconds
 */
export function parseTimeString(timeStr: string): number | null {
  const clean = timeStr.trim();
  const parts = clean.split(':');

  if (parts.length === 1) {
    const val = parseFloat(parts[0]);
    return isNaN(val) ? null : Math.max(0, val);
  }

  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    return mins * 60 + secs;
  }

  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    if (isNaN(hrs) || isNaN(mins) || isNaN(secs)) return null;
    return hrs * 3600 + mins * 60 + secs;
  }

  return null;
}
