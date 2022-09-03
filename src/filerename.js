import fs from "fs";
import path from "path";

const directoriesToRename = [
	{ original: "Light", new: "lights", dssName: "light" },
	{ original: "Dark", new: "darks", dssName: "dark" },
	{ original: "Flat", new: "flats", dssName: "flat" },
	{ new: "biases", dssName: "offset" },
	{ new: "darkFlats" }
];

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const alreadyUpdatedFileFormat = /.*_SESSION_.*/;

const currentWorkingDirectory = process.cwd();

const doTheThings = async () => {
	const currentDirectoryName = path.parse(currentWorkingDirectory).name;
	console.log(currentDirectoryName);

	if(!dateFormat.test(currentDirectoryName)) {
		throw new Error("Current directory is not a date");
	}

	for(const directoryData of directoriesToRename) {
		if(!fs.existsSync(directoryData.new)) {
			continue;
		}

		const files = fs.readdirSync(directoryData.new);

		for(let fileName of files) {
			if(alreadyUpdatedFileFormat.test(fileName)) {
				console.log("Already updated");
				continue;
			}

			const targetName = fileName.split("_")[0];
			const newFileName = fileName.replace(targetName, `${targetName}_SESSION_${currentDirectoryName}`);
			console.log(newFileName);
			const directoryOfFile = path.join(currentWorkingDirectory, directoryData.new);
			fs.renameSync(path.join(directoryOfFile, fileName), path.join(directoryOfFile, newFileName));
		}
	}
};

doTheThings();