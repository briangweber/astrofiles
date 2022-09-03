#!/usr/bin/env node

import fs from "fs";
import path from "path";
import prompt from "prompt";
import config from "./config";
import { tryLinkSharedCalibration } from "./linkcommon";

const directoriesToRename = [
	{ original: "Light", new: "lights", dssName: "light", applyFilter: true },
	{ original: "Dark", new: "darks", dssName: "dark" },
	{ original: "Flat", new: "flats", dssName: "flat", applyFilter: true },
	{ original: "DarkFlat", new: "darkFlats" },
];

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const sessionAlreadyUpdatedFileFormat = /.*_SESSION_.*/;
const filterAlreadyUpdatedFileFormat = /.*FILTER_.*/;

const currentWorkingDirectory = process.cwd();
const currentDirectoryName = path.parse(currentWorkingDirectory).name;
console.log(currentDirectoryName);

const doTheThings = async () => {
	if(!fs.existsSync("biases")) {
		fs.mkdirSync("biases");
		const { "ISO Level": isoLevel } = await prompt.get(["ISO Level"]);
		console.log(isoLevel);
		const sessionTag = dateFormat.test(currentDirectoryName) ? `_SESSION_${currentDirectoryName}` : "";
		fs.symlinkSync(path.join(config.biasRoot, `masterbias_ISO${isoLevel}.xisf`), `biases/master_bias_ISO${isoLevel}${sessionTag}.xisf`);
	}

	const { Filter: filter } = await prompt.get(["Filter"]);
	console.log(filter);
  
	const fileList = [];
	for(const directoryData of directoriesToRename) {
		if(directoryData.original && fs.existsSync(directoryData.original)) {
			fs.renameSync(directoryData.original, directoryData.new);
		}

		if(directoryData.original && !fs.existsSync(directoryData.new)) {
			tryLinkSharedCalibration(currentDirectoryName, directoryData);
		}

		if(fs.existsSync(directoryData.new)) {
			const files = fs.readdirSync(directoryData.new);
			let directory = `.\\${directoryData.new}`;
			if(directoryData.new === "biases") {
				directory = fs.readlinkSync(directory);
			}
			console.log(directory);

			for(let fileName of files) {
				let newFileName = fileName;
				const extension = newFileName.split(".").pop();

				if(!sessionAlreadyUpdatedFileFormat.test(fileName) && dateFormat.test(currentDirectoryName)) {
					newFileName = newFileName.replace(`.${extension}`, `_SESSION_${currentDirectoryName}.${extension}`);
					console.log(newFileName); 
				}

				if(directoryData.applyFilter && filter && !filterAlreadyUpdatedFileFormat.test(fileName)) {
					newFileName = newFileName.replace(`.${extension}`, `_FILTER_${filter}.${extension}`);
					console.log(newFileName);
				}

				if(newFileName !== fileName) {
					const directoryOfFile = path.join(currentWorkingDirectory, directoryData.new);
					fs.renameSync(path.join(directoryOfFile, fileName), path.join(directoryOfFile, newFileName));
					fileName = newFileName;
				}
  
				fileList.push({ type: directoryData.dssName, fileName: path.join(directory, fileName) });
			}
		}
	}

	const fileContents = 
`
DSS File List
CHECKED\tTYPE\tFILE
${fileList.map(file => `1\t${file.type}\t${file.fileName}`).join("\n")}
`;
	fs.writeFileSync("dssFileList.txt", fileContents);
};

doTheThings();
