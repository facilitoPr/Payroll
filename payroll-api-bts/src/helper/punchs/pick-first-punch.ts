export const pickEntryPunch = (steps: any[]) => {
  if (!Array.isArray(steps) || !steps.length) return null;
  const entry = steps.find(
    (s: any) => String(s?.punchStep || "").toLowerCase() === "entrada",
  );
  return entry || steps[0] || null;
}
