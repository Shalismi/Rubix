import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const TEST_DATABASE_NAME = "rubix_test";
const developmentDatabaseUrl = process.env.DATABASE_URL;

if (!developmentDatabaseUrl) {
  throw new Error("DATABASE_URL is required to create the test database.");
}

function replaceDatabaseName(connectionString: string, databaseName: string) {
  const url = new URL(connectionString);
  url.pathname = `/${databaseName}`;

  return url.toString();
}

function toPostgresConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete("schema");

  return url.toString();
}

export const testDatabaseUrl = replaceDatabaseName(
  developmentDatabaseUrl,
  TEST_DATABASE_NAME,
);

const adminDatabaseUrl = toPostgresConnectionString(
  replaceDatabaseName(developmentDatabaseUrl, "postgres"),
);
const testPostgresUrl = toPostgresConnectionString(testDatabaseUrl);

async function withClient(
  connectionString: string,
  callback: (client: Client) => Promise<void>,
) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await callback(client);
  } finally {
    await client.end();
  }
}

export async function createCleanTestDatabase() {
  await withClient(adminDatabaseUrl, async (client) => {
    const existingDatabase = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [TEST_DATABASE_NAME],
    );

    if (existingDatabase.rowCount === 0) {
      await client.query(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
    }
  });

  await withClient(testPostgresUrl, async (client) => {
    await client.query('DROP SCHEMA IF EXISTS "public" CASCADE');
    await client.query('CREATE SCHEMA "public"');

    const migrationsDirectory = path.resolve(
      process.cwd(),
      "prisma",
      "migrations",
    );
    const migrationEntries = await readdir(migrationsDirectory, {
      withFileTypes: true,
    });
    const migrationDirectories = migrationEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migrationDirectory of migrationDirectories) {
      const migrationSql = await readFile(
        path.join(migrationsDirectory, migrationDirectory, "migration.sql"),
        "utf8",
      );

      await client.query(migrationSql);
    }
  });
}

export async function dropTestDatabase() {
  await withClient(adminDatabaseUrl, async (client) => {
    await client.query(
      `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
      [TEST_DATABASE_NAME],
    );
    await client.query(`DROP DATABASE IF EXISTS "${TEST_DATABASE_NAME}"`);
  });
}
