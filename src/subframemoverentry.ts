#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { generateSubframeMoves } from "./subframemover/subframemovegenerator";

const [,,fileName, ...additionalArgs] = process.argv;
// console.log(fileName);

if(additionalArgs.find(a => a=== "--help")) {
	console.log("Uses CSV output of PixInsight's Subframe Selector to move files to a rejected folder.");
	console.log("");
	console.log("subframe_move [filename.csv]");
	console.log("Additional parameters: ");
	console.log("--help: Print this message");
	console.log("--dry-run: Process the CSV and output the file moves that would have occurred");
	process.exit();
}

const filePath = path.join(process.cwd(), fileName);
// console.log(filePath);

if(!fileName.endsWith(".csv") || !fs.existsSync(filePath)) {
	throw new Error(`${filePath} not found`);
}

const fileContents = fs.readFileSync(filePath).toString();
// console.log(fileContents);

const fileMoves = generateSubframeMoves(fileContents);
// console.log(fileMoves);

if(!fileMoves.length) {
	console.log("No files to move, exiting!");
}

const rejectedDirectory = path.join(process.cwd(), "rejected");
if(additionalArgs.find(a => a === "--dry-run")) {
	console.log("Planned to move:");
	fileMoves.map(f => console.log(f.sourcePath, " -> ", path.join(rejectedDirectory, f.fileName)));
} else {
	!fs.existsSync(rejectedDirectory) && fs.mkdirSync(rejectedDirectory);
	fileMoves.forEach(f => {
		if(!fs.existsSync(f.sourcePath)) { 
			console.log("Skipped missing file", f.sourcePath);
			return;
		} 
		fs.renameSync(f.sourcePath, path.join(rejectedDirectory, f.fileName));
		console.log("Moved: ",f.sourcePath, " -> ", path.join(rejectedDirectory, f.fileName));
	});
}