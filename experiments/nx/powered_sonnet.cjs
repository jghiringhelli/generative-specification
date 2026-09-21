const P = require("./problems.cjs");
const keep = P.PROBLEMS.filter(p => p.id === "business-days-add");
P.PROBLEMS.length = 0; P.PROBLEMS.push(...keep);
process.argv[2] = "4";
require("./harness.cjs");
