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

type FlatsConfig = {
	[camera: string]: {
		filter: string;
		flatDate: string;
		startDate: string;
		endDate?: string
	}[]
};

const FLAT_CONFIG_FILENAME = "flats.json";

export const tryLinkSharedCalibration = (currentDirectoryName: string, directoryData: DirectoryData, fsOps: FsOps, camera: string, filters: string[]) => {
	const configFilePath = path.join(config.sharedCalibrationRoot, FLAT_CONFIG_FILENAME);
	if (directoryData.new === "flats" && camera && fs.existsSync(configFilePath)) {
		const flatsConfig: FlatsConfig = JSON.parse(fs.readFileSync(configFilePath, { encoding: "utf8" }));

		if (flatsConfig?.[camera]) {
			// Sort descending since we will be searching for the latest startDate that is less than the session date
			const sortedConfigs = _.sortBy(flatsConfig?.[camera], x => x.startDate, "desc");
			// Key = filter name, value = time spans with corresponding flat date to use
			const groupedConfig = _.groupBy(sortedConfigs, x => x.filter);
			// console.log(groupedConfig);

			filters.forEach(filter => {
				// console.log("filters:", filter);
				// console.log("current directory name", currentDirectoryName);
				// console.log("filter records:", groupedConfig[filter]);
				const matchingConfig = groupedConfig[filter]?.find(x => x.startDate <= currentDirectoryName && (x.endDate == null || x.endDate >= currentDirectoryName));
				if (!matchingConfig) {
					console.log("No matching date span found for", filter);
					return;
				}
				// console.log("matching config", matchingConfig);
				const flatDirectory = path.join(config.sharedCalibrationRoot, matchingConfig.flatDate, "FLAT");
				// console.log("flatDirectory", flatDirectory);
				const filterRegex = new RegExp(`.*_FILTER[_-]${filter}_.*`);
				const flatDirectoryFiles = fs.readdirSync(flatDirectory).filter(x => filterRegex.test(x));
				// console.log(flatDirectoryFiles);
				const masterFlatFile = flatDirectoryFiles.find(x => x.startsWith("masterFlat"));
				// console.log("masterFlatFile", masterFlatFile);

				const symLinkFiles = (...sourceFiles: string[]) => {
					!fs.existsSync(directoryData.new) && fsOps.mkdirSync(directoryData.new);
					sourceFiles.forEach(sourceFile => {
						// Master files use "-" instead of "_" as a separator
						const updatedFileName = sourceFile
							.replace(`SESSION_${matchingConfig.flatDate}`, `SESSION_${currentDirectoryName}`)
							.replace(`SESSION-${matchingConfig.flatDate}`, `SESSION_${currentDirectoryName}`);
						const masterFlatFileSourcePath = path.join(flatDirectory, sourceFile);
						const masterFlatFileDestinationPath = path.join(directoryData.new, updatedFileName);
						fsOps.symlinkSync(masterFlatFileSourcePath, masterFlatFileDestinationPath);
					});
				};

				if (masterFlatFile) {
					symLinkFiles(masterFlatFile);
					return;
				}

				symLinkFiles(...flatDirectoryFiles);
			});
		}

		return;
	}

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