'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const config = require('../config/config').development;
const existingStudentPhotos = require('../data-seeding/student-photos.json');

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const remoteBootstrapFlag = 'ALLOW_REMOTE_DEMO_BOOTSTRAP';

function assertDevelopmentDatabase() {
  const environment = process.env.NODE_ENV || 'development';
  const databaseName = String(config.database || '');
  const databaseHost = String(config.host || '').toLowerCase();

  if (environment !== 'development') {
    throw new Error(`Refusing demo reset: NODE_ENV must be development, received ${environment}.`);
  }

  if (!localHosts.has(databaseHost)) {
    throw new Error(`Refusing demo reset: database host ${databaseHost || '(empty)'} is not local.`);
  }

  if (!/(^|[_-])(dev|demo|local)([_-]|$)|development/i.test(databaseName)) {
    throw new Error(`Refusing demo reset: database ${databaseName || '(empty)'} is not a recognised local development database.`);
  }

  if (!config.username || !config.database) {
    throw new Error('Refusing demo reset: local development database configuration is incomplete.');
  }

  return { environment, databaseName, databaseHost };
}

function assertRemoteDemoBootstrap() {
  if (process.env[remoteBootstrapFlag] !== 'true') {
    throw new Error(`Refusing remote demo bootstrap: set ${remoteBootstrapFlag}=true explicitly.`);
  }

  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Refusing remote demo bootstrap: NODE_ENV must be production.');
  }

  const databaseUrl = String(process.env.DATABASE_URL || '').trim();
  if (!databaseUrl) {
    throw new Error('Refusing remote demo bootstrap: DATABASE_URL is required.');
  }

  let parsedDatabaseUrl;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('Refusing remote demo bootstrap: DATABASE_URL is invalid.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error('Refusing remote demo bootstrap: DATABASE_URL must use PostgreSQL.');
  }

  if (localHosts.has(parsedDatabaseUrl.hostname.toLowerCase())) {
    throw new Error('Refusing remote demo bootstrap: use db:reset-demo for a local database.');
  }

  return {
    databaseHost: parsedDatabaseUrl.hostname,
    databaseUrl,
  };
}

function assertDemoDatabaseTarget() {
  return process.env[remoteBootstrapFlag] === 'true'
    ? assertRemoteDemoBootstrap()
    : assertDevelopmentDatabase();
}

function isApprovedStudentPhoto(photoReference) {
  try {
    const photoUrl = new URL(photoReference);
    return photoUrl.protocol === 'https:' && photoUrl.hostname === 'live.staticflickr.com';
  } catch {
    return false;
  }
}

function assertPhotoFixture() {
  if (!Array.isArray(existingStudentPhotos) || existingStudentPhotos.length === 0) {
    throw new Error('Refusing demo reset: preserved student photo fixture is empty.');
  }

  if (new Set(existingStudentPhotos).size !== existingStudentPhotos.length || !existingStudentPhotos.every(isApprovedStudentPhoto)) {
    throw new Error('Refusing demo reset: preserved student photo fixture contains an invalid reference.');
  }
}

module.exports = {
  assertDemoDatabaseTarget,
  assertDevelopmentDatabase,
  assertPhotoFixture,
  assertRemoteDemoBootstrap,
  existingStudentPhotos,
  isApprovedStudentPhoto,
};
