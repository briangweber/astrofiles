#!/usr/bin/env node

import fs from "fs";
import path from "path";

const [,,...args] = process.argv;

const fileHeader = `SubframeSelector module version 1.8.5
Subframe Scale,2.36000
Camera Gain,1.00000
Camera Resolution,"16-bit [0,65535]"
Site Local Midnight,4
Scale Unit,"Arcseconds (arcsec)"
Data Unit,"Electrons (e-)"
Trimming Factor,0.10
Structure Layers,5
Noise Layers,0
Hot Pixel Filter Radius,1
Noise Reduction Filter Radius,0
Sensitivity,0.50000
Peak Response,0.500
Maximum Star Distortion,0.600
Upper Limit,1.000
Pedestal,0
Subframe Region,0,0,0,0
PSF Type,"Moffat beta = 4"
Circular PSF,false
Approval expression,"Stars > 850"
Weighting expression,""
Index,Approved,Locked,File,Weight,PSF Signal Weight,PSF SNR,PSF Scale,PSF Scale SNR,PSF Count,M*,N*,SNR,FWHM,Eccentricity,Altitude,Azimuth,Median,Median Mean Deviation,Noise,Noise Ratio,Stars,Star Residual,PSF Total Flux,PSF Total Power Flux,PSF Total Mean Flux,PSF Total Mean Power Flux,FWHM Mean Deviation,Eccentricity Mean Deviation,Star Residual Mean Deviation
`;

fs.existsSync("./rejected") && fs.rmSync("./rejected", { recursive: true });
fs.existsSync("./2022-09-03") && fs.rmSync("./2022-09-03", { recursive: true });
fs.existsSync("./testsubframeoutput.csv") && fs.rmSync("./testsubframeoutput.csv");

// If clean is passed, don't recreate the files
if(!args.find(a => a === "--clean")) {
	fs.mkdirSync("./2022-09-03/lights", { recursive: true});

	const files = [];
	for(let i = 0; i < 5; i++) {
		const fileName = path.join("./2022-09-03/lights", `${i}.fits`);
		fs.appendFileSync(fileName, "Yo");
		files.push(fileName);
	}

	const fileContents = `${fileHeader}${files.map((f, index) => `${index},${Boolean(index % 2)},false,"${path.resolve(f)}",0.000000e+00,3.125978e-02,9.322684e-03,0.000000e+00,0.000000e+00,833,7.2604e-04,1.0609e-03,2.6962e-01,6.7018e+00,6.6023e-01,6.0628e+01,1.9513e+01,1.779999e+03,3.223291e+02,3.3653e+02,9.3716e-01,829,4.9938e-03,3.052213e+03,5.557876e+04,6.452502e+01,6.526155e+00,1.7971e+00,1.1457e-01,1.5725e-04`).join("\n")}`;
	fs.appendFileSync("./testsubframeoutput.csv", fileContents);

	console.log(fileContents);
}