export const WEEK_DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo"
];

export function defaultOpeningHours() {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = {
      closed: true,
      split: false,
      start: "09:00",
      end: "12:30",
      start2: "16:30",
      end2: "19:30"
    };
    return acc;
  }, {});
}

export function parseHourRange(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "cerrado") {
    return { closed: true };
  }

  const splitMatch = normalized.match(
    /^(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})\s+y\s+(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})$/
  );
  if (splitMatch) {
    return {
      closed: false,
      split: true,
      start: splitMatch[1],
      end: splitMatch[2],
      start2: splitMatch[3],
      end2: splitMatch[4]
    };
  }

  const singleMatch = normalized.match(/^(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})$/);
  if (singleMatch) {
    return {
      closed: false,
      split: false,
      start: singleMatch[1],
      end: singleMatch[2]
    };
  }

  return null;
}

export function openingHoursFromApi(raw) {
  const base = defaultOpeningHours();
  if (!raw || typeof raw !== "object") return base;

  WEEK_DAYS.forEach((day) => {
    const parsed = parseHourRange(raw[day]);
    if (!parsed) {
      base[day].closed = true;
      return;
    }

    if (parsed.closed) {
      base[day].closed = true;
      return;
    }

    base[day] = {
      ...base[day],
      ...parsed,
      closed: false,
      split: Boolean(parsed.split)
    };
  });

  return base;
}

function formatSingleRange(start, end) {
  return `${start || "09:00"} a ${end || "12:30"}`;
}

export function openingHoursToPayload(openingHours) {
  return WEEK_DAYS.reduce((acc, day) => {
    const item = openingHours[day];
    if (!item || item.closed) {
      acc[day] = null;
      return acc;
    }

    const firstRange = formatSingleRange(item.start, item.end);
    if (!item.split) {
      acc[day] = firstRange;
      return acc;
    }

    const secondRange = formatSingleRange(item.start2, item.end2);
    acc[day] = `${firstRange} y ${secondRange}`;
    return acc;
  }, {});
}

export function openingHoursLabel(value) {
  if (!value) return "Cerrado";
  return String(value);
}
