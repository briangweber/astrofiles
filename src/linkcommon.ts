import fs from "fs";
import path from "path";
import config from "../config";
import _ from "lodash";
import { FsOps } from "./fsops";

type DirectoryData = {
	original: string;
	new: string;
	dssName?: string;
	applyFilter?: boolean;
	libraryFilePaths?: string[];
}

export const tryLinkSharedCalibration = (currentDirectoryName: string, directoryData: DirectoryData, fsOps: FsOps) => {
	// console.log(config.sharedCalibrationRoot, currentDirectoryName, directoryData);
	const sharedCalibrationDirectory = path.join(config.sharedCalibrationRoot, currentDirectoryName, directoryData.original);
	if (!fs.existsSync(sharedCalibrationDirectory)) return;

	fsOps.symlinkSync(sharedCalibrationDirectory, directoryData.new);
};

export const tryLinkLibraryCalibration = (calibrationBasePath: string, directoryData: DirectoryData, fsOps: FsOps) => {
	const paths = _.uniq(directoryData.libraryFilePaths)?.map(p => {
		const calibrationPath = path.join(calibrationBasePath, p);
		return { calibrationPath: calibrationPath, destination: p, valid: fs.existsSync(calibrationPath) };
	}) || [];

	if (!paths.filter(p => p.valid).length) {
		console.log("No matching calibration files found. Checked: ", paths.map(p => p.calibrationPath).join(", "));
		return;
	}

	fsOps.mkdirSync(directoryData.new);

	paths.forEach(p => fsOps.symlinkSync(p.calibrationPath, p.destination));
};