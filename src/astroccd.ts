#!/usr/bin/env node

import fs from "fs";
import path from "path";
import prompt from "prompt";
import config from "../config";
import { FileMetadata, getMetadataFromFile } from "./filemetadata";
import { getLightFiles } from "./helpers";
import { tryLinkSharedCalibration, tryLinkLibraryCalibration } from "./linkcommon";
import { FsOps } from "./fsops";

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const sessionAlreadyUpdatedFileFormat = /.*_SESSION_.*/;
const filterAlreadyUpdatedFileFormat = /.*FILTER_.*/;
const cameraAlreadyUpdateFileFormat = /.*_CAM_.*?_/;

const currentWorkingDirectory = process.cwd();
const currentDirectoryName = path.parse(currentWorkingDirectory).name;
console.log(currentDirectoryName);

const isDryRun = process.argv.includes("--dry-run");
const fsOps = new FsOps(isDryRun);

const doTheAsyncThings = async () => {
	const defaultCamera = config.defaultCamera || Object.keys(config.cameras)[0];

	const { lightFiles, lightDirectory } = getLightFiles(currentWorkingDirectory);

	if (!lightDirectory) {
		console.log("No light directory found!");
		return;
	}

	const metadataGroups = lightFiles.reduce((prev, l) => {
		const metadata = getMetadataFromFile(path.join(lightDirectory, l));
		const key = `${metadata.exposureTime}-${metadata.filter}-${metadata.temperature}`;
		prev[key] = prev[key] || [];
		prev[key].push(metadata);
		return prev;
	}, {} as Record<string, FileMetadata[]>);
	// console.log(metadataGroups);
	const metadata = Object.values(metadataGroups).map(value => ({ camera: value[0].camera || "", filter: value[0].filter || "", temperature: value[0].temperature, exposureTime: value[0].exposureTime, count: value.length }));

	const { camera } = await prompt.get({
		properties: {
			camera: { description: "Camera", default: metadata[0]?.camera || defaultCamera }
		}
	});

	if (typeof (camera) !== "string" || config.cameras[camera] === undefined) {
		console.log("Camera does not match any known configurations:", camera);
		return;
	}

	// We ensured we found a match for the camera above.
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const { defaultGain, defaultOffset, filters, sharedCalibrationRoot: cameraCalibrationRoot } = config.cameras[camera]!;
	const { gain, offset } = await prompt.get({
		properties: {
			gain: { default: defaultGain },
			offset: { default: defaultOffset },
		}
	});

	// const darkFlatExposureTime = filters[filter].darkFlatDuration;

	const sharedCalibrationRoot = cameraCalibrationRoot || config.sharedCalibrationRoot;
	const basePath = path.join(sharedCalibrationRoot, camera);

	// const exposureTimeString = `${exposureTime}s`;
	const gainAndOffset = `g${gain}o${offset}`;
	const biasFilePath = path.join("biases", `masterBias_${gainAndOffset}.xisf`);
	// const darkFilePath = path.join("darks", `masterDark_${gainAndOffset}_${exposureTimeString}_${temperatureString}.xisf`);
	// const darkFlatFilePath = path.join("darkFlats", `masterDarkFlat_${gainAndOffset}_${darkFlatExposureTime}s.xisf`);

	const darkFilePaths: string[] = [];
	const darkFlatFilePaths: string[] = [];

	metadata.forEach(m => {
		const exposureTimeString = `${m.exposureTime}s`;
		const temperatureString = `${m.temperature}C`;
		const darkFlatExposureTime = (filters as any)[m.filter].darkFlatDuration;
		const darkFilePath = path.join("darks", `masterDark_${gainAndOffset}_${exposureTimeString}_${temperatureString}.xisf`);
		const darkFlatFilePath = path.join("darkFlats", `masterDarkFlat_${gainAndOffset}_${darkFlatExposureTime}s.xisf`);

		darkFilePaths.push(darkFilePath);
		!darkFlatFilePaths.includes(darkFlatFilePath) && darkFlatFilePaths.push(darkFlatFilePath);
	});

	const directoriesToRename = [
		{ original: "Bias", new: "biases", libraryFilePaths: [biasFilePath] },
		{ original: "Light", new: "lights", dssName: "light", applyFilter: true, applyCamera: true },
		{ original: "Dark", new: "darks", dssName: "dark", libraryFilePaths: darkFilePaths },
		{ original: "Flat", new: "flats", dssName: "flat", applyFilter: true },
		{ original: "DarkFlat", new: "darkFlats", libraryFilePaths: darkFlatFilePaths },
	];

	console.log(biasFilePath);
	console.log(darkFilePaths);
	console.log(darkFlatFilePaths);
	console.log(metadata);

	for (const directoryData of directoriesToRename) {
		if (directoryData.original && fs.existsSync(directoryData.original)) {
			fsOps.renameSync(directoryData.original, directoryData.new);
		}

		if (directoryData.original && !fs.existsSync(directoryData.new)) {
			if (directoryData.libraryFilePaths) {
				tryLinkLibraryCalibration(basePath, directoryData, fsOps);
			} else {
				tryLinkSharedCalibration(currentDirectoryName, directoryData, fsOps);
			}
		}

		if (fs.existsSync(directoryData.new)) {
			const files = fs.readdirSync(directoryData.new);
			// let directory = `.\\${directoryData.new}`;
			// console.log(directory);
			for (let fileName of files) {
				let newFileName = fileName;
				const extension = newFileName.split(".").pop();

				if (!sessionAlreadyUpdatedFileFormat.test(fileName) && dateFormat.test(currentDirectoryName)) {
					newFileName = newFileName.replace(`.${extension}`, `_SESSION_${currentDirectoryName}.${extension}`);
				}

				if (!cameraAlreadyUpdateFileFormat.test(fileName) && camera && directoryData.applyCamera) {
					newFileName = newFileName.replace(`.${extension}`, `_CAM_${camera}.${extension}`);
				}

				// if(directoryData.applyFilter && filter && !filterAlreadyUpdatedFileFormat.test(fileName)) {
				// 	newFileName = newFileName.replace(`.${extension}`, `_FILTER_${filter}.${extension}`);
				// 	console.log(newFileName);
				// }

				newFileName = newFileName.replace(/'/g, "");

				if (newFileName !== fileName) {
					const directoryOfFile = path.join(currentWorkingDirectory, directoryData.new);
					fsOps.renameSync(path.join(directoryOfFile, fileName), path.join(directoryOfFile, newFileName));
					fileName = newFileName;
					console.log(newFileName);
				}
			}
		} else {
			console.log("No folder found for", directoryData.new);
		}
	}
};

doTheAsyncThings();