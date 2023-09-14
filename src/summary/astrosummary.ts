#!/usr/bin/env node

import _ from "lodash";
import fs from "fs";
import path from "path";
import { getMetadataFromFile } from "../filemetadata";
import { getLightFiles, getSubdirectories } from "../helpers";

type Session = { date: string, exposureTime: number, sensorTemperature?: number, filter: string, count: number, notes?: string };

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;

function readNotes(folder: string): string | undefined {
	const notesPath = path.join(folder, "notes.txt");
	const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, { encoding: "utf-8" }) : undefined;
	return notes;
}

const doAsyncThings = async () => {
	console.log("Running new code");
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
		const sessions: Session[] = []; 
		for(const dateDirectory of dateSubdirectories) {
			const datePath = path.join(targetDirectory, dateDirectory);

			const dateNotes = readNotes(datePath);

			const { lightFiles, lightDirectory } = getLightFiles(datePath);
			const lightFile = lightFiles?.[0];
			if(!lightFile || !lightDirectory) {
				continue;
			}

			const fileMetadatas = lightFiles.map(f => getMetadataFromFile(path.join(datePath, lightDirectory, f)));
			const groupedFiles = Object.values(_.groupBy(fileMetadatas, f=> `${f.exposureTime}:${f.filter}`));
			const subsessions: Session[] = groupedFiles.map(group => ({ 
				date: dateDirectory, 
				exposureTime: group[0].exposureTime || -1, 
				filter: group[0].filter || "None", 
				sensorTemperature: group[0].temperature,
				count: group.length,
				notes: dateNotes 
			}));
			subsessions.length > 1 && console.log("Found subsessions:", targetDirectory, dateDirectory);

			subsessions.length > 0 && sessions.push(...subsessions);
		}

		const groupedSessions = Object.values(_.groupBy(sessions, s => `${s.exposureTime}:${s.filter}`));
		const summary = groupedSessions.map(group => ({ exposureTime: group[0].exposureTime, filter: group[0].filter, totalCount: _.sumBy(group, "count") }));

		targets.push({ target: directory, notes: targetNotes, summary, sessions });
	}

	if(process.argv.includes("--csv")) {
		console.log("You wanted a CSV. Cool story bro.");
	} else {
		console.log(JSON.stringify(targets));
	}
  
};

doAsyncThings();