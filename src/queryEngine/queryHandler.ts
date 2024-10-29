import { InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError } from "../controller/IInsightFacade";
import * as fs from "fs";

const MAX_RESULT = 5000;
let datasetName = "";
let datasetKind = "";
let mfield: string[] = [];
let sfield: string[] = [];

interface OPTIONS {
	COLUMNS: string[];
	ORDER?: string | { dir: string; keys: string[] };
}

interface FILTER {
	LT?: Record<string, number>;
	GT?: Record<string, number>;
	EQ?: Record<string, number>;
	IS?: Record<string, string>;
	AND?: FILTER[];
	OR?: FILTER[];
	NOT?: FILTER;
}

interface TRANSFORMATION {
	// TODO
}

interface Content {
	WHERE: FILTER;
	OPTIONS: OPTIONS;
	TRANSFORMATION: TRANSFORMATION;
}

export function queryValidator(query: any, existingDataset: Map<string, InsightDatasetKind>): void {
	const queryContent = query as Content;
	const validKeys = ["WHERE", "OPTIONS"];
	const queryKeys = Object.keys(queryContent);

	// Check if query only include WHERE and OPTIONS
	// TODO Transformation should be optional
	if (queryKeys.length !== validKeys.length || !validKeys.every((key) => queryKeys.includes(key))) {
		throw new InsightError("Query must include only WHERE, OPTIONS and TRANSFORMATIONS");
	}
	// moved getDataset here because datasetKind is needed to determine the valid mfield and sfield
	// it could be written in a better way tho
	getDataset(query, existingDataset);
	optionsValidator(queryContent.OPTIONS);
	// Special case when WHERE has no filter is valid
	if (Object.keys(queryContent.WHERE).length !== 0) {
		filterValidator(queryContent.WHERE);
	}
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
	// const mfield = ["avg", "pass", "fail", "audit", "year"];
	// const sfield = ["dept", "id", "instructor", "title", "uuid"];
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

function optionsValidator(options: OPTIONS): void {
	// const mfield = ["avg", "pass", "fail", "audit", "year"];
	// const sfield = ["dept", "id", "instructor", "title", "uuid"];
	const optionKeys = ["COLUMNS", "ORDER"];

	// Check if query has COLUMNS and does not include any invalid key
	if (!Object.hasOwn(options, "COLUMNS") || !Object.keys(options as Object).every((key) => optionKeys.includes(key))) {
		throw new InsightError("OPTIONS must include only COLUMNS and ORDER");
	}
	// check that each field specified in the desired columns is valid
	for (const column of options.COLUMNS) {
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

// check if the query is only referencing 1 dataset
function datasetValidator(dataToCheck: string): void {
	dataToCheck = dataToCheck.split("_")[0]; // chatgpt generated to extract the string before underscore
	if (dataToCheck !== datasetName) {
		throw new InsightError("Cannot reference more than 1 dataset");
	}
}

function queryMapper(param: string, content: any, resultSoFar: InsightResult[]): any {
	let result: any[] = resultSoFar;
	switch (param) {
		case "GT":
		case "LT":
		case "EQ":
			return applyComparator(param, content, resultSoFar);
		case "IS":
			return applyIs(content.IS, resultSoFar);
		case "AND":
			// loop over each comparison inside the AND clause
			content.AND.forEach((clause: any) => {
				const tempSet = new Set(queryMapper(Object.keys(clause)[0], clause, resultSoFar)); // Use a set for O(1) lookup
				result = result.filter((section) => tempSet.has(section)); // O(n) filter with O(1) set lookup
			});
			return result;
		case "OR": {
			const resultOr = new Set<any>(); // use a set because it does not allow duplicate
			content.OR.forEach((clause: any) => {
				const tempResult = queryMapper(Object.keys(clause)[0], clause, resultSoFar);
				tempResult.forEach((section: any) => resultOr.add(section));
			});
			return Array.from(resultOr); // convert set to array
		}
		case "NOT": {
			const comparator = Object.keys(content.NOT)[0];
			const tempSet = new Set(queryMapper(comparator, content.NOT, resultSoFar));
			result = result.filter((section) => !tempSet.has(section)); // negation - only keep those section from result that do NOT appear in tempResult
			return result;
		}
	}
}

// get all rows from a dataset and filter using comparator if necessary
export function handleWhere(content: any): InsightResult[] {
	const rawData = fs.readFileSync(`data/${datasetName}.json`, "utf-8");
	let resultSoFar = JSON.parse(rawData);
	content as Content;
	for (const param in content.WHERE) {
		resultSoFar = queryMapper(param, content.WHERE, resultSoFar);
	}
	if (resultSoFar.length > MAX_RESULT) {
		throw new ResultTooLargeError();
	}
	return resultSoFar;
}

function applyComparator(comparator: string, content: Record<string, number>, result: InsightResult[]): any {
	const key = Object.keys(content[comparator])[0];
	const keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string after underscore
	datasetValidator(key);
	const value = Object.values(content[comparator])[0];
	switch (comparator) {
		case "GT":
			return result.filter((section: any) => section[keyToCompare] > value);
		case "LT":
			return result.filter((section: any) => section[keyToCompare] < value);
		case "EQ":
			return result.filter((section: any) => section[keyToCompare] === value);
	}
}

function applyIs(content: Record<string, string>, result: InsightResult[]): InsightResult[] {
	const key = Object.keys(content)[0];
	const keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string after underscore
	datasetValidator(key);
	const inputString = content[key];

	// chatgpt generated regex pattern (convert the pattern into a regex for wildcard matching)
	const regexPattern = "^" + inputString.replace(/\*/g, ".*") + "$";
	const regex = new RegExp(regexPattern);

	// filter the result that matches the wildcard
	return result.filter((section: any) => {
		return regex.test(section[keyToCompare]); // return true if regex matches string else return false
	});
}

export function handleOptions(content: any, resultSoFar: InsightResult[]): InsightResult[] {
	const contentObject = content as Content;
	let result = selectColumns(contentObject.OPTIONS.COLUMNS, resultSoFar);
	if (contentObject.OPTIONS?.ORDER) {
		result = applyOrder(contentObject.OPTIONS.ORDER, result);
	}
	return result;
}

function selectColumns(columns: string[], resultSoFar: InsightResult[]): InsightResult[] {
	// Map through the resultSoFar to create a new array with only the selected columns.
	return resultSoFar.map((item: any) => {
		const selectedResult: Record<string, any> = {};
		// loop through the column array
		columns.forEach((column) => {
			datasetValidator(column);
			const key = column.split("_").slice(1).join("_"); // chatgpt generated to extract the string behind underscore
			selectedResult[column] = item[key]; // column comes with datasetName but key does not
		});
		return selectedResult;
	});
}

// reference https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
function applyOrder(order: string | { dir: string; keys: string[] }, result: InsightResult[]): InsightResult[] {
	const isDown = typeof order === "object" && order.dir === "DOWN";
	// if order is just a string, covert it to an array so that we could handle it in the same way as we would with the obj
	const keys = typeof order === "string" ? [order] : order.keys;

	return result.sort((a: any, b: any) => {
		for (const key of keys) {
			if (a[key] < b[key]) {
				return isDown ? 1 : -1;
			}
			if (a[key] > b[key]) {
				return isDown ? -1 : 1;
			}
		}
		return 0;
	});
}
