const P = require("./problems.cjs");
const keep = P.PROBLEMS.filter(p => p.id === "business-days-add");
P.PROBLEMS.length = 0; P.PROBLEMS.push(...keep);
process.argv[2] = "4"; process.argv[3] = "qwen2.5-coder:7b";
require("./harness_ollama.cjs");
