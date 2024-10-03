import { InsightError } from "../controller/IInsightFacade";
// import Section from "../controller/Section";

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

function datasetValidator() {
	// chatgpt generated regex expression get the string before the underscore
	const regex = new RegExp(/^([^_]+)/);
}

function queryMapper(param: string, content: string) {
	switch (param) {
		default:
			return;
	}
}

// get all rows from a dataset and filter using comparator if necessary
export function handleWhere(where: Object, columns: String[]) {
	// determine dataset being queried -- use the first item in the columns list
	const firstColumn = columns[0];
	const datasetName = firstColumn.split("_")[0]; // splits the words in columns list and gets first part only (ie. the dataset name)

	// call applyComparator if GT, EQ, OR, AND, IS etc are keys in where
	// if no comparators, get every row from a dataset
	// let result = await ;

	// if the total number of rows exceeds 5000, throw ResultTooLargeError

	// call handle options to filter out columns
}

export function applyComparator(comparator: Object, content: string) {}

type Options = {
	COLUMNS: string[];
	ORDER?: string;
};

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
