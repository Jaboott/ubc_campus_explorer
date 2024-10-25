import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { readSection } from "./sectionProcessingHandler";
import { readRoom } from "./roomProcessingHandler";
import Section from "../controller/Section";

export async function readData(content: string, kind: InsightDatasetKind): Promise<any[]> {
	let courses;

	// A list of JSON sections or rooms
	if (kind === InsightDatasetKind.Sections) {
		courses = await readSection(content);
	} else if (kind === InsightDatasetKind.Rooms) {
		courses = await readRoom(content);
	} else {
		throw new InsightError("kind should only be Room or Section");
	}

	// No valid section
	if (courses.length === 0) {
		throw new InsightError("No valid data found.");
	}

	return courses;
}

export function dataToInsightKind(dataEntities: any[], kind: InsightDatasetKind): any[] {
	const allObjects: any[] = [];
	for (const dataEntity of dataEntities) {
		// To filter out the null
		if (!dataEntity) {
			continue;
		}
		// convert course data to section instances and store them in an array
		let sectionObj;
		if (kind === InsightDatasetKind.Sections) {
			const sections = dataEntity.map((section: any) => Section.objectToInstance(section));
			sectionObj = sections.map((section: any) => section.instanceToObject());
		} else {
			// TODO
			sectionObj = null;
		}
		allObjects.push(...sectionObj);
	}

	// This is to catch when only a null dataset has been returned
	if (allObjects.length === 0) {
		throw new InsightError("No valid data found.");
	}

	return allObjects;
}
