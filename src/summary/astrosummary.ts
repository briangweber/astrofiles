#!/usr/bin/env node

import _ from "lodash";
import fs from "fs";
import path from "path";
import { getMetadataFromFile } from "../filemetadata";
import { getLightFiles, getSubdirectories } from "../helpers";

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;

function readNotes(folder: string): string | undefined {
	const notesPath = path.join(folder, "notes.txt");
	const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, { encoding: "utf-8" }) : undefined;
	return notes;
}

const doAsyncThings = async () => {
	const currentWorkingDirectory = process.cwd();
	// console.log(currentWorkingDirectory);

	const subdirectories = getSubdirectories(currentWorkingDirectory);
	const targets: any[] = [];
	for(const directory of subdirectories) {
		// console.log("Target name:", directory);

		const targetDirectory = path.join(currentWorkingDirectory, directory);
		const targetNotes = readNotes(targetDirectory);
		const dateSubdirectories = getSubdirectories(targetDirectory).filter(s => dateFormat.test(s));
		if(dateSubdirectories.length === 0) {
			continue;
		}
		// console.log("Found some date directories:", dateSubdirectories.length);
		const sessions: { date: string, exposureTime: number, sensorTemperature?: number, filter: string, count: number, notes?: string }[] = []; 
		for(const dateDirectory of dateSubdirectories) {
			const datePath = path.join(targetDirectory, dateDirectory);

			const dateNotes = readNotes(datePath);

			const { lightFiles, lightDirectory } = getLightFiles(datePath);
			const lightFile = lightFiles?.[0];
			if(!lightFile || !lightDirectory) {
				continue;
			}

			const metadata = getMetadataFromFile(path.join(datePath, lightDirectory, lightFile));
			sessions.push({ 
				date: dateDirectory, 
				exposureTime: metadata.exposureTime || -1, 
				filter: metadata.filter || "None", 
				sensorTemperature: metadata.temperature, 
				count: lightFiles.length,
				notes: dateNotes,
			});
			// console.log(`${directory}--${dateDirectory}: ${exposureTime}, ${filter}`);
		}

		const groupedSessions = Object.values(_.groupBy(sessions, s => `${s.exposureTime}:${s.filter}`));
		const summary = groupedSessions.map(group => ({ exposureTime: group[0].exposureTime, filter: group[0].filter, totalCount: _.sumBy(group, "count") }));

		targets.push({ target: directory, notes: targetNotes, summary, sessions });
	}
	console.log(JSON.stringify(targets));
  
};

doAsyncThings();