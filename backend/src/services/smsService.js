/**
 * SMS-сервис с dev-режимом (код в консоль) и заготовкой под провайдеров.
 *
 * SMS_PROVIDER=dev      — код только в лог (по умолчанию)
 * SMS_PROVIDER=smsaero    — SMS Aero (SMS_AERO_EMAIL + SMS_AERO_API_KEY)
 * SMS_PROVIDER=smsru      — SMS.ru (нужен SMS_API_KEY)
 * SMS_PROVIDER=smsc       — SMSC.ru (нужны SMS_LOGIN и SMS_PASSWORD)
 */

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const SMSRU_ERRORS = {
  200: "Неправильный API-ключ (SMS_API_KEY)",
  201: "Не хватает средств на балансе SMS.ru",
  202: "Неправильный номер или нет маршрута",
  203: "Пустой текст сообщения",
  204: "Оператор не подключён — создайте отправителя в SMS.ru",
  207: "На этот номер нельзя отправлять SMS",
};

function logSms(message, data) {
  if (data !== undefined) {
    console.log(`[SMS] ${message}`, data);
  } else {
    console.log(`[SMS] ${message}`);
  }
}

async function sendViaDev(phone, code) {
  console.log(`
╔══════════════════════════════════════╗
║  [SMS DEV] Код для +${phone}
║  Код: ${code}
║  (реальная SMS не отправлена)
╚══════════════════════════════════════╝
  `);
  return { ok: true, provider: "dev" };
}

async function sendViaSmsRu(phone, code) {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    throw new Error("SMS_API_KEY не задан для провайдера smsru");
  }

  const message = `Zeus Auto: код входа ${code}`;
  const params = new URLSearchParams({
    api_id: apiKey,
    to: phone,
    msg: message,
    json: "1",
  });

  if (process.env.SMS_SENDER) {
    params.set("from", process.env.SMS_SENDER);
  }

  const url = `https://sms.ru/sms/send?${params.toString()}`;
  logSms(`SMS.ru → отправка на +${phone}`);

  const response = await fetch(url);
  const rawText = await response.text();

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    logSms("SMS.ru: не JSON ответ", rawText.slice(0, 500));
    throw new Error("SMS.ru вернул некорректный ответ");
  }

  logSms("SMS.ru ответ", data);

  if (data.status !== "OK") {
    const codeNum = data.status_code;
    throw new Error(
      SMSRU_ERRORS[codeNum] ||
        data.status_text ||
        `SMS.ru ошибка ${codeNum || data.status}`,
    );
  }

  const perPhone = data.sms?.[phone] || Object.values(data.sms || {})[0];

  if (perPhone && perPhone.status === "ERROR") {
    const codeNum = perPhone.status_code;
    throw new Error(
      SMSRU_ERRORS[codeNum] ||
        perPhone.status_text ||
        `SMS.ru ошибка для номера: код ${codeNum}`,
    );
  }

  logSms(`SMS.ru: принято в очередь, sms_id=${perPhone?.sms_id || "—"}`);
  return { ok: true, provider: "smsru", smsId: perPhone?.sms_id };
}

async function sendViaSmsc(phone, code) {
  const login = process.env.SMS_LOGIN;
  const password = process.env.SMS_PASSWORD;
  if (!login || !password) {
    throw new Error("SMS_LOGIN и SMS_PASSWORD не заданы для провайдера smsc");
  }

  const message = encodeURIComponent(`Zeus Auto: код входа ${code}`);
  const url = `https://smsc.ru/sys/send.php?login=${login}&psw=${password}&phones=${phone}&mes=${message}&fmt=3`;

  logSms(`SMSC → отправка на +${phone}`);
  const response = await fetch(url);
  const data = await response.json();
  logSms("SMSC ответ", data);

  if (data.error) {
    throw new Error(data.error || "SMSC: ошибка отправки");
  }

  return { ok: true, provider: "smsc" };
}

function smsAeroAuthHeader() {
  const email = process.env.SMS_AERO_EMAIL;
  const apiKey = process.env.SMS_AERO_API_KEY;
  if (!email || !apiKey) {
    throw new Error(
      "SMS_AERO_EMAIL и SMS_AERO_API_KEY не заданы для провайдера smsaero",
    );
  }
  const token = Buffer.from(`${email}:${apiKey}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

async function sendViaSmsAero(phone, code) {
  const sign = process.env.SMS_AERO_SIGN || "SMS Aero";
  const text = `Zeus Auto: код входа ${code}`;

  const params = new URLSearchParams({
    number: phone,
    text,
    sign,
  });

  const url = `https://gate.smsaero.ru/v2/sms/send?${params.toString()}`;
  logSms(`SMS Aero → отправка на +${phone}, sign=${sign}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: smsAeroAuthHeader(),
      Accept: "application/json",
    },
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    logSms("SMS Aero: не JSON ответ", rawText.slice(0, 500));
    throw new Error("SMS Aero вернул некорректный ответ");
  }

  logSms("SMS Aero ответ", data);

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || `SMS Aero ошибка HTTP ${response.status}`,
    );
  }

  const item = Array.isArray(data.data) ? data.data[0] : data.data;
  const extendStatus = item?.extendStatus;

  if (extendStatus === "reject") {
    throw new Error("SMS Aero отклонил сообщение (moderation/reject)");
  }

  logSms(
    `SMS Aero: принято, id=${item?.id || "—"}, status=${extendStatus || "—"}`,
  );
  return { ok: true, provider: "smsaero", smsId: item?.id };
}

async function sendSms(phone, code) {
  const provider = (process.env.SMS_PROVIDER || "dev").toLowerCase();
  logSms(`Провайдер: ${provider}, телефон: +${phone}`);

  switch (provider) {
    case "dev":
      return sendViaDev(phone, code);
    case "smsru":
      return sendViaSmsRu(phone, code);
    case "smsc":
      return sendViaSmsc(phone, code);
    case "smsaero":
      return sendViaSmsAero(phone, code);
    default:
      throw new Error(`Неизвестный SMS_PROVIDER: ${provider}`);
  }
}

module.exports = { generateCode, sendSms };
