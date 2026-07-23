import { readFileSync, writeFileSync, readdirSync } from "fs";

console.log("prisma files:", readdirSync("prisma").join(", "));

const s = readFileSync("prisma/schema.prisma", "utf8");
const sqlite = s.replace(
  /provider\s*=\s*"postgresql"/,
  'provider = "sqlite"'
);
const postgres = s.includes('provider = "postgresql"')
  ? s
  : s.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

writeFileSync("prisma/schema.postgres.prisma", postgres);
writeFileSync("prisma/schema.sqlite.prisma", sqlite);
writeFileSync("prisma/schema.prisma", sqlite);

console.log(
  "schema.prisma ->",
  readFileSync("prisma/schema.prisma", "utf8").match(/provider\s*=\s*"\w+"/)?.[0]
);
console.log(
  "schema.postgres.prisma ->",
  readFileSync("prisma/schema.postgres.prisma", "utf8").match(/provider\s*=\s*"\w+"/)?.[0]
);
