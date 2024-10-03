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
export function getDataset(content: Content): void {
	const regex = new RegExp(/^([^_]+)/); // chatgpt generated regex expression
	const match = content.OPTIONS.COLUMNS[0].match(regex);
	datasetName = match ? match[1] : "";
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
export function handleWhere(content: any): void {
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
}

export function applyComparator(comparator: string, content: Record<string, number>, result: any): any {
	let key: string;
	let keyToCompare: string;
	let value: number;
	let datasetUsed: string;
	switch (comparator) {
		case "GT":
			key = Object.keys(content.GT)[0];
			keyToCompare = key.split("_").slice(1).join("_"); // chatgpt generated to extract the string behind underscore
			datasetUsed = key.split("_")[0]; // chatgpt generated to extract the string before underscore
			if (datasetUsed !== datasetName) {
				throw new InsightError("Cannot reference more than 1 dataset");
			}
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

export function handleOptions(options: Options) {
	const { COLUMNS, ORDER } = options;
	selectColumns(COLUMNS);
	if (ORDER) {
		applyOrder(COLUMNS, ORDER);
	}
}

export function selectColumns(columns: string[]) {
	if (columns.length === 0) {
		throw new InsightError("column must be an non empty array");
	}
}

export function applyOrder(columns: string[], order: string) {
	if (!columns.includes(order)) {
		throw new InsightError("order key must be in column");
	}
}
