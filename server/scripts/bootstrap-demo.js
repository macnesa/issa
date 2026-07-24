'use strict';

const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { assertPhotoFixture, assertRemoteDemoBootstrap } = require('./demo-safety');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: __dirname + '/..',
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed.`);
  }
}

async function assertRemoteDatabaseIsEmpty(databaseUrl) {
  const databaseClient = new Client({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'false'
      ? false
      : { rejectUnauthorized: false },
  });

  await databaseClient.connect();
  try {
    const result = await databaseClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (result.rowCount > 0) {
      throw new Error('Refusing remote demo bootstrap: target database schema is not empty.');
    }
  } finally {
    await databaseClient.end();
  }
}

async function bootstrapRemoteDemoDatabase() {
  const target = assertRemoteDemoBootstrap();
  assertPhotoFixture();
  await assertRemoteDatabaseIsEmpty(target.databaseUrl);

  console.log(`Bootstrapping an empty remote PostgreSQL database on ${target.databaseHost}.`);
  const sequelizeCli = require.resolve('sequelize-cli/lib/sequelize');
  run(process.execPath, [sequelizeCli, 'db:migrate', '--env', 'production']);
  run(process.execPath, ['scripts/seed-demo.js']);
  run(process.execPath, ['scripts/verify-demo.js']);
  console.log('Remote ISSA demo bootstrap completed and verified.');
}

bootstrapRemoteDemoDatabase().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
