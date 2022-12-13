import fs from "fs";
import path from "path";

export function parseNumber(value: string | undefined, roundToInteger: boolean): number | undefined {
	if(value === undefined) {
		return value;
	}

	return roundToInteger ? Math.round(Number(value)) : Number(value);
}

export function getSubdirectories(path: string): string[] {
	const subdirectories = fs.readdirSync(path, { withFileTypes: true }).filter(e => e.isDirectory());
	return subdirectories.map(s => s.name);
} 

export function getLightFiles(startingPath: string): { lightDirectory?: string, lightFiles: string[] } {
  const lightDirectory = getSubdirectories(startingPath).find(s => /light[s]{0,1}/i.test(s));
			if(!lightDirectory) {
				return { lightFiles: [] };
			}
			const lightFiles = fs.readdirSync(path.join(startingPath, lightDirectory), { withFileTypes: true })
				.filter(f => f.isFile()); 
			return { lightDirectory, lightFiles: lightFiles.map(f => f.name) };
}