import fs from "fs";
import path from "path";
import config from "../config";

type DirectoryData = {
	original: string;
	new: string;
	dssName?: string;
	applyFilter?: boolean;
	libraryFilePaths?: string[];
}

export const tryLinkSharedCalibration = (currentDirectoryName:string, directoryData: DirectoryData) => {
	// console.log(config.sharedCalibrationRoot, currentDirectoryName, directoryData);
	const sharedCalibrationDirectory = path.join(config.sharedCalibrationRoot, currentDirectoryName, directoryData.original);
	if(!fs.existsSync(sharedCalibrationDirectory)) return;

	fs.symlinkSync(sharedCalibrationDirectory, directoryData.new);
};

export const  tryLinkLibraryCalibration = (calibrationBasePath: string, directoryData: DirectoryData) => {
	const paths = directoryData.libraryFilePaths?.map(p => { 
		const calibrationPath = path.join(calibrationBasePath, p);
		return { calibrationPath: calibrationPath, destination: p, valid: fs.existsSync(calibrationPath) };
	}) || [];

	if(!paths.filter(p => p.valid).length) {
		console.log("No matching calibration files found. Checked: ", paths.join(", "));
		return;
	}
	
	fs.mkdirSync(directoryData.new);

	paths.forEach(p => fs.symlinkSync(p.calibrationPath, p.destination));
};