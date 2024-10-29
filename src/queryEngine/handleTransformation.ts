import { InsightError } from "../controller/IInsightFacade";

export function transformationsValidator(query: any): void {
	const transformations = query.TRANSFORMATIONS;
	if (!transformations?.GROUP || !transformations?.APPLY) {
		throw new InsightError("TRANSFORMATIONS must contain both GROUP and APPLY");
	}

	if (!Array.isArray(transformations.GROUP) || transformations.GROUP.length === 0) {
		throw new InsightError("GROUP must be a non-empty array.");
	}

	transformations.GROUP.forEach((key: string) => {
		const keyValidator = new RegExp(/^(?=\S)(?=[^_]*_)[^_]*_[^_]*$/);
		if (!keyValidator.test(key)) {
			throw new InsightError(`Invalid key in GROUP: ${key}`);
		}
	});
}

// TODO
