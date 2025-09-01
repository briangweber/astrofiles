#!/usr/bin/env node

import _ from "lodash";
import config from "../../config";
import fs from "fs";
import path from "path";
import { getMetadataFromFile } from "../filemetadata";
import { getLightFiles, getSubdirectories } from "../helpers";
import { stringify } from "csv-stringify/sync";

type Tag = { key: string, value: string };

type Target = { target: string; notes?: string; summary: any[]; sessions: Session[], tags: Tag[], hasDataSinceLastPublish?: boolean };
type Session = { date: string, exposureTime: number, sensorTemperature?: number, filter: string, camera: string, count: number, notes?: string };

type SessionFilters = { camera?: string; }

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;

function readNotes(folder: string): { notes: string | undefined; tags: Tag[] } {
	const notesPath = path.join(folder, "notes.txt");
	let notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, { encoding: "utf-8" }) : undefined;
	const tagString = notes?.match(/tags:(.*)/);
	let tags: Tag[] = [];
	if (tagString?.length) {
		const [, rawTags] = tagString;
		notes = notes?.replace(`tags:${rawTags}`, "").trim();
		// console.log(rawTags);
		const parsedTags = rawTags.split(";").map(t => {
			const [key, value = ""] = t.split(":");
			return { key, value };
		});
		tags = parsedTags;
	}
	return { notes, tags };
}

function getLastPublishedDate(tags: Tag[]): string | undefined {
	const publishedTags = tags.filter(t => t.key === "published");
	if (!publishedTags.length) {
		return undefined;
	}

	// Get the latest published date
	return publishedTags.sort().at(-1)?.value;
}

function summarizeTarget(targetName: string, targetDirectory: string, sessionFilters: SessionFilters): Target[] {
	const { notes: targetNotes, tags: targetTags } = readNotes(targetDirectory);
	const cameraFromTargetTags = targetTags.find(t => t.key === "camera")?.value;
	const lastPublishedDate = getLastPublishedDate(targetTags);
	const targetSubdirectories = getSubdirectories(targetDirectory);
	const dateSubdirectories = targetSubdirectories.filter(s => dateFormat.test(s));
	if (dateSubdirectories.length === 0) {
		// console.log(`Deep diving into ${targetDirectory}`);
		// Maybe it's a mosaic?
		const panelSubdirectories = targetSubdirectories.filter(s => getSubdirectories(path.join(targetDirectory, s)).filter(t => dateFormat.test(t)).length > 0);
		if (panelSubdirectories.length === 0) {
			return [];
		}

		return panelSubdirectories.map(s => summarizeTarget(`${targetName} ${s}`, path.join(targetDirectory, s), sessionFilters)).flatMap(t => t);
	}
	// console.log("Found some date directories:", dateSubdirectories.length);
	const sessions: Session[] = [];
	for (const dateDirectory of dateSubdirectories) {
		const datePath = path.join(targetDirectory, dateDirectory);

		const { notes: dateNotes, tags: dateTags } = readNotes(datePath);
		const cameraFromDateTags = dateTags.find(k => k.key === "camera")?.value;

		const { lightFiles, lightDirectory } = getLightFiles(datePath);
		const lightFile = lightFiles?.[0];
		if (!lightFile || !lightDirectory) {
			continue;
		}

		const fileMetadatas = lightFiles.map(f => getMetadataFromFile(path.join(datePath, lightDirectory, f)));
		const groupedFiles = Object.values(_.groupBy(fileMetadatas, f => `${f.exposureTime}:${f.filter}`));
		let subsessions: Session[] = groupedFiles.map(group => ({
			date: dateDirectory,
			exposureTime: group[0].exposureTime || -1,
			filter: group[0].filter || "None",
			camera: group[0].camera ?? cameraFromDateTags ?? cameraFromTargetTags ?? config.defaultCamera,
			isDslr: lightFiles[0].endsWith(".cr2"),
			sensorTemperature: group[0].temperature,
			count: group.length,
			notes: dateNotes
		}));
		// subsessions.length > 1 && console.log("Found subsessions:", targetDirectory, dateDirectory);
		if (sessionFilters?.camera) {
			subsessions = subsessions.filter(s => s.camera === sessionFilters.camera);
		}

		subsessions.length > 0 && sessions.push(...subsessions);
	}

	const groupedSessions = Object.values(_.groupBy(sessions, s => `${s.exposureTime}:${s.filter}`));
	const summary = groupedSessions.map(group => ({ exposureTime: group[0].exposureTime, filter: group[0].filter, totalCount: _.sumBy(group, "count") }));
	const hasDataSinceLastPublish = lastPublishedDate ? sessions.filter(s => s.date > lastPublishedDate).length > 0 : true;

	return [{ target: targetName, notes: targetNotes, tags: targetTags, hasDataSinceLastPublish, summary, sessions }];
}

const doAsyncThings = async () => {
	const currentWorkingDirectory = process.cwd();
	// console.log(currentWorkingDirectory);

	const subdirectories = getSubdirectories(currentWorkingDirectory);
	const targets: Target[] = [];

	const filters: SessionFilters = {};
	const cameraFilterArg = process.argv.find(a => a.startsWith("--camera="));
	if (cameraFilterArg) {
		filters.camera = cameraFilterArg.replace("--camera=", "");
	}

	if (process.argv.includes("--target")) {
		const target = summarizeTarget("Current", currentWorkingDirectory, filters);
		target && targets.push(...target);
	} else {
		for (const directory of subdirectories) {
			// console.log("Target name:", directory);

			const targetDirectory = path.join(currentWorkingDirectory, directory);
			const target = summarizeTarget(directory, targetDirectory, filters);
			target && targets.push(...target);
		}
	}

	if (process.argv.includes("--csv")) {
		if (!process.argv.includes("--target")) {
			console.log("Can only export CSV on single target summaries");
			return;
		}
		const mappedTargets = targets[0].sessions.map(session => ({
			date: session.date,
			filter: config.filters[session.filter]?.astroBinFilterId,
			number: session.count,
			duration: session.exposureTime,
			sensorCooling: session.sensorTemperature,
			...config.additionalCsvFields
		}));
		console.log(stringify(mappedTargets, { header: true }));
	} else {
		console.log(JSON.stringify(targets));
	}

};

doAsyncThings();