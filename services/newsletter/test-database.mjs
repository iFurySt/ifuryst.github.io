import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";

export function database() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync(new URL("./migrations/", import.meta.url)).sort()) {
    sqlite.exec(readFileSync(new URL(`./migrations/${file}`, import.meta.url), "utf8"));
  }
  return {
    sqlite,
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              return sqlite.prepare(sql).get(...params) || null;
            },
            async run() {
              return sqlite.prepare(sql).run(...params);
            },
            async all() {
              return { results: sqlite.prepare(sql).all(...params) };
            },
          };
        },
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = await Promise.all(statements.map((statement) => statement.run()));
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
