// Create a copy of this file named config.js and update with your configuration - it will be ignored by git.

module.exports = {
	biasRoot: "D:/astrophotography/biases",
	sharedCalibrationRoot: "D:/astrophotography/_shared",
	defaultCamera: "168C",
	cameras: {
		"168C": {
			defaultGain: 10,
			defaultOffset: 50,
			defaultTemperature: -15,
			filters: {
				NBZ: {
					darkFlatDuration: 3
				},
				"": { 
					darkFlatDuration: 0.25
				}
			}
		}
	}
};