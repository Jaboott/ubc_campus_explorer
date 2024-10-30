import { InsightError } from "../controller/IInsightFacade";

export function transformationsValidator(query: any): void {
	const transformations = query.TRANSFORMATIONS;
	if (!transformations?.GROUP || !transformations?.APPLY) {
		throw new InsightError("TRANSFORMATIONS must contain both GROUP and APPLY");
	}

	groupValidator(transformations.GROUP);
	applyValidator(transformations.APPLY);
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
	if (!Array.isArray(apply) || apply.length === 0) {
		throw new InsightError("APPLY must be a non-empty array.");
	}

	apply.forEach((applyRule: any) => {
		if (typeof applyRule !== "object") {
			throw new InsightError("APPLYRULE must be an object");
		}
		const applyKey = Object.keys(applyRule)[0];
		const keyValidator = new RegExp(/^[^_]+$/); // cannot be empty or contain underscore
		if (!keyValidator.test(Object.keys(applyKey)[0])) {
			throw new InsightError(`Invalid key in GROUP: ${applyKey}`);
		}

		const applyToken = Object.keys(applyRule[applyKey])[0];
		const validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		if (!validTokens.includes(applyToken)) {
			throw new InsightError(`Invalid APPLYTOKEN '${applyToken}'`);
		}

		// TODO applyKey depends on whether it is room or section
		// TODO check if it is only referencing 1 dataset
	});
}
