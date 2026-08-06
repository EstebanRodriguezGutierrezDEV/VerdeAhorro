const rateLimitStore = new Map();

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lockedUntil: 0 });
    return { allowed: true, remainingMs: 0, attempts: 1 };
  }

  if (entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingMs: entry.lockedUntil - now,
      attempts: entry.attempts
    };
  }

  if (now - entry.firstAttempt > windowMs) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lockedUntil: 0 });
    return { allowed: true, remainingMs: 0, attempts: 1 };
  }

  entry.attempts++;

  if (entry.attempts > maxAttempts) {
    const lockMultiplier = Math.min(entry.attempts - maxAttempts, 5);
    const lockDuration = windowMs * lockMultiplier;
    entry.lockedUntil = now + lockDuration;
    rateLimitStore.set(key, entry);

    return {
      allowed: false,
      remainingMs: lockDuration,
      attempts: entry.attempts
    };
  }

  rateLimitStore.set(key, entry);
  return { allowed: true, remainingMs: 0, attempts: entry.attempts };
}

export function resetRateLimit(key) {
  rateLimitStore.delete(key);
}
