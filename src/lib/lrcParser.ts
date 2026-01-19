/**
 * LRC (Lyrics) Parser Utility
 * 
 * Parses LRC format lyrics into structured timestamped lines.
 * Supports both simple and enhanced LRC formats.
 * 
 * Format: [mm:ss.xx]lyrics text
 * Enhanced: [mm:ss.xx]<mm:ss.xx>word<mm:ss.xx>word
 */

export interface LyricLine {
  time: number; // Time in seconds
  text: string;
}

export interface ParsedLyrics {
  lines: LyricLine[];
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    author?: string;
    length?: string;
  };
}

/**
 * Parse a timestamp string [mm:ss.xx] or [mm:ss] to seconds
 */
function parseTimestamp(timestamp: string): number | null {
  // Match [mm:ss.xx] or [mm:ss]
  const match = timestamp.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

  return minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Parse LRC format string into structured lyrics
 */
export function parseLRC(lrcContent: string): ParsedLyrics {
  const lines: LyricLine[] = [];
  const metadata: ParsedLyrics['metadata'] = {};

  if (!lrcContent || typeof lrcContent !== 'string') {
    return { lines, metadata };
  }

  const lrcLines = lrcContent.split('\n');

  for (const line of lrcLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for metadata tags
    const metaMatch = trimmedLine.match(/^\[([a-z]+):(.+)\]$/i);
    if (metaMatch) {
      const [, tag, value] = metaMatch;
      const tagLower = tag.toLowerCase();
      
      switch (tagLower) {
        case 'ti':
          metadata.title = value.trim();
          break;
        case 'ar':
          metadata.artist = value.trim();
          break;
        case 'al':
          metadata.album = value.trim();
          break;
        case 'au':
          metadata.author = value.trim();
          break;
        case 'length':
          metadata.length = value.trim();
          break;
      }
      continue;
    }

    // Parse lyrics lines - can have multiple timestamps for same line
    // e.g., [00:12.00][00:24.00]lyrics text
    const timestampMatches = trimmedLine.match(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g);
    
    if (timestampMatches && timestampMatches.length > 0) {
      // Get the text after all timestamps
      const textStart = trimmedLine.lastIndexOf(']') + 1;
      const text = trimmedLine.substring(textStart).trim();
      
      // Skip empty lines (instrumental breaks)
      if (!text) continue;

      // Add entry for each timestamp
      for (const ts of timestampMatches) {
        const time = parseTimestamp(ts);
        if (time !== null) {
          lines.push({ time, text });
        }
      }
    }
  }

  // Sort by time
  lines.sort((a, b) => a.time - b.time);

  return { lines, metadata };
}

/**
 * Find the current lyric line index based on playback time
 */
export function getCurrentLineIndex(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;

  // Find the last line that started before or at current time
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time <= currentTime) {
      return i;
    }
  }

  return -1;
}

/**
 * Get the next lyric line based on current time
 */
export function getNextLine(lines: LyricLine[], currentTime: number): LyricLine | null {
  const currentIndex = getCurrentLineIndex(lines, currentTime);
  if (currentIndex < lines.length - 1) {
    return lines[currentIndex + 1];
  }
  return null;
}

/**
 * Validate if a string is valid LRC format
 */
export function isValidLRC(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  
  const lines = content.split('\n');
  let hasTimestamps = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for timestamp pattern
    if (/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/.test(trimmed)) {
      hasTimestamps = true;
      break;
    }
  }

  return hasTimestamps;
}

/**
 * Convert plain lyrics to LRC format with estimated timestamps
 * Useful for generating basic LRC from plain text
 */
export function plainToLRC(plainLyrics: string, duration: number): string {
  const lines = plainLyrics.split('\n').filter(l => l.trim());
  if (lines.length === 0) return '';

  const timePerLine = duration / lines.length;
  
  return lines.map((line, index) => {
    const time = index * timePerLine;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}]${line}`;
  }).join('\n');
}

/**
 * Format time in seconds to LRC timestamp format [mm:ss.xx]
 */
export function formatLRCTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
}
