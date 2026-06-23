export const safeEmail = (u: any) => {
  return String(u?.email || u?.username || "").trim();
}
