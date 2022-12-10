#!/usr/bin/env node

import _ from "lodash";
import fs from "fs";
import path from "path";
import glob from "glob-promise";
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
console.log(fileMoves);

if(!fileMoves.length) {
	console.log("No files to move, exiting!");
}

const rejectedDirectory = path.join(process.cwd(), "rejected");
const skippedFiles: string[] = [];
const moveInstructions = _.compact(fileMoves.map(f => {
	// Use glob to find the file
	const [sourcePath] = glob.sync(f.sourcePath);

	if(!sourcePath) {
		skippedFiles.push(f.sourcePath);
		return;
	}

	const destinationPath = path.join(rejectedDirectory, path.basename(sourcePath));

	return { sourcePath, destinationPath };
}));

if(additionalArgs.find(a => a === "--dry-run")) {
	console.log("Planned to move:");
	for (const instruction of moveInstructions) {
		console.log(instruction.sourcePath, " -> ", instruction.destinationPath);
	}
} else {
	!fs.existsSync(rejectedDirectory) && fs.mkdirSync(rejectedDirectory);
	moveInstructions.forEach(f => {
		if(!fs.existsSync(f.sourcePath)) { 
			console.log("Skipped missing file", f.sourcePath);
			return;
		} 

		fs.renameSync(f.sourcePath, f.destinationPath);
		console.log("Moved: ",f.sourcePath, " -> ", path.join(rejectedDirectory, f.destinationPath));
	});
}