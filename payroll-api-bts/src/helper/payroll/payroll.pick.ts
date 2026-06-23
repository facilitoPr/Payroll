export const pickEarliest = (step: string, byStep: Map<string, Date[]>) => {
  const arr = byStep.get(step) || [];
  return arr.length ? arr[0] : null;
};

export const pickLatest = (step: string, byStep: Map<string, Date[]>) => {
  const arr = byStep.get(step) || [];
  return arr.length ? arr[arr.length - 1] : null;
};

export const pickFirstAfter = (step: string, after: Date | null, byStep: Map<string, Date[]>) => {
  const arr = byStep.get(step) || [];
  if (!arr.length) return null;
  if (!after) return arr[0];
  const t = after.getTime();
  return arr.find((d) => d.getTime() >= t) || null;
};
