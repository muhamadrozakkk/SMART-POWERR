export function cooldownElapsed(lastCreatedAt: Date | null, now: Date, cooldownSeconds: number) {
  return !lastCreatedAt || now.getTime() - lastCreatedAt.getTime() >= cooldownSeconds * 1000;
}
