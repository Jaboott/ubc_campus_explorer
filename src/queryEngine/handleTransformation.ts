import { InsightError, InsightResult } from "../controller/IInsightFacade";

let applyKey = "";

export function transformationsValidator(query: any): string {
	const transformations = query.TRANSFORMATIONS;
	if (!transformations?.GROUP || !transformations?.APPLY) {
		throw new InsightError("TRANSFORMATIONS must contain both GROUP and APPLY");
	}

	groupValidator(transformations.GROUP);
	applyValidator(transformations.APPLY);

	return applyKey;
}

function groupValidator(group: any): void {
	if (!Array.isArray(group) || group.length === 0) {
		throw new InsightError("GROUP must be a non-empty array.");
	}

	group.forEach((key: string) => {
		const keyValidator = new RegExp(/^(?=\S)(?=[^_]*_)[^_]*_[^_]*$/);
		if (!keyValidator.test(key)) {
			throw new InsightError(`Invalid key in GROUP: ${key}`);
		}
	});
}

function applyValidator(apply: any): void {
	apply.forEach((applyRule: any) => {
		if (typeof applyRule !== "object") {
			throw new InsightError("APPLYRULE must be an object");
		}
		applyKey = Object.keys(applyRule)[0];
		const keyValidator = new RegExp(/^[^_]+$/); // cannot be empty or contain underscore
		if (!keyValidator.test(applyKey)) {
			throw new InsightError(`Invalid key in GROUP: ${applyKey}`);
		}

		const applyBody = Object.keys(applyRule[applyKey]);
		if (typeof applyBody !== "object") {
			throw new InsightError("apply body must be an object");
		}

		const applyToken = applyBody[0];
		const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		if (!validTokens.includes(applyToken)) {
			throw new InsightError(`Invalid APPLYTOKEN '${applyToken}'`);
		}

		// TODO check apply body - depends on whether it is room or section
		// TODO check if it is only referencing 1 dataset
		// TODO GROUPING & APPLY
	});
}

// reference https://medium.com/@momoesse/mastering-javascript-a-step-by-step-guide-to-grouping-array-of-objects-by-multiple-conditions-59651ceba95a
export function doGroupings(groupClause: string[], resultSoFar: InsightResult[]): any {
	// extract the key behind underscore
	const keys = (item: any): string => groupClause.map((field) => item[field.split("_")[1]]).join("_");

	const groupedData = resultSoFar.reduce((result: any, currentItem: any) => {
		const currentKey = keys(currentItem);
		result[currentKey] = result[currentKey] || [];
		result[currentKey].push(currentItem);
		return result;
	}, {});

	// console.log(groupedData);
	return groupedData;
}

// TODO
export function doCalculations(applyClause: any, resultSoFar: any): InsightResult[] {
	for (const apply of applyClause) {
		applyKey = Object.keys(apply)[0];
		const applyBody = apply[applyKey];
		const applyToken = Object.keys(applyBody)[0];
		const key = applyBody[applyToken];
		switch (applyToken) {
			case "MAX":
				console.log(key);
				break;

			case "MIN":
				break;

			case "AVG":
				break;

			case "SUM":
				break;

			case "COUNT":
				break;
		}
	}
	return resultSoFar;
}
