const fs = require("fs");
const path = require("path");
const config = require("./config");

module.exports.tryLinkSharedCalibration = (currentDirectoryName, directoryData) => {
  console.log(config.sharedCalibrationRoot, currentDirectoryName, directoryData)
  const sharedCalibrationDirectory = path.join(config.sharedCalibrationRoot, currentDirectoryName, directoryData.original);
  if(!fs.existsSync(sharedCalibrationDirectory)) return;

  fs.symlinkSync(sharedCalibrationDirectory, directoryData.new);
};

module.exports.tryLinkLibraryCalibration = (calibrationBasePath, directoryData) => {
  const fullPath = path.join(calibrationBasePath, directoryData.libraryFilePath);
  if(!fs.existsSync(fullPath)) {
    console.log("No matching calibration file found: ", fullPath);
    return;
  }

  fs.mkdirSync(directoryData.new);
  fs.symlinkSync(fullPath, directoryData.libraryFilePath);
};