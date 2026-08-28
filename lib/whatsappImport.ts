export type ParsedMessage = { date: string; time: string; sender: string; text: string };

export type Candidate = {
  key: string;
  requirementType: "player_needed" | "opponent_needed" | "ground_available" | "other";
  city: string;
  area: string;
  groundName: string;
  details: string;
  neededOn: string; // datetime-local value, "" if unresolved
  contactPhone: string;
  sourceWhen: string;
  isFuture: boolean;
};

const MSG_START = /^(\d{2})\/(\d{2})\/(\d{2}), (\d{2}):(\d{2}) - ([\s\S]*)$/;
const SYSTEM_PATTERNS =
  /(joined using a group link|was added|added .*(and|,)|pinned a message|created group|left$|changed the (group|subject)|security code changed|updated the message timer|changed this group|Messages and calls are end-to-end encrypted|This group has over|added you$|This message was deleted$|<This message was edited>$)/;

export function parseWhatsAppExport(raw: string): ParsedMessage[] {
  const lines = raw.split(/\r?\n/);
  const rawMessages: { date: string; time: string; raw: string }[] = [];
  let cur: { date: string; time: string; raw: string } | null = null;

  for (const line of lines) {
    const m = line.match(MSG_START);
    if (m) {
      if (cur) rawMessages.push(cur);
      const [, dd, mm, yy, hh, min, rest] = m;
      cur = { date: `${dd}/${mm}/${yy}`, time: `${hh}:${min}`, raw: rest };
    } else if (cur) {
      cur.raw += "\n" + line;
    }
  }
  if (cur) rawMessages.push(cur);

  const parsed: ParsedMessage[] = [];
  for (const m of rawMessages) {
    const firstLine = m.raw.split("\n")[0];
    if (SYSTEM_PATTERNS.test(firstLine)) continue;
    const mm = m.raw.match(/^([^:]{2,30}?): ([\s\S]*)$/);
    if (!mm) continue;
    const [, sender, text0] = mm;
    const text = text0.trim();
    if (!text || text === "<Media omitted>" || text === "This message was deleted") continue;
    parsed.push({ date: m.date, time: m.time, sender: sender.trim(), text });
  }
  return parsed;
}

const PHONE_RE = /(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})/;

function extractPhone(text: string, sender: string): string {
  const m = text.replace(/\s/g, "").match(PHONE_RE);
  if (m) return m[1].replace(/[\s-]/g, "");
  const sm = sender.match(/91\s?(\d{5})\s?(\d{5})/);
  if (sm) return sm[1] + sm[2];
  return "";
}

function extractGround(text: string): string {
  const m = text.match(
    /([A-Z][A-Za-z0-9\s]{3,30}(?:Cricket Ground|CRICKET GROUND|Cricket Arena|CRICKET ARENA|Ground|GROUND|Arena|ARENA))/
  );
  return m ? m[1].trim() : "";
}

function classify(text: string): Candidate["requirementType"] {
  const t = text.toLowerCase();
  if (
    (/\b(player|players|batter|bowler|all[- ]?rounder|batsman)\b/.test(t) &&
      /\b(need|needed|require|looking)\b/.test(t)) ||
    (/\b(need|needed|require|looking for)\b/.test(t) &&
      /\b(player|players|batter|bowler|all[- ]?rounder|batsman)\b/.test(t))
  ) {
    return "player_needed";
  }
  if (/opponent|oppon/.test(t)) return "opponent_needed";
  if (/available|slot|booked/.test(t)) return "ground_available";
  return "other";
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};
const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3,
  thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
};

function applyTime(date: Date, text: string): Date {
  const tm = text.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/i) || text.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (tm) {
    let hour = parseInt(tm[1], 10);
    const minute = /^\d+$/.test(tm[2] ?? "") ? parseInt(tm[2], 10) : 0;
    const ampm = (tm[3] || tm[2] || "").toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    date.setHours(hour, minute, 0, 0);
  }
  return date;
}

function extractNeededOn(text: string, messageTime: Date): Date | null {
  let m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    const date = new Date(y, mo - 1, d);
    if (!isNaN(date.getTime())) return applyTime(date, text);
  }

  m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*(\d{4})?\b/);
  if (m) {
    const mi = MONTHS[m[2].toLowerCase()];
    if (mi !== undefined) {
      const year = m[3] ? parseInt(m[3], 10) : messageTime.getFullYear();
      const date = new Date(year, mi, parseInt(m[1], 10));
      if (!isNaN(date.getTime())) return applyTime(date, text);
    }
  }

  if (/\btomorrow\b/i.test(text)) {
    const d = new Date(messageTime);
    d.setDate(d.getDate() + 1);
    return applyTime(d, text);
  }

  const wd = text.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (wd) {
    const target = WEEKDAYS[wd[1].toLowerCase()];
    const d = new Date(messageTime);
    let diff = (target - d.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);
    return applyTime(d, text);
  }

  return null;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function cleanDetails(raw: string): string {
  let t = raw.replace(/\n+/g, " ");
  t = t.replace(/https?:\/\/\S+/g, "");
  t = t.replace(/[*_#>~]/g, "");
  t = t.replace(/[\u{1F300}-\u{1FAFF}←-➿☀-⛿]/gu, "");
  t = t.replace(/\s+/g, " ").trim();
  return t.slice(0, 400);
}

const SPAM_MARKERS = ["willow", "instagram.com", "do you play to play weekday", "chat.whatsapp.com"];

export function buildCandidates(messages: ParsedMessage[], defaultCity: string): Candidate[] {
  const now = new Date();
  const seen = new Set<string>();
  const out: Candidate[] = [];

  for (const m of messages) {
    const lower = m.text.toLowerCase();
    if (SPAM_MARKERS.some((s) => lower.includes(s))) continue;

    const [dd, mm, yy] = m.date.split("/").map(Number);
    const [hh, min] = m.time.split(":").map(Number);
    const messageTime = new Date(2000 + yy, mm - 1, dd, hh, min);

    const key = `${m.sender}::${m.text.toLowerCase().replace(/\s+/g, " ").slice(0, 50)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const requirementType = classify(m.text);
    if (requirementType === "other" && !/opponent|player|ground|slot|match/i.test(m.text)) continue;

    const neededOnDate = extractNeededOn(m.text, messageTime);
    const isFuture = neededOnDate ? neededOnDate.getTime() >= now.getTime() - 12 * 3600 * 1000 : true;

    out.push({
      key,
      requirementType,
      city: defaultCity,
      area: "",
      groundName: extractGround(m.text),
      details: cleanDetails(m.text),
      neededOn: neededOnDate ? toDatetimeLocal(neededOnDate) : "",
      contactPhone: extractPhone(m.text, m.sender),
      sourceWhen: `${m.date} ${m.time}`,
      isFuture,
    });
  }

  return out;
}
