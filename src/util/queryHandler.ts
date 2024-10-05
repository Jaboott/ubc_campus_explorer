import { InsightError, ResultTooLargeError } from "../controller/IInsightFacade";
import * as fs from "fs";

const MAX_RESULT = 5000;
let datasetName = "";

interface OPTIONS {
	COLUMNS: string[];
	ORDER?: string;
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

interface Content {
	WHERE: FILTER;
	OPTIONS: OPTIONS;
}

export function queryValidator(query: any): void {
	const queryContent = query as Content;
	const validKeys = ["WHERE", "OPTIONS"];
	const queryKeys = Object.keys(queryContent);

	// Check if query only include WHERE and OPTIONS
	if (queryKeys.length !== validKeys.length || !validKeys.every((key) => queryKeys.includes(key))) {
		throw new InsightError("Query must include only WHERE and OPTIONS");
	}

	// Special case when WHERE has no filter is valid
	if (Object.keys(queryContent.WHERE).length !== 0) {
		filterValidator(queryContent.WHERE);
	}
	optionsValidator(queryContent.OPTIONS);
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
	const mfield = ["avg", "pass", "fail", "audit", "year"];
	const sfield = ["dept", "id", "instructor", "title", "uuid"];
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
	const mfield = ["avg", "pass", "fail", "audit", "year"];
	const sfield = ["dept", "id", "instructor", "title", "uuid"];
	const optionKeys = ["COLUMNS", "ORDER"];
	// check that OPTIONS is non-empty
	if (Object.keys(options).length === 0) {
		throw new InsightError("OPTIONS can't be left empty");
	}

	// Check if query has COLUMNS and does not include any invalid key
	if (!Object.hasOwn(options, "COLUMNS") || !Object.keys(options as Object).every((key) => optionKeys.includes(key))) {
		throw new InsightError("OPTIONS must include only COLUMNS and ORDER");
	}

	// check that COLUMNS is non-empty
	if (options.COLUMNS.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
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
	if (options.ORDER && !options.COLUMNS.includes(options.ORDER)) {
		throw new InsightError("ORDER key must be in OPTIONS and not in COLUMNS");
	}
}

function getDataset(content: Content): void {
	const regex = new RegExp(/^([^_]+)/); // chatgpt generated regex expression
	const match = content.OPTIONS.COLUMNS[0].match(regex); // get the dataset used in columns
	if (!datasetName) {
		datasetName = match ? match[1] : ""; // set the global variable
	}
}

// check if the query is only referencing 1 dataset
function datasetValidator(dataToCheck: string): void {
	dataToCheck = dataToCheck.split("_")[0]; // chatgpt generated to extract the string before underscore
	if (dataToCheck !== datasetName) {
		throw new InsightError("Cannot reference more than 1 dataset");
	}
}

function queryMapper(param: string, content: any, resultSoFar: any): any {
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
				for (const key in clause) {
					const tempResult = queryMapper(key, clause, resultSoFar);
					// check if each section is in both tempResult and result - but seems to be a bit slow(?
					result = result.filter((section) => tempResult.includes(section));
				}
			});
			return result;
		case "OR": {
			const resultOr = new Set<any>(); // use a set because it does not allow duplicate
			content.OR.forEach((clause: any) => {
				for (const key in clause) {
					const tempResult = queryMapper(key, clause, resultSoFar);
					tempResult.forEach((section: any) => resultOr.add(section));
				}
			});
			return Array.from(resultOr); // convert set to array
		}
		case "NOT": {
			const comparator = Object.keys(content.NOT)[0];
			const tempResult = queryMapper(comparator, content.NOT, resultSoFar);
			// negation - only keep those section from result that do NOT appear in tempResult.
			result = result.filter((section) => !tempResult.includes(section));
			return result;
		}
	}
}

// get all rows from a dataset and filter using comparator if necessary
export function handleWhere(content: any): any {
	getDataset(content);
	const rawData = fs.readFileSync(`data/${datasetName}.json`, "utf-8");
	let resultSoFar = JSON.parse(rawData);
	content as Content;
	for (const param in content.WHERE) {
		resultSoFar = queryMapper(param, content.WHERE, resultSoFar);
	}
	if (resultSoFar?.length > MAX_RESULT) {
		throw new ResultTooLargeError();
	}
	return resultSoFar;
}

function applyComparator(comparator: string, content: Record<string, number>, result: any): any {
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

function applyIs(content: Record<string, string>, result: any): any {
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

export function handleOptions(content: any, resultSoFar: any): any {
	const contentObject = content as Content;
	let result = selectColumns(contentObject?.OPTIONS?.COLUMNS, resultSoFar);
	if (contentObject?.OPTIONS?.ORDER) {
		result = applyOrder(contentObject.OPTIONS.ORDER, result);
	}
	return result;
}

function selectColumns(columns: string[], resultSoFar: any): any {
	// Map through the resultSoFar to create a new array with only the selected columns.
	return resultSoFar?.map((item: any) => {
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

// source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
function applyOrder(order: string, result: any): any {
	return result.sort((a: any, b: any) => {
		if (a[order] < b[order]) {
			return -1;
		}
		if (a[order] > b[order]) {
			return 1;
		}
		return 0;
	});
}
