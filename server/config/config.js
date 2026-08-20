'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const productionUsesSsl = process.env.DATABASE_SSL !== 'false';
const { postgresDialectModule } = require('./postgres-dialect');

function getTestDatabaseName() {
  const testDatabaseName = process.env.TEST_DB_NAME?.trim();
  const developmentDatabaseName = process.env.DB_NAME?.trim();

  if (process.env.NODE_ENV !== 'test') return testDatabaseName;
  if (!testDatabaseName) {
    throw new Error(
      'TEST_DB_NAME must be configured before running database-backed tests.'
    );
  }
  if (testDatabaseName === developmentDatabaseName) {
    throw new Error(
      'TEST_DB_NAME must be different from DB_NAME.'
    );
  }
  return testDatabaseName;
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: false,
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: getTestDatabaseName(),
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectModule: postgresDialectModule,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 10000,
      idle: 10000,
    },
    dialectOptions: productionUsesSsl ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
  },
};
