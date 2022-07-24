const vm = require("vm");
const fs = require("fs");

module.exports = (context = {}) => {
  const path = "./fits/FITSKeywords.js"
  const data = fs.readFileSync(path);
  vm.runInNewContext(data, context, path);
  return context;
}