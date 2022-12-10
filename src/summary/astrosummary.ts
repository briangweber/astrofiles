#!/usr/bin/env node

import _ from "lodash";
import fs from "fs";
import path from "path";
import { getNumericKeyword, readKeywords } from "../fits/keywordreader";

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;

function getSubdirectories(path: string): string[] {
	const subdirectories = fs.readdirSync(path, { withFileTypes: true }).filter(e => e.isDirectory());
	return subdirectories.map(s => s.name);
} 

const doAsyncThings = async () => {
	const currentWorkingDirectory = process.cwd();
	console.log(currentWorkingDirectory);

	const subdirectories = getSubdirectories(currentWorkingDirectory);
	const targets: any[] = [];
	for(const directory of subdirectories) {
		console.log("Target name:", directory);

		const dateSubdirectories = getSubdirectories(path.join(currentWorkingDirectory, directory)).filter(s => dateFormat.test(s));
		if(dateSubdirectories.length === 0) {
			continue;
		}
		// console.log("Found some date directories:", dateSubdirectories.length);
		const sessions: { date: string, exposureTime: number, sensorTemperature?: number, filter: string, count: number }[] = []; 
		for(const dateDirectory of dateSubdirectories) {
			const datePath = path.join(currentWorkingDirectory, directory, dateDirectory);
			const lightDirectory = getSubdirectories(datePath).find(s => /light[s]{0,1}/i.test(s));
			if(!lightDirectory) {
				continue;
			}
			const lightFiles =fs.readdirSync(path.join(datePath, lightDirectory), { withFileTypes: true })
				.filter(f=> f.isFile()); 
			const lightFile = lightFiles[0]?.name;
			if(!lightFile) {
				continue;
			}

			const keywords = readKeywords(path.join(currentWorkingDirectory, directory, dateDirectory));
			const filter = keywords.find(k => k.keywordName === "FILTER")?.keywordValue || /.*FILTER_(.*?)(?:_|\.).*/.exec(lightFile)?.[1];
			const keywordExposureTime = getNumericKeyword("EXPTIME", keywords, true) ;
			const fileNameExposureTime = /.*_([0-9.]*)(?:s|_secs| s)_.*/ig.exec(lightFile)?.[1];
			const exposureTime = keywordExposureTime || parseInt(fileNameExposureTime || "-1");
			const sensorTemperature = getNumericKeyword("CCD-TEMP", keywords, true);
			sessions.push({ date: dateDirectory, exposureTime, filter: filter || "None", sensorTemperature, count: lightFiles.length });
			// console.log(`${directory}--${dateDirectory}: ${exposureTime}, ${filter}`);
		}

		const groupedSessions = Object.values(_.groupBy(sessions, s => `${s.exposureTime}:${s.filter}`));
		const summary = groupedSessions.map(group => ({ exposureTime: group[0].exposureTime, filter: group[0].filter, totalCount: _.sumBy(group, "count") }));

		targets.push({ target: directory, summary, sessions });
	}
	console.log(JSON.stringify(targets));
  
};

doAsyncThings();