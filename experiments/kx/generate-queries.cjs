/**
 * KX — Knowledge-retrieval replication (Yarmoluk & McCreary CKG benchmark
 * methodology applied to an AI coding harness).
 *
 * Generates ~46 queries in the T1–T5 taxonomy with deterministic ground truth
 * derived from the treatment-v8 Conduit project's own artifacts — the same
 * "ground truth derived from the structure" property (and caveat, their §8.5)
 * as the original benchmark.
 *
 * T1 entity/behavior  (negative control — answerable from code, not structure)
 * T2 doc obligation   (the Doc Obligation Table = dependency edges)
 * T3 layer path       (multi-hop traversal of the layer architecture)
 * T4 aggregate        (taxonomy enumeration: gates, ADRs, UCs, CNT branches)
 * T5 cross-link       (@gs-links edges: file → governing documents)
 *
 * Usage: node generate-queries.cjs  → writes queries.json
 */
const fs = require("fs");
const path = require("path");

const PROJECT = path.resolve(
  __dirname,
  "..",
  "ax",
  "treatment-v8",
  "output",
  "project",
);

const queries = [];
let n = 0;
const add = (type, query, truth) =>
  queries.push({ id: `${type}-${String(++n).padStart(2, "0")}`, type, query, truth });

const SUFFIX =
  " Answer with only the answer itself (a value, a comma-separated list, or one short sentence). No explanation.";

// ── T1: behavior questions (negative control — truth lives in code) ──
add("T1", "What HTTP status code does the API return when registering a user with an email that is already taken?" + SUFFIX, "409");
add("T1", "What HTTP status code does GET /api/user return when no authentication token is provided?" + SUFFIX, "401");
add("T1", "What HTTP status code does DELETE /api/articles/:slug return on success?" + SUFFIX, "204");
add("T1", "Which password hashing algorithm does the implementation use?" + SUFFIX, "argon2");
add("T1", "Which library validates and parses request bodies at the HTTP boundary?" + SUFFIX, "zod");
add("T1", "Which ORM is used for database persistence?" + SUFFIX, "prisma");
add("T1", "Which HTTP framework serves the API?" + SUFFIX, "express");
add("T1", "What HTTP status code does updating the current user with an empty-string username return?" + SUFFIX, "422");

// ── T2: doc obligations (the Doc Obligation Table = edges) ──
add("T2", "According to the project's conventions, what must be read first before implementing a new feature?" + SUFFIX, "docs/PRD.md and the relevant use case");
add("T2", "According to the project's conventions, what must be produced after implementing a new feature?" + SUFFIX, "spec decision record in docs/specs/");
add("T2", "According to the project's conventions, what must be read first before an architecture change?" + SUFFIX, "docs/architecture/layers.md and the ADR index");
add("T2", "According to the project's conventions, what must be produced after an architecture change?" + SUFFIX, "ADR in docs/adrs/active/");
add("T2", "According to the project's conventions, what must be read first before a data model or schema change?" + SUFFIX, "docs/architecture/data-model.md");
add("T2", "According to the project's conventions, what must be produced after a schema change?" + SUFFIX, "update schema and ERD");
add("T2", "According to the project's conventions, what must be read first before changing a module boundary?" + SUFFIX, "docs/architecture/modules.md");
add("T2", "According to the project's conventions, what must be produced after changing a module boundary?" + SUFFIX, "update modules.md and ADR if non-obvious");
add("T2", "According to the project's conventions, what must be read first before fixing a bug?" + SUFFIX, "linked use case and failing test");
add("T2", "According to the project's conventions, what must be produced after fixing a bug?" + SUFFIX, "regression note in use case");

// ── T3: layer paths (multi-hop — truth from the actual file chain) ──
function chain(feature, names) {
  const found = names.filter((f) => {
    const candidates = [
      path.join(PROJECT, "src", "http", f),
      path.join(PROJECT, "src", "services", f),
      path.join(PROJECT, "src", "repositories", f),
      path.join(PROJECT, "src", "adapters", "persistence", f),
    ];
    return candidates.some((c) => fs.existsSync(c));
  });
  if (found.length !== names.length) {
    const missing = names.filter((x) => !found.includes(x));
    console.warn(`WARN ${feature}: missing ${missing.join(", ")}`);
  }
  return found.join(", ");
}
add("T3", "Through which files does an article-creation request flow, from HTTP route to the database adapter? List one file name per layer in order." + SUFFIX,
  chain("articles", ["articleRoutes.ts", "ArticleController.ts", "ArticleService.ts", "IArticleRepository.ts", "PrismaArticleRepository.ts"]));
