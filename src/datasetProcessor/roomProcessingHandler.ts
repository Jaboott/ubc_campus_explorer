import JSZip from "jszip";
import * as parse5 from "parse5";
import { InsightError } from "../controller/IInsightFacade";

export async function readRoom(content: string): Promise<any> {
	const zipFile = await JSZip.loadAsync(content, { base64: true });

	if (!Object.keys(zipFile.files).includes("index.htm")) {
		throw new InsightError("index.htm file not found");
	}

	const htmFile = await zipFile.files["index.htm"].async("text").then((file) => {
		return parse5.parse(file);
	});

	// html table with the rooms
	const table = findBuildingTable(htmFile);
	return getRoomsFromTable(table);
}

// TODO
function getRoomsFromTable(table: any): any[] {
	console.log(table);

	return new Array();
}

// My understanding is that there's only 1 table that's valid. It's identified by having the class = views-field
// This could be wrong
function findBuildingTable(node: any): any {
	if (node.nodeName === "table" && checkTable(node)) {
		return node as Document;
	}

	// if node contains child
	if (node.childNodes) {
		// iterate through the child nodes
		for (const child of node.childNodes) {
			const result = findBuildingTable(child);
			if (result) {
				return result;
			}
		}
	}

	return null;
}

function checkTable(table: any): boolean {
	let currentNode = table;
	// gpt generated method to iterate through specified fields to access td
	const path = ["tbody", "tr", "td"];

	// Go through the table to access the td element
	for (const nodeName of path) {
		currentNode = currentNode?.childNodes?.find((child: any) => child.nodeName === nodeName);
		if (!currentNode) {
			return false;
		}
	}

	// checking if views-field is in class
	const classAttr = currentNode.attrs?.find((attr: any) => attr.name === "class")?.value;
	if (classAttr) {
		const hasField = classAttr.split(" ").some((attr: string) => {
			return attr === "views-field";
		});
		return hasField;
	}

	return false;
}
