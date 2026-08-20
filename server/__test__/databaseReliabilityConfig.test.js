const productionConfig = require('../config/config').production;
const {
  POSTGRES_CONNECTION_TIMEOUT_MS,
  createPostgresDialectModule,
} = require('../config/postgres-dialect');

describe('production PostgreSQL reliability configuration', () => {
  test('uses a small pool with bounded acquisition', () => {
    expect(productionConfig.pool).toEqual({
      max: 5,
      min: 0,
      acquire: 10000,
      idle: 10000,
    });
  });

  test('passes a bounded connection timeout to every pg client', () => {
    let receivedConfig;
    class FakeClient {
      constructor(config) {
        receivedConfig = config;
      }
    }
    const dialectModule = createPostgresDialectModule({
      Client: FakeClient,
      types: {},
    });

    new dialectModule.Client({ host: 'database.example' });

    expect(receivedConfig).toEqual({
      host: 'database.example',
      connectionTimeoutMillis: POSTGRES_CONNECTION_TIMEOUT_MS,
    });
    expect(productionConfig.dialectModule).toEqual(expect.objectContaining({
      Client: expect.any(Function),
      types: expect.any(Object),
    }));
  });
});
