// const fits = require("./fits")();

import { readKeywords } from "./fits/keywordreader";

// const fitsHeaders = fits.LoadFITSKeywords("D:/astrophotography/wizard/2022-07-19/lights/NGC_7380_Light_300_secs_004_SESSION_2022-07-19_FILTER_NBZ.fits")
// console.log(fitsHeaders)

const keywords = readKeywords("D:/astrophotography/lagoon+trifid/2022-07-20");

console.log(keywords);

const gain = Number(keywords.find(k => k.keywordName === "GAIN").keywordValue);
console.log(gain);

const offset = Number(keywords.find(k => k.keywordName === "OFFSET").keywordValue);
console.log(offset);

const temperature = Number(keywords.find(k => k.keywordName === "CCD-TEMP").keywordValue);
console.log(Math.round(temperature));

const exposureTime = Number(keywords.find(k => k.keywordName === "EXPTIME").keywordValue);
console.log(exposureTime);