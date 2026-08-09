import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(target) : [target];
    }),
  );
  return nested.flat().filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
}

const forbiddenPublicNames = [
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_RESEND_API_KEY",
];
const files = await sourceFiles(path.resolve("src"));

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const name of forbiddenPublicNames) {
    if (content.includes(name)) throw new Error(`${name} found in ${file}`);
  }
  if (
    /^[\s\S]*?["']use client["'];/.test(content) &&
    content.includes("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    throw new Error(`Service-role key referenced by client module ${file}`);
  }
}

console.log(
  `Checked ${files.length} source files for client-exposed secret names.`,
);
