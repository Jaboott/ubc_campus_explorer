import { InsightError, ResultTooLargeError } from "../controller/IInsightFacade";
import * as fs from "fs";

const MAX_RESULT = 5000;
let datasetName = "";

interface Options {
	COLUMNS: string[];
	ORDER?: string;
}

interface WHERE {
	GT?: Record<string, number>;
	LT?: Record<string, number>;
	EQ?: Record<string, number>;
	IS?: Record<string, string>;
	AND?: WHERE[]; // just realize maybe this doesn't work...
	OR?: WHERE[];
	NOT: WHERE;
}

interface Content {
	WHERE: WHERE;
	OPTIONS: Options;
}

export function checkQueryParams(query: any): void {
	const requiredQueryFields = ["WHERE", "OPTIONS"];
	// needed incase the field itself doesn't exist
	try {
		// Throws error if any field is empty
		requiredQueryFields.every((field) => {
			if (query[field].length === 0) {
				throw new InsightError(field + " field is empty");
			}
		});
	} catch (err) {
		throw new InsightError(err instanceof Error ? err.message : String(err));
	}
}

// get the string before the underscore
function getDataset(content: Content): void {
	const regex = new RegExp(/^([^_]+)/); // chatgpt generated regex expression
	const match = content.OPTIONS.COLUMNS[0].match(regex); // get the dataset used in columns
	datasetName = match ? match[1] : ""; // set the global variable
}

// check if the query is only referencing 1 dataset
function datasetValidator(dataToCheck: string): void {
	dataToCheck = dataToCheck.split("_")[0]; // chatgpt generated to extract the string before underscore
	if (dataToCheck !== datasetName) {
		throw new InsightError("Cannot reference more than 1 dataset");
	}
}

function queryMapper(param: string, content: any, resultSoFar: any): void {
	switch (param) {
		case "GT":
		case "LT":
		case "EQ":
			return applyComparator(param, content, resultSoFar);
		case "IS":
			break; // TODO
		case "AND":
		case "OR":
			break; // TODO
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
		// console.log(resultSoFar.length);
	}
	if (resultSoFar.length > MAX_RESULT) {
		throw new ResultTooLargeError();
	}
	return resultSoFar;
}

export function applyComparator(comparator: string, content: Record<string, number>, result: any): any {
	let key: string;
	let keyToCompare: string;
	let value: number;
	switch (comparator) {
		case "GT":
			key = Object.keys(content.GT)[0];
			keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string behind underscore
			datasetValidator(key);
			value = Object.values(content.GT)[0];
			return result.filter((item: any) => item[keyToCompare] > value);
		case "LT":
			// TODO
			break;
		case "EQ":
			// TODO
			break;
	}
}

export function handleOptions(content: any, resultSoFar: any): any {
	const contentObject = content as Content;
	const result = selectColumns(contentObject.OPTIONS.COLUMNS, resultSoFar);
	return result;
	// TODO
	// if (contentObject.OPTIONS.ORDER) {
	// 	applyOrder(contentObject.OPTIONS.COLUMNS, contentObject.OPTIONS.ORDER, result);
	// }
}

function selectColumns(columns: string[], resultSoFar: any): any {
	if (columns.length === 0) {
		throw new InsightError("column must be an non empty array");
	}
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

// function applyOrder(columns: string[], order: string, resultSoFar: any) {
// 	if (!columns.includes(order)) {
// 		throw new InsightError("order key must be in column");
// 	}
// }
