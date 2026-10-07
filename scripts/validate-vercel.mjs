import { readFileSync, existsSync } from "node:fs";
import Ajv from "ajv-draft-04";

const response = await fetch("https://openapi.vercel.sh/vercel.json", { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`Cannot fetch official Vercel schema: ${response.status}`);
const schema = await response.json();
// The upstream schema declares draft-04 but includes newer numeric bounds in
// experimental function fields. Translate those bounds without changing meaning.
function normalizeBounds(value) {
  if (!value || typeof value !== "object") return;
  for (const [exclusive, bound] of [["exclusiveMinimum", "minimum"], ["exclusiveMaximum", "maximum"]]) {
    if (typeof value[exclusive] === "number") {
      value[bound] = value[exclusive];
      value[exclusive] = true;
    }
  }
  for (const child of Object.values(value)) normalizeBounds(child);
}
normalizeBounds(schema);
const validate = new Ajv({ strict: false, allErrors: true, validateFormats: false }).compile(schema);
function check(label, value) {
  if (!validate(value)) throw new Error(`${label}: ${JSON.stringify(validate.errors, null, 2)}`);
  console.log(`${label}: valid against official Vercel JSON schema`);
}
const config = JSON.parse(readFileSync("vercel.json", "utf8"));
check("vercel.json", config);
for (const old of ["vercel.mjs", "vercel.js", "vercel.ts", "vercel.cjs", "vercel.mts"]) {
  if (existsSync(old)) throw new Error(`Conflicting config: remove ${old}`);
}
const output = JSON.parse(readFileSync(".vercel/output/config.json", "utf8"));
if (output.version !== 3 || !existsSync(".vercel/output/static/index.html")) throw new Error("Incomplete Build Output API artifact");
// Build Output API routes use the same routing schema as vercel.json.
check("Generated deployment routes", { routes: output.routes });
