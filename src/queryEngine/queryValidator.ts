import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { Content, FILTER, OPTIONS } from "./queryObjectInterface";

let datasetName = "";
let datasetKind = "";
let mfield: string[] = [];
let sfield: string[] = [];
let applyKey = "";

export function queryValidator(query: any, existingDataset: Map<string, InsightDatasetKind>): string[] {
	const queryContent = query as Content;
	const validKeys = ["WHERE", "OPTIONS"];
	const queryKeys = Object.keys(queryContent);

	if (!queryKeys.includes("WHERE") || !queryKeys.includes("OPTIONS")) {
		throw new InsightError("Query must include WHERE and OPTIONS");
	}

	// making sure query only contains WHERE and OPTIONS if TRANSFORMATION doesn't exist
	if (
		!queryKeys.includes("TRANSFORMATIONS") &&
		(queryKeys.length !== validKeys.length || !validKeys.every((key) => queryKeys.includes(key)))
	) {
		throw new InsightError("Query must include only WHERE, OPTIONS");
	}

	if (queryKeys.includes("TRANSFORMATIONS")) {
		applyKey = transformationsValidator(query);
		getDataset(query, existingDataset); // placeholder here - TODO check if the query is only referencing 1 dataset
		optionsValidator(queryContent.OPTIONS, applyKey);
	} else {
		// moved getDataset here because datasetKind is needed to determine the valid mfield and sfield
		// it could be written in a better way tho
		getDataset(query, existingDataset);
		optionsValidator(queryContent.OPTIONS);
		// Special case when WHERE has no filter is valid
		if (Object.keys(queryContent.WHERE).length !== 0) {
			filterValidator(queryContent.WHERE);
		}
	}
	return [datasetName, applyKey];
}

function filterValidator(filter: FILTER): void {
	// Filter can only have 1 key
	if (Object.keys(filter).length !== 1) {
		throw new InsightError("FILTER must have 1 key");
	}
	const validKeys = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];

	// Check if the key is valid
	Object.keys(filter).forEach((key) => {
		if (!validKeys.includes(key)) {
			throw new InsightError("FILTER contains unknown key: " + key);
		}
	});

	// LT, GT, and EQ can only have 1 key
	if (filter.LT || filter.GT || filter.EQ) {
		const body = filter.LT || filter.GT || filter.EQ;
		checkFilter(body as Object, "number", "MCOMPARATOR");
		checkKey(Object.keys(body as Object)[0], "mkey");
	} else if (filter.IS) {
		const body = filter.IS;
		checkFilter(body as Object, "string", "SCOMPARATOR");
		const inputString = new RegExp(/^(\*[^*]*|\*?[^*]*\*?)$/); // chatgpt generated to check for middle asterisk
		if (!inputString.test(body[Object.keys(body)[0]])) {
			throw new InsightError("Asterisk must only be in first or last characters of input string");
		}
		checkKey(Object.keys(body as Object)[0], "skey");
	} else if (filter.NOT) {
		filterValidator(filter.NOT);
	} else if (filter.AND || filter.OR) {
		const body = filter.AND || filter.OR;
		if (!body || !Array.isArray(body)) {
			throw new InsightError("AND/OR needs to have an array as body");
		}
		if (body.length === 0) {
			throw new InsightError("AND/OR can't have empty array");
		}
		body.forEach((sFilter) => filterValidator(sFilter));
	}
}

function checkKey(key: string, type: string): void {
	// chatgpt generated to check for string with only 1 _ and not empty or white space only
	const keyValidator = new RegExp(/^(?=\S)(?=[^_]*_)[^_]*_[^_]*$/);

	if (!keyValidator.test(key)) {
		throw new InsightError("Invalid key");
	}

	const id = key.split("_")[0];
	const field = key.split("_")[1];

	// If id or field is empty
	if (!id || !field) {
		throw new InsightError(`Invalid key ${key}`);
	}

	switch (type) {
		case "mkey":
			if (!mfield.includes(field)) {
				throw new InsightError("Invalid mkey");
			}
			break;
		case "skey":
			if (!sfield.includes(field)) {
				throw new InsightError("Invalid skey");
			}
			break;
	}
}

