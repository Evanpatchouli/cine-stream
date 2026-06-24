export const getCaller = (): string => {
  const stack = new Error().stack;
  if (!stack) return 'unknown';

  const lines = stack.split('\n').slice(3);

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.includes('node_modules') ||
      trimmed.includes('logger') ||
      trimmed.includes('log4js')
    ) {
      continue;
    }

    const match = trimmed.match(/at\s+(.*)\s+\(/);
    if (match && match[1]) {
      const parts = match[1].split('.');
      return parts.slice(-2).join('.') || match[1];
    }
  }

  return 'unknown';
};
