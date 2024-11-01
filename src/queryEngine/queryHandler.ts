import { InsightError, InsightResult, ResultTooLargeError } from "../controller/IInsightFacade";
import * as fs from "fs";
import Decimal from "decimal.js";
import { Content } from "./queryObjectInterface";

const MAX_RESULT = 5000;
const DECIMAL_PLACE = 2;
let datasetName = "";
let applyKey: string[] = [];

// get all rows from a dataset and filter using comparator if necessary
export async function handleWhere(content: any, dsName: string, aKey: string[]): Promise<InsightResult[]> {
	datasetName = dsName;
	applyKey = aKey;
	const rawData = await fs.promises.readFile(`data/${datasetName}.json`, "utf-8");
	let resultSoFar = JSON.parse(rawData);
	content as Content;
	for (const param in content.WHERE) {
		resultSoFar = queryMapper(param, content.WHERE, resultSoFar);
	}
	if (content.TRANSFORMATIONS) {
		resultSoFar = doGroupings(content.TRANSFORMATIONS.GROUP, resultSoFar);
		// console.log("TRANSFORMATIONS: ", content.TRANSFORMATIONS.APPLY);
		if (!content.TRANSFORMATIONS.APPLY.length) {
			resultSoFar = convertGroupingsToInsightResult(resultSoFar);
		} else {
			resultSoFar = doCalculations(content.TRANSFORMATIONS.APPLY, resultSoFar);
		}
	}
	if (resultSoFar.length > MAX_RESULT) {
		throw new ResultTooLargeError();
	}
	return resultSoFar;
}

// for each group, return the first InsightResult object
function convertGroupingsToInsightResult(data: any): InsightResult[] {
	const result: InsightResult[] = [];
	for (const group in data) {
		result.push(data[group][0]);
	}
	return result;
}

// check if the query is only referencing 1 dataset
function datasetValidator(dataToCheck: string, groupKey: string[] = []): void {
	if (groupKey?.includes(dataToCheck)) {
		return;
	}
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
			datasetValidator(column, applyKey);
			const key = column.split("_").slice(1).join("_") || column; // chatgpt generated to extract the string behind underscore. '|| column' part is used to account for aggregated column
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

	// console.log("GROUPED: ", groupedData);
	return groupedData;
}

// shortened with chatGPT
function doCalculations(applyClause: any, resultSoFar: any): InsightResult[] {
	const collapsedResult: InsightResult[] = [];

	for (const obKey in resultSoFar) {
		const resultObject: any = { ...resultSoFar[obKey][0] };

		for (const apply of applyClause) {
			const aggregateColumnName = Object.keys(apply)[0];
			const applyBody = apply[aggregateColumnName];
			const key = applyBody[Object.keys(applyBody)[0]].split("_")[1];

			const values = resultSoFar[obKey].map((obj: any) => obj[key]); // get a list of values from a specific column
			const result = calculateAggregate(values, applyBody);

			resultObject[aggregateColumnName] = result; // create key/vlue pair with aggregate column name and result
		}

		collapsedResult.push(resultObject); // push collapsed result after calculating all aggregations
	}

	return collapsedResult;
}

// AVG and SUM have to use the Decimal package according to the spec
function calculateAggregate(values: number[], applyBody: any): number {
	const applyToken = Object.keys(applyBody)[0];
	switch (applyToken) {
		case "MAX":
			return Math.max(...values);
		case "MIN":
			return Math.min(...values);
		case "AVG": {
			const total = values.reduce((sum, val) => sum.add(new Decimal(val)), new Decimal(0));
			const avg = total.toNumber() / values.length;
			return Number(avg.toFixed(DECIMAL_PLACE));
		}
		case "SUM": {
			const total = values.reduce((sum, val) => sum.add(new Decimal(val)), new Decimal(0));
			return Number(total.toFixed(DECIMAL_PLACE));
		}
		case "COUNT":
			return new Set(values).size;
		default:
			return 0; // Default case to handle unexpected tokens
	}
}
