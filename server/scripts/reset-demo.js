'use strict';

const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const config = require('../config/config').development;
const { Student, sequelize } = require('../models');
const {
  assertDevelopmentDatabase,
  assertPhotoFixture,
  existingStudentPhotos,
  isApprovedStudentPhoto,
} = require('./demo-safety');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: __dirname + '/..', stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed.`);
}

function assertSafeIdentifier(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Refusing demo reset: ${label} is not a safe local PostgreSQL identifier.`);
  }
}

async function disconnectLocalDatabaseUsers(databaseName) {
  const maintenanceClient = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: 'postgres',
  });

  await maintenanceClient.connect();
  await maintenanceClient.query(
    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
    [databaseName]
  );
  await maintenanceClient.end();
}

async function databaseExists(databaseName) {
  const maintenanceClient = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: 'postgres',
  });
  await maintenanceClient.connect();
  const result = await maintenanceClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  await maintenanceClient.end();
  return result.rowCount > 0;
}

function createLocalDevelopmentDatabase(databaseName) {
  assertSafeIdentifier(databaseName, 'database name');
  assertSafeIdentifier(config.username, 'database owner');
  run('psql', ['-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${databaseName}" OWNER "${config.username}"`]);
}

async function preserveAndValidateStudentPhotos() {
  const currentStudents = await Student.findAll({ attributes: ['imgUrl'], raw: true });
  const currentPhotos = [...new Set(currentStudents.map((student) => student.imgUrl).filter(Boolean))];

  const reusablePhotos = currentPhotos.filter(isApprovedStudentPhoto);
  if (currentPhotos.length > 0 && reusablePhotos.length === 0) {
    throw new Error('Refusing demo reset: no approved ISSA student photo could be preserved from the current database.');
  }

  if (!reusablePhotos.every((photo) => existingStudentPhotos.includes(photo))) {
    throw new Error('Refusing demo reset: current student photos are not fully represented by the approved ISSA photo fixture.');
  }
}

async function resetDemoDatabase() {
  const target = assertDevelopmentDatabase();
  assertPhotoFixture();
  const targetExists = await databaseExists(target.databaseName);
  if (targetExists) {
    await sequelize.authenticate();
    await preserveAndValidateStudentPhotos();
    await sequelize.close();
  }

  console.log(`Resetting local development database ${target.databaseName} on ${target.databaseHost}.`);
  const sequelizeCli = require.resolve('sequelize-cli/lib/sequelize');
  if (targetExists) {
    await disconnectLocalDatabaseUsers(target.databaseName);
    run(process.execPath, [sequelizeCli, 'db:drop', '--env', 'development']);
  }
  createLocalDevelopmentDatabase(target.databaseName);
  run(process.execPath, [sequelizeCli, 'db:migrate', '--env', 'development']);
  run(process.execPath, ['scripts/seed-demo.js']);
  run(process.execPath, ['scripts/verify-demo.js']);
}

resetDemoDatabase().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
