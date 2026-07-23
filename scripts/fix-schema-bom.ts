import { readFileSync, writeFileSync } from "fs";

function stripBom(s: string) {
  return s.replace(/^\uFEFF/, "");
}

for (const f of [
  "prisma/schema.prisma",
  "prisma/schema.sqlite.prisma",
  "prisma/schema.postgres.prisma",
]) {
  const raw = readFileSync(f, "utf8");
  writeFileSync(f, stripBom(raw), "utf8");
  console.log("fixed", f);
}