function checkFilter(bodyObject: Object, type: string, filterType: string): void {
	if (Object.keys(bodyObject).length !== 1) {
		throw new InsightError(filterType + " should only include 1 key");
	}
	const key = Object.keys(bodyObject)[0];
	const bodyRecord = bodyObject as Record<string, any>;
	if (typeof bodyRecord[key] !== type) {
		throw new InsightError(filterType + " value should be a " + type);
	}
}

function optionsValidator(options: OPTIONS, groupKey = ""): void {
	const optionKeys = ["COLUMNS", "ORDER"];

	// Check if query has COLUMNS and does not include any invalid key
	if (!Object.hasOwn(options, "COLUMNS") || !Object.keys(options as Object).every((key) => optionKeys.includes(key))) {
		throw new InsightError("OPTIONS must include only COLUMNS and ORDER");
	}
	// check that each field specified in the desired columns is valid
	for (const column of options.COLUMNS) {
		if (groupKey && column === groupKey) {
			continue;
		}
		const id = column.split("_")[0];
		const field = column.split("_")[1]; // gets part of column name after "_" (the field)
		const keyValidator = new RegExp(/^(?=\S)(?=[^_]*_)[^_]*_[^_]*$/);

		// Guarantee that key only has 1 _
		if (!keyValidator.test(column) || !id || !field) {
			throw new InsightError(`Invalid key: ${column}`);
		}
		// id score should be implicitly checked by validating the key
		if (!mfield.includes(field) && !sfield.includes(field)) {
			throw new InsightError(`Invalid field: ${field} detected in columns`);
		}
	}

	// Checking if a field in ORDER is not in COLUMNS
	if (options.ORDER) {
		if (typeof options.ORDER === "string" && !options.COLUMNS.includes(options.ORDER)) {
			throw new InsightError("ORDER key must be in OPTIONS and also in COLUMNS");
		} else if (typeof options.ORDER === "object") {
			validateDir(options.ORDER, options.COLUMNS);
		}
	}
}

function validateDir(order: { dir: string; keys: string[] }, column: string[]): void {
	if (!order.keys || order.keys.length === 0) {
		throw new InsightError("ORDER must have a non-empty keys array");
	}

	if (!order.dir || (order.dir !== "UP" && order.dir !== "DOWN")) {
		throw new InsightError("ORDER must have a valid dir key");
	}

	for (const key of order.keys) {
		if (!column.includes(key)) {
			throw new InsightError("All ORDER keys must be in OPTIONS and also in COLUMNS");
		}
	}
}

function getDataset(content: any, existingDataset: Map<string, InsightDatasetKind>): void {
	content as Content;
	const regex = new RegExp(/^([^_]+)/); // chatgpt generated regex expression

	// had to check column is not empty before getting the datasetName
	if (Object.keys(content.OPTIONS).length === 0) {
		throw new InsightError("OPTIONS can't be left empty");
	}
	if (!Object.keys(content.OPTIONS).includes("COLUMNS")) {
		throw new InsightError("COLUMNS must be included");
	}
	if (content.OPTIONS.COLUMNS.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}
	const match = content.OPTIONS.COLUMNS[0].match(regex); // get the dataset used in columns
	datasetName = match ? match[1] : ""; // set the global variable
	if (!existingDataset.has(datasetName)) {
		throw new InsightError("Dataset not found");
	}

	datasetKind = existingDataset.get(datasetName)!;
	if (datasetKind === InsightDatasetKind.Sections) {
		mfield = ["avg", "pass", "fail", "audit", "year"];
		sfield = ["dept", "id", "instructor", "title", "uuid"];
	} else if (datasetKind === InsightDatasetKind.Rooms) {
		mfield = ["lat", "lon", "seats"];
		sfield = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
	}
}

function transformationsValidator(query: any): string {
	const validKeys = ["GROUP", "APPLY"];
	const transformations = query.TRANSFORMATIONS;
	const transformationKeys = Object.keys(transformations);
	if (transformationKeys.length !== validKeys.length || !validKeys.every((key) => transformationKeys.includes(key))) {
		throw new InsightError("TRANSFORMATIONS must contain only GROUP and APPLY");
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
