#!/usr/bin/env node

import fs from "fs";
import path from "path";
import prompt from "prompt";
import config from "../config";
import { readKeywords, getNumericKeyword } from "./fits/keywordreader";
import { tryLinkSharedCalibration, tryLinkLibraryCalibration } from "./linkcommon";

const dateFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const sessionAlreadyUpdatedFileFormat = /.*SESSION_.*/;
const filterAlreadyUpdatedFileFormat = /.*FILTER_.*/;

const currentWorkingDirectory = process.cwd();
const currentDirectoryName = path.parse(currentWorkingDirectory).name;
console.log(currentDirectoryName);

const doTheAsyncThings = async () => {
	const defaultCamera = Object.keys(config.cameras)[0];

	const fitsKeywords = readKeywords(currentWorkingDirectory);
	const keywordGain = getNumericKeyword("GAIN", fitsKeywords);
	const keywordOffset = getNumericKeyword("OFFSET", fitsKeywords);
	const keywordExposureTime = getNumericKeyword("EXPTIME", fitsKeywords);
	const keywordTemperature = getNumericKeyword("CCD-TEMP", fitsKeywords, true);
	const keywordFilter = fitsKeywords.find(k => k.keywordName === "FILTER")?.keywordValue;

	let { camera, exposureTime, filter } = await prompt.get({ 
		properties: { 
			exposureTime: { default: keywordExposureTime }, 
			filter: { default: keywordFilter }, 
			camera: { description: "Camera", default: defaultCamera }
		}
	});

	const {defaultGain, defaultOffset, defaultTemperature, filters } = config.cameras[camera];
	let { gain, offset, temperature } = await prompt.get({ 
		properties: { 
			gain: { default: keywordGain || defaultGain }, 
			offset: { default: keywordOffset || defaultOffset}, 
			temperature: { default: keywordTemperature || defaultTemperature } 
		}
	});

	const darkFlatExposureTime = filters[filter].darkFlatDuration;

	const basePath = path.join(config.sharedCalibrationRoot, camera);

	const exposureTimeString = `${exposureTime}s`;
	const gainAndOffset = `g${gain}o${offset}`;
	const temperatureString = `${temperature}C`;
	const biasFilePath = path.join("biases", `masterBias_${gainAndOffset}.xisf`);
	const darkFilePath = path.join("darks", `masterDark_${gainAndOffset}_${exposureTimeString}_${temperatureString}.xisf`);
	const darkFlatFilePath = path.join("darkFlats", `masterDarkFlat_${gainAndOffset}_${darkFlatExposureTime}s.xisf`);

	const directoriesToRename = [
		{ original: "Bias", new: "biases", libraryFilePath: biasFilePath },
		{ original: "Light", new: "lights", dssName: "light", applyFilter: true },
		{ original: "Dark", new: "darks", dssName: "dark", libraryFilePath: darkFilePath },
		{ original: "Flat", new: "flats", dssName: "flat", applyFilter: true },
		{ original: "DarkFlat", new: "darkFlats", libraryFilePath: darkFlatFilePath },
	];

	console.log(biasFilePath);
	console.log(darkFilePath);
	console.log(darkFlatFilePath);

	for(const directoryData of directoriesToRename) {
		if(directoryData.original && fs.existsSync(directoryData.original)) {
			fs.renameSync(directoryData.original, directoryData.new);
		}

		if(directoryData.original && !fs.existsSync(directoryData.new)) {
			if(directoryData.libraryFilePath) {
				tryLinkLibraryCalibration(basePath, directoryData);
			} else {
				tryLinkSharedCalibration(currentDirectoryName, directoryData);
			}
		}

		if(fs.existsSync(directoryData.new)) {
			const files = fs.readdirSync(directoryData.new);
			// let directory = `.\\${directoryData.new}`;
			// console.log(directory);
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

				newFileName = newFileName.replace(/'/g, "");

				if(newFileName !== fileName) {
					const directoryOfFile = path.join(currentWorkingDirectory, directoryData.new);
					fs.renameSync(path.join(directoryOfFile, fileName), path.join(directoryOfFile, newFileName));
					fileName = newFileName;
				}
			}
		} else {
			console.log("No folder found for", directoryData.new);
		}
	}
};

doTheAsyncThings();