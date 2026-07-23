/**
 * Нормализует телефон к формату 7XXXXXXXXXX (Россия).
 * Принимает: +7 (900) 123-45-67, 89001234567, 9001234567
 */
function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return null;

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  let normalized = digits;

  if (normalized.length === 11 && normalized.startsWith("8")) {
    normalized = "7" + normalized.slice(1);
  } else if (normalized.length === 10) {
    normalized = "7" + normalized;
  }

  if (normalized.length !== 11 || !normalized.startsWith("7")) {
    return null;
  }

  return normalized;
}

function formatPhoneDisplay(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9, 11)}`;
}

module.exports = { normalizePhone, formatPhoneDisplay };
