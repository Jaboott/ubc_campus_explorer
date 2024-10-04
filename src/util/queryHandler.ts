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

	if (!Object.hasOwn(queryContent, "WHERE") || !Object.hasOwn(queryContent, "OPTIONS")) {
		throw new InsightError("Query must include both WHERE and OPTIONS ");
	}

	// Special case when WHERE has no filter is valid
	if (Object.keys(queryContent.WHERE).length !== 0) {
		filterValidator(queryContent.WHERE);
	}
	optionsValidator(queryContent.OPTIONS);
}

//TODO need to check for idstring, check keys in WHERE, unexpected keys in QUERY, maybe more...
function filterValidator(filter: FILTER): void {
	// Guarantee that the filter is not empty
	if (Object.keys(filter).length === 0) {
		throw new InsightError("FILTER can't be left empty");
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
	} else if (filter.IS) {
		const body = filter.IS;
		checkFilter(body as Object, "string", "SCOMPARATOR");
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

// TODO haven't done it yet
function optionsValidator(options: OPTIONS): void {
	if (Object.keys(options).length === 0) {
		throw new InsightError("OPTIONS can't be left empty");
	}

	if (!Object.hasOwn(options, "COLUMNS")) {
		throw new InsightError("OPTIONS missing COLUMNS");
	}

	if (options.COLUMNS.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}

	// TODO validate ORDER
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
			break; // TODO
		case "AND":
			// loop over each comparison inside the AND clause
			content.AND.forEach((clause: any) => {
				for (const key in clause) {
					const tempResult = queryMapper(key, clause, resultSoFar);
					// check if each item is in both tempResult and result - but seems to be a bit slow(?
					result = result.filter((item) => tempResult.includes(item));
				}
			});
			return result;
		case "OR":
			break;
		case "NOT":
			break; // TODO
		default:
			return;
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

export function applyComparator(comparator: string, content: Record<string, number>, result: any): any {
	let key: string;
	let keyToCompare: string;
	let value: number;
	switch (comparator) {
		// this could probably be written in a better way
		case "GT":
			key = Object.keys(content.GT)[0];
			keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string behind underscore
			datasetValidator(key);
			value = Object.values(content.GT)[0];
			return result.filter((item: any) => item[keyToCompare] > value);
		case "LT":
			key = Object.keys(content.LT)[0];
			keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string behind underscore
			datasetValidator(key);
			value = Object.values(content.LT)[0];
			return result.filter((item: any) => item[keyToCompare] < value);
		case "EQ":
			key = Object.keys(content.EQ)[0];
			keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string behind underscore
			datasetValidator(key);
			value = Object.values(content.EQ)[0];
			return result.filter((item: any) => item[keyToCompare] === value);
	}
}

export function handleOptions(content: any, resultSoFar: any): any {
	const contentObject = content as Content;
	const result = selectColumns(contentObject?.OPTIONS?.COLUMNS, resultSoFar);
	// TODO ORDER
	// if (contentObject?.OPTIONS?.ORDER) {
	// 	result = applyOrder(contentObject?.OPTIONS?.COLUMNS, contentObject?.OPTIONS?.ORDER, result);
	// }
	return result;
}

function selectColumns(columns: string[], resultSoFar: any): any {
	if (columns?.length === 0) {
		throw new InsightError("column must be an non empty array");
	}
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

// function applyOrder(columns: string[], order: string, result: any): any {
// 	if (!columns.includes(order)) {
// 		throw new InsightError("order key must be in column");
// 	}
// 	// const keyToSortBy = order.split("_").slice(1).join("_");
// 	// console.log(keyToSortBy);
// 	return result;
// }
