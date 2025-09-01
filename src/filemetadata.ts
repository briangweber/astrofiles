import _ from "lodash";
import path from "path";
import { getNumericKeyword, readKeywordsFromFile } from "./fits/keywordreader";
import { parseNumber } from "./helpers";

export type FileMetadata = {
	camera?: string;
	exposureTime?: number;
	temperature?: number;
	filter?: string;
	date?: string;
	gain?: number;
	offset?: number;
}

export function getMetadataFromFile(filePath: string): FileMetadata {
	const fileName = path.basename(filePath);
	// console.log(fileName);

	// get FITS keywords
	const keywords = readKeywordsFromFile(filePath);

	const keywordMetadata = {
		exposureTime: getNumericKeyword("EXPTIME", keywords, true),
		filter: keywords.find(k => k.keywordName === "FILTER")?.keywordValue,
		temperature: getNumericKeyword("SET-TEMP", keywords, true) || getNumericKeyword("CCD-TEMP", keywords, true),
		gain: getNumericKeyword("GAIN", keywords, true),
		offset: getNumericKeyword("OFFSET", keywords, true),
	};

	const fileMetadata = {
		exposureTime: getExposureTimeKeyword(fileName),
		temperature: getNumericFileKeyword(fileName, "TEMP"),
		filter: getFileKeyword(fileName, "FILTER"),
		date: getFileKeyword(fileName, "SESSION"),
		camera: getFileKeyword(fileName, "CAM"),
	};

	const resolved = _.defaults(fileMetadata, keywordMetadata);
	return resolved as FileMetadata;
}

function getFileKeyword(fileName: string, keywordToFind: string): string | undefined {
	const value = new RegExp(`.*${keywordToFind}_(.*?)(?:_|.[a-zA-Z0-9]*$).*`).exec(fileName)?.[1];
	return value;
}

function getExposureTimeKeyword(fileName: string): number | undefined {
	const value = /.*_([0-9.]+)(?:s|_secs| s)_.*/g.exec(fileName)?.[1];
	return parseNumber(value, true);
}

function getNumericFileKeyword(fileName: string, keywordToFind: string): number | undefined {
	const value = getFileKeyword(fileName, keywordToFind);
	return parseNumber(value, true);
}