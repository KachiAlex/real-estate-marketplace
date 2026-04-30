// Temporary runner to test external Render Postgres connectivity
process.env.DATABASE_URL = 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';
process.env.NODE_ENV = 'production';
require('./test-db-connection');
