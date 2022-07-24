# Astrofiles #


## Installation ##
In order to use these utilities, install the dependencies:
```
npm install
```

And then install globally:
```
npm install -g
```

Now that the library is installed globally, navigate to the directory for your session. There are two commands you can use:
* `astro` - used for DSLRs using ISO settings and no fixed temperatures
* `astro_ccd` - used for cooled cameras using gain and offset and FITS files. If you did not use a filter, just hit Enter when that prompt comes up.


## Usage ##
Here's the directory structure I use:

```
|-- astrophotography
|   |-- _shared
|   |   |-- 168C
|   |   |   |-- darks
|   |   |   |   |-- masterDark_g10o50_300s_-10C.xisf
|   |   |   |   |-- masterDark_g10o50_300s_-15C.xisf
|   |   |   |-- darkFlats
|   |   |   |   |-- masterDarkFlat_g10o50_3s.xisf
|   |   |   |-- biases
|   |   |   |   |-- masterBias_g10o50.xisf
|   |   |-- 2022-07-21
|   |   |   |-- Flat
|   |-- dumbbell
|   |   |-- 2022-07-21
|   |   |   |-- Light
|   |-- crescent
|   |   |-- 2022-07-21
|   |   |   |-- Light
```

In this example, there are 2 targets (dumbbell and crescent) both shot on the same night. If we didn't change the image train, we can use the same flats for both, so those go in the `_shared` folder under the same date.

The `_shared` directory also contains camera specific calibration files (168C for me) and also shared calibration files per session grouped by date. The location of the shared calibration files is configurable, but you will need to follow specific naming conventions for the camera calibration files: 
* darks: `masterDark_g<gain>o<offset>_<exposureTimeInSeconds>s_<temperature>C.xisf`
* darkFlats: `masterDarkFlat_g<gain>o<offset>_<exposureTimeInSeconds>s.xisf`
* biases: `masterBias_g<gain>o<offset>.xisf`

Navigate to each target's dated folder and run `astro_ccd`. The script will read from the first FITS file under the Light directory to gather information from the headers. You will be prompted to confirm the values and (optionally) enter a filter used for the session. The script will:
* Append _SESSION_<sessionDate> to each Light file
* Append _FILTER_<filterName> to each Light and Flat file (if specified)
* Create symlinks to your dark library, darkFlat library, and bias library (if appropriate files are found)
* Create symlinks to the shared flats if present
* Rename folders from the Ekos convention (Light) to match the Siril convention (lights)

Once the script has completed, you should be able to simply "Add directory" in PixInsight's WeightBatchPreProcessing script and the appropriate files will be added in the appropriate place.

## Configuration ##

Copy `sample_config.js` and rename it to `config.js` - this file will contain your specific configuration and will be ignored by git.

Notes:
* The first camera in the cameras list is the default. The name used here should match the calibration folder name.
* If you're using a fixed brightness light source, you can enter a dark flat duration per filter. This will automatically link in the correct dark flats if present.
* `biasRoot` is not used by `astro_ccd`