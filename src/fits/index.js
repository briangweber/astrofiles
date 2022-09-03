import vm from "vm";
import fs from "fs";

module.exports = (context = {}) => {
	const path = "./fits/FITSKeywords.js";
	const data = fs.readFileSync(path);
	vm.runInNewContext(data, context, path);
	return context;
};