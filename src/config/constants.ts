const parseEnvInt = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
};

export const TECHNICAL_PAUSE_MINUTES = parseEnvInt('TECHNICAL_PAUSE_MINUTES', 15);
export const MAX_TICKETS_PER_PERSON = parseEnvInt('MAX_TICKETS_PER_PERSON', 6);
