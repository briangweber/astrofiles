import { parse } from "csv-parse/sync";
import path from "path";

function getSourcePath(fileName: string): string {
	const matches = /(.*)\/.*\/.*\/.*\/(.*_SESSION_([0-9]{4}-[0-9]{2}-[0-9]{2}).*)(_c.*_d.*).xisf/gi.exec(fileName);
	
	if(!matches) {
		throw new Error(`File does not match pattern: ${fileName}`);
	}

	const [, basePath, fileNameNoExt, date, processingMarkers] = matches;
	console.log(matches);

	const sourcePath = processingMarkers ? path.join(basePath, date, "lights", `${fileNameNoExt}.fits`) : fileName;

	return sourcePath;
}

export function generateSubframeMoves(csvContents: string): { sourcePath: string, fileName: string }[] {
	// console.log(csvContents);
  
	// There is a bunch of metadata at the beginning - trim it out so we get an object for each row
	const startOfData = csvContents.indexOf("Index,");
	if(startOfData < 0) {
		throw new Error("Invalid file contents passed, no data detected");
	}

	const trimmedContents = csvContents.slice(startOfData);
	const rows: { Index: string, Approved: string, File: string }[] = parse(trimmedContents, { columns: true, skip_empty_lines: true });

	// console.log(rows);

	// Return the list of files that are not approved
	const output = rows.filter(r => !/true/i.test(r.Approved)).map(r => {
		const sourcePath = getSourcePath(r.File);
		return { sourcePath, fileName: path.basename(sourcePath) };
	});

	return output;
} 