add("T3", "Through which files does a comment-creation request flow, from HTTP route to the database adapter? List one file name per layer in order." + SUFFIX,
  chain("comments", ["commentRoutes.ts", "CommentController.ts", "CommentService.ts", "ICommentRepository.ts", "PrismaCommentRepository.ts"]));
add("T3", "Through which files does a profile-follow request flow, from HTTP route to the database adapter? List one file name per layer in order." + SUFFIX,
  chain("profiles", ["profileRoutes.ts", "ProfileController.ts", "ProfileService.ts", "IProfileRepository.ts", "PrismaProfileRepository.ts"]));
add("T3", "Through which files does a user-registration request flow, from HTTP route to the database adapter? List one file name per layer in order." + SUFFIX,
  chain("users", ["userRoutes.ts", "UserController.ts", "UserService.ts", "IUserRepository.ts", "PrismaUserRepository.ts"]));
add("T3", "Name the architectural layers of this project in order, from the HTTP boundary to persistence." + SUFFIX,
  "routes, controllers, services, repository ports, persistence adapters");
add("T3", "In which directory do the repository port interfaces live, and in which directory do their database implementations live?" + SUFFIX,
  "src/repositories and src/adapters/persistence");
add("T3", "Which layer is the only one allowed to use the PrismaClient directly?" + SUFFIX,
  "persistence adapters (src/adapters/persistence)");
add("T3", "Where is the composition root that wires services to their adapters?" + SUFFIX,
  "src/server.ts");

// ── T4: aggregates (taxonomy enumeration — truth from the file system) ──
const gatesDir = path.join(PROJECT, ".forgecraft", "gates", "registry");
for (const cat of fs.readdirSync(gatesDir)) {
  const ids = fs
    .readdirSync(path.join(gatesDir, cat))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""));
  add("T4", `List the quality gate ids in the '${cat}' registry category.` + SUFFIX, ids.join(", "));
}
const adrs = fs
  .readdirSync(path.join(PROJECT, "docs", "adrs"))
  .filter((f) => /^ADR-/.test(f))
  .map((f) => f.replace(/\.md$/, ""));
add("T4", "List the ADR document ids that exist in this project." + SUFFIX, adrs.join(", "));
const ucs = fs
  .readFileSync(path.join(PROJECT, "docs", "use-cases.md"), "utf-8")
  .split("\n")
  .filter((l) => /^## UC-/.test(l))
  .map((l) => l.replace(/^## /, "").split(":")[0].trim());
add("T4", "List all use case IDs defined in this project." + SUFFIX, ucs.join(", "));
const cntBranches = fs
  .readdirSync(path.join(PROJECT, ".claude"))
  .filter((f) => f.endsWith(".md"));
add("T4", "List the markdown files at the top level of the .claude directory." + SUFFIX, cntBranches.join(", "));
const archDocs = fs
  .readdirSync(path.join(PROJECT, "docs", "architecture"))
  .filter((f) => f.endsWith(".md"));
add("T4", "List the architecture documents under docs/architecture/." + SUFFIX, archDocs.join(", "));
const specs = fs
  .readdirSync(path.join(PROJECT, "docs", "specs"))
  .filter((f) => f.endsWith(".md"));
add("T4", "List the spec decision records under docs/specs/." + SUFFIX, specs.join(", "));

// ── T5: @gs-links cross edges (file → governing docs) ──
const T5_FILES = [
  "src/adapters/persistence/PrismaUserRepository.ts",
  "src/adapters/security/JwtTokenService.ts",
  "src/adapters/security/Argon2PasswordHasher.ts",
  "src/http/ArticleController.ts",
  "src/http/articleRoutes.ts",
  "src/http/CommentController.ts",
  "src/config/env.ts",
  "src/adapters/persistence/PrismaProfileRepository.ts",
];
for (const rel of T5_FILES) {
  const full = path.join(PROJECT, ...rel.split("/"));
  if (!fs.existsSync(full)) {
    console.warn("WARN T5 missing:", rel);
    continue;
  }
  const m = fs.readFileSync(full, "utf-8").match(/@gs-links:\s*(.+)/);
  if (!m) {
    console.warn("WARN no gs-links in", rel);
    continue;
  }
  add("T5", `Which documents govern ${rel} according to the project's traceability links?` + SUFFIX, m[1].trim());
}

fs.writeFileSync(
  path.join(__dirname, "queries.json"),
  JSON.stringify(queries, null, 2),
);
const byType = {};
for (const q of queries) byType[q.type] = (byType[q.type] || 0) + 1;
console.log("queries.json written:", queries.length, "queries", JSON.stringify(byType));
