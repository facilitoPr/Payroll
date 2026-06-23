import moment from "moment";

export const appendRunNote = ({
  currentNotes,
  note,
  actorName,
}: {
  currentNotes?: string;
  note?: string;
  actorName?: string;
}) => {
  const cleanNote = String(note || "").trim();

  if (!cleanNote) return currentNotes || "";

  const stamp = moment().format("YYYY-MM-DD HH:mm");

  const line = `[${stamp}] ${actorName || "Sistema"}: ${cleanNote}`;

  return [currentNotes || "", line].filter(Boolean).join("\n");
};