export function parseNumber(value: string | undefined, roundToInteger: boolean): number | undefined {
	if(value === undefined) {
		return value;
	}

	return roundToInteger ? Math.round(Number(value)) : Number(value);
}