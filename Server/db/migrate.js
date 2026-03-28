require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
  // First connect to default 'postgres' db to create our db if needed
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('calendly_clone', 'postgres'),
    ssl: false,
  });

  await client.connect();

  // Create DB if it doesn't exist
  const res = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = 'calendly_clone'`
  );
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE calendly_clone');
    console.log('Database created.');
  }
  await client.end();

  // Now connect to our actual DB and create tables
  const { Client: Client2 } = require('pg');
  const db = new Client2({ connectionString: process.env.DATABASE_URL, ssl: false });
  await db.connect();

  console.log('Running migrations...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      timezone   VARCHAR(50)  NOT NULL DEFAULT 'UTC',
      created_at TIMESTAMPTZ  DEFAULT NOW(),
      updated_at TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS event_types (
      id               SERIAL PRIMARY KEY,
      user_id          INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name             VARCHAR(100) NOT NULL,
      slug             VARCHAR(100) NOT NULL UNIQUE,
      duration_minutes INT          NOT NULL,
      description      TEXT,
      is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at       TIMESTAMPTZ  DEFAULT NOW(),
      updated_at       TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS availability (
      id          SERIAL PRIMARY KEY,
      user_id     INT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INT        NOT NULL,
      start_time  VARCHAR(8) NOT NULL,
      end_time    VARCHAR(8) NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id             SERIAL PRIMARY KEY,
      event_type_id  INT          NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
      invitee_name   VARCHAR(100) NOT NULL,
      invitee_email  VARCHAR(150) NOT NULL,
      start_time     TIMESTAMPTZ  NOT NULL,
      end_time       TIMESTAMPTZ  NOT NULL,
      status         VARCHAR(20)  NOT NULL DEFAULT 'confirmed',
      created_at     TIMESTAMPTZ  DEFAULT NOW(),
      updated_at     TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  // Add buffer_time columns to event_types
    await db.query(`
    ALTER TABLE event_types
        ADD COLUMN IF NOT EXISTS buffer_before INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS buffer_after  INT NOT NULL DEFAULT 0;
    `);

    // Custom questions table
    await db.query(`
    CREATE TABLE IF NOT EXISTS event_questions (
        id           SERIAL PRIMARY KEY,
        event_type_id INT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
        question     VARCHAR(255) NOT NULL,
        is_required  BOOLEAN NOT NULL DEFAULT false,
        sort_order   INT NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW()
    );
    `);

// Store answers per booking
await db.query(`
  CREATE TABLE IF NOT EXISTS booking_answers (
    id          SERIAL PRIMARY KEY,
    booking_id  INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES event_questions(id) ON DELETE CASCADE,
    answer      TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
`);

  console.log('All tables created successfully.');
  await db.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});