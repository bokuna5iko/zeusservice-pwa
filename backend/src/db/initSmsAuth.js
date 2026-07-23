const db = require("../config/db");

const PD_CONSENT_VERSION = process.env.PD_CONSENT_VERSION || "1.0";

async function initSmsAuthTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sms_codes (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_created
    ON sms_codes (phone, created_at DESC)
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pd_consent_at TIMESTAMPTZ
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pd_consent_version VARCHAR(32)
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pd_consent_withdrawn_at TIMESTAMPTZ
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
  `);
}

function requirePersonalDataConsent(body, res) {
  if (body.personalDataConsent !== true) {
    res.status(400).json({
      message:
        "Для регистрации необходимо согласие на обработку персональных данных",
      code: "PD_CONSENT_REQUIRED",
    });
    return false;
  }
  return true;
}

function getPdConsentFields() {
  return {
    pdConsentAt: new Date(),
    pdConsentVersion: PD_CONSENT_VERSION,
  };
}

module.exports = {
  initSmsAuthTables,
  requirePersonalDataConsent,
  getPdConsentFields,
  PD_CONSENT_VERSION,
};
