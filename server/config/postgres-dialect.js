'use strict';

const pg = require('pg');

const POSTGRES_CONNECTION_TIMEOUT_MS = 10000;

function createPostgresDialectModule(
  pgModule = pg,
  connectionTimeoutMillis = POSTGRES_CONNECTION_TIMEOUT_MS
) {
  class BoundedPostgresClient extends pgModule.Client {
    constructor(config = {}) {
      super({
        ...config,
        connectionTimeoutMillis,
      });
    }
  }

  return {
    ...pgModule,
    Client: BoundedPostgresClient,
  };
}

module.exports = {
  POSTGRES_CONNECTION_TIMEOUT_MS,
  createPostgresDialectModule,
  postgresDialectModule: createPostgresDialectModule(),
};
