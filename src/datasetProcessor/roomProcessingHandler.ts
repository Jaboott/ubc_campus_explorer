import JSZip from "jszip";
import * as parse5 from "parse5";
import { InsightError } from "../controller/IInsightFacade";
import Building from "../controller/Building";
import { fetchLocation } from "./fetchLocation";
import Room from "../controller/Room";

export async function readRoom(content: string): Promise<any> {
	const zipFile = await JSZip.loadAsync(content, { base64: true });

	if (!Object.keys(zipFile.files).includes("index.htm")) {
		throw new InsightError("index.htm file not found");
	}
	const htmFile = await zipFile.files["index.htm"].async("text").then((file) => {
		return parse5.parse(file);
	});

	// html table with the rooms
	const table = findTable(htmFile);

	if (!table) {
		throw new InsightError("No valid table found");
	}

	// an array of building objects
	const buildings = await getBuildingsFromTable(table);
	const roomPromises: Promise<Room[]>[] = [];
	for (const building of buildings) {
		if (!Object.keys(zipFile.files).includes(building.buildingHref)) {
			continue;
		}
		const roomPromise: Promise<Room[]> = zipFile.files[building.buildingHref].async("text").then((file) => {
			const buildingHtml = parse5.parse(file);
			const buildingRooms: Room[] = getRoomsFromTable(building, buildingHtml);
			return buildingRooms;
		});

		roomPromises.push(roomPromise);
	}
	// roomPromises is an array of Rooms arrays...
	const rooms = await Promise.all(roomPromises).then((roomArray: Room[][]) => roomArray.flat());
	return rooms;
}

function getRoomsFromTable(building: Building, buildingHtml: any): Room[] {
	const table = findTable(buildingHtml);
	if (!table) {
		return [];
	}
	const tbodyNode = table.childNodes.find((child: any) => child.nodeName === "tbody");
	const tableRows = tbodyNode.childNodes.filter((node: any) => node.nodeName === "tr");
	// creating an array of promises that holds building information
	const rooms: Room[] = [];
	for (const tableRow of tableRows) {
		const room = getRoomInformation(building, tableRow);
		if (room) {
			rooms.push(room);
		}
	}

	return rooms;
}

function getRoomInformation(building: Building, tableRow: any): Room | null {
	const fieldsMap: Record<string, any> = {
		"views-field views-field-field-room-number": null,
		"views-field views-field-field-room-capacity": null,
		"views-field views-field-field-room-furniture": null,
		"views-field views-field-field-room-type": null,
		"views-field views-field-nothing": null,
	};

	// Adding the td to fieldsMap if field is found in the class attribute
	for (const td of tableRow.childNodes.filter((node: any) => node.nodeName === "td")) {
		const classAttr = td.attrs.find((attr: any) => attr.name === "class");
		if (classAttr && classAttr.value in fieldsMap) {
			fieldsMap[classAttr.value] =
				classAttr.value === "views-field views-field-nothing" ||
				classAttr.value === "views-field views-field-field-room-number"
					? td.childNodes.find((child: any) => child.nodeName === "a")
					: td;
		}
	}

	// Return null if the row does not include all required fields
	if (!Object.values(fieldsMap).every((value: any) => value !== null)) {
		return null;
	}

	const number = getText(fieldsMap["views-field views-field-field-room-number"]);
	const capacity = Number(getText(fieldsMap["views-field views-field-field-room-capacity"]));
	const type = getText(fieldsMap["views-field views-field-field-room-type"]);
	const furniture = getText(fieldsMap["views-field views-field-field-room-furniture"]);
	const href = fieldsMap["views-field views-field-nothing"].attrs.find((attr: any) => attr.name === "href").value;
	return Room.roomFromBuilding(building, number, capacity, type, furniture, href);
}

async function getBuildingsFromTable(table: any): Promise<any[]> {
	const tbodyNode = table.childNodes.find((child: any) => child.nodeName === "tbody");
	const tableRows = tbodyNode.childNodes.filter((node: any) => node.nodeName === "tr");
	// creating an array of promises that holds building information
	const buildingPromises = tableRows.map(async (tableRow: any) => {
		return getBuildingInformation(tableRow);
	});

	let buildings = await Promise.all(buildingPromises);
	// filtering the buildings that's null
	buildings = buildings.filter((building: any) => building !== null);
	return buildings;
}

// This function is making the assumption that such fields will either only appear once or not appear
async function getBuildingInformation(tableRow: any): Promise<Building | null> {
	// filtering tableRow to only include the ones that's td
	const cells = tableRow.childNodes.filter((node: any) => node.nodeName === "td");
	const fieldsMap: Record<string, any> = {
		"views-field views-field-field-building-code": null,
		"views-field views-field-title": null,
		"views-field views-field-field-building-address": null,
	};

	// Adding the td to fieldsMap if field is found in the class attribute
	for (const td of cells) {
		const classAttr = td.attrs.find((attr: any) => attr.name === "class");
		if (classAttr && classAttr.value in fieldsMap) {
			fieldsMap[classAttr.value] = td;
			// Add the <a> instead if class attribute is views-field views-field-title
			if (classAttr.value === "views-field views-field-title") {
				fieldsMap[classAttr.value] = td.childNodes.find((child: any) => child.nodeName === "a");
			}
		}
	}

	// Return null if the row does not include all required fields
	if (!Object.values(fieldsMap).every((value: any) => value !== null)) {
		return null;
	}

	const fullname = getText(fieldsMap["views-field views-field-title"]).replace(/\s+/g, " ");
	const shortname = getText(fieldsMap["views-field views-field-field-building-code"]);
	const address = getText(fieldsMap["views-field views-field-field-building-address"]);
	const href = fieldsMap["views-field views-field-title"].attrs.find((attr: any) => attr.name === "href").value;
	const coordinates = await fetchLocation(address);
	let lat, lon;
	// TODO not sure what to do when fails to fetch geolocation
	if (coordinates instanceof Array && coordinates[0] && coordinates[1]) {
		lat = coordinates[0];
		lon = coordinates[1];
	} else {
		console.log(coordinates);
		return null;
	}
	// regex for href given by gpt to remove leading ./
	return new Building(fullname, shortname, address, lat, lon, href.replace(/^\.\//, ""));
}

function getText(td: any): string {
	const text = td.childNodes.find((child: any) => child.nodeName === "#text");
	return text.value.trim();
}

// My understanding is that there's only 1 table that's valid. It's identified by having the class = views-field
// This could be wrong
function findTable(node: any): any {
	if (node.nodeName === "table" && checkTable(node)) {
		return node;
	}

	// if node contains child
	if (node.childNodes) {
		// iterate through the child nodes
		for (const child of node.childNodes) {
			const result = findTable(child);
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
