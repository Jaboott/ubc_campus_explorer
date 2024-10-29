import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { readSection } from "./sectionProcessingHandler";
import { readRoom } from "./roomProcessingHandler";
import Section from "../controller/Section";
import fs from "fs";
import Room from "../controller/Room";

export async function readData(content: string, kind: InsightDatasetKind): Promise<any[]> {
	let dataEntities;

	// A list of JSON sections or rooms
	if (kind === InsightDatasetKind.Sections) {
		dataEntities = await readSection(content);
	} else if (kind === InsightDatasetKind.Rooms) {
		dataEntities = await readRoom(content);
	} else {
		throw new InsightError("kind should only be Room or Section");
	}

	// No valid section
	if (dataEntities.length === 0) {
		throw new InsightError("No valid data found.");
	}

	return dataEntities;
}

export function dataToInsightKind(dataEntities: any[], kind: InsightDatasetKind): any[] {
	const allObjects: any[] = [];

	if (kind === InsightDatasetKind.Rooms) {
		const rooms = dataEntities as Room[];
		rooms.map((room: any) => room.instanceToObject());
		allObjects.push(...rooms);
	} else {
		for (const course of dataEntities) {
			// To filter out the null
			if (!course) {
				continue;
			}
			// convert course data to section instances and store them in an array
			const sections = course.map((section: any) => Section.objectToInstance(section));
			const sectionObj = sections.map((section: any) => section.instanceToObject());
			allObjects.push(...sectionObj);
		}
	}

	// This is to catch when only a null dataset has been returned
	if (allObjects.length === 0) {
		throw new InsightError("No valid course found.");
	}

	// This is to catch when only a null dataset has been returned
	if (allObjects.length === 0) {
		throw new InsightError("No valid data found.");
	}

	return allObjects;
}

export function readExistingDataset(path: string): Map<string, InsightDatasetKind> {
	const data = fs.readFileSync(path, "utf8");
	const existingDataset = JSON.parse(data);
	// Turn the json back to a map
	const map = new Map(
		Object.entries(existingDataset).map(([key, value]) => {
			return [key, value === "section" ? InsightDatasetKind.Sections : InsightDatasetKind.Rooms];
		})
	);
	return map;
}
