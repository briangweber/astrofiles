import fs from "fs";
import path from "path";
import config from "../config";

export const tryLinkSharedCalibration = (currentDirectoryName, directoryData) => {
	console.log(config.sharedCalibrationRoot, currentDirectoryName, directoryData);
	const sharedCalibrationDirectory = path.join(config.sharedCalibrationRoot, currentDirectoryName, directoryData.original);
	if(!fs.existsSync(sharedCalibrationDirectory)) return;

	fs.symlinkSync(sharedCalibrationDirectory, directoryData.new);
};

export const  tryLinkLibraryCalibration = (calibrationBasePath, directoryData) => {
	const fullPath = path.join(calibrationBasePath, directoryData.libraryFilePath);
	if(!fs.existsSync(fullPath)) {
		console.log("No matching calibration file found: ", fullPath);
		return;
	}

	fs.mkdirSync(directoryData.new);
	fs.symlinkSync(fullPath, directoryData.libraryFilePath);
};