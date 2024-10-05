import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import { idValidator, readContent, readExistingDataset } from "../util/helpers";
import Section from "./Section";
import { queryValidator, handleOptions, handleWhere } from "../util/queryHandler";

const fs = require("fs-extra");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private existingDataset: Map<string, InsightDatasetKind>;
	private readonly DATA_DIR = "data/"; // change back to data

	constructor() {
		const path = this.DATA_DIR + "existingDataset.json";
		// Making sure "data/" exists
		if (!fs.existsSync(this.DATA_DIR)) {
			fs.mkdirSync(this.DATA_DIR);
		}
		// Checking to see if existingDataset.json already exist
		if (fs.existsSync(path)) {
			this.existingDataset = readExistingDataset(path);
		} else {
			this.existingDataset = new Map();
			// Creating "data/existingDataset.json"
			fs.writeFileSync(path, "");
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!id || !content || !kind) {
			throw new InsightError("Param not set");
		} else if (this.existingDataset.has(id)) {
			throw new InsightError("Cannot add the same dataset twice");
		}

		idValidator(id);
		// A list of JSON sections
		const courses = await readContent(content);
		// No valid section
		if (courses.length === 0) {
			throw new InsightError("No valid course found.");
		}
		// path is "data/${id}"
		const path = this.DATA_DIR + id + ".json";
		const allObjects: any[] = [];
		await fs.ensureDir(this.DATA_DIR);

		for (const course of courses) {
			// To filter out the null
			if (!course) {
				continue;
			}
			// convert course data to section instances and store them in an array
			const sections = course.map((section: any) => Section.objectToInstance(section));
			const sectionObj = sections.map((section: any) => section.instanceToObject());
			allObjects.push(...sectionObj);
		}

		// This is to catch when only a null dataset has been returned
		if (allObjects.length === 0) {
			throw new InsightError("No valid course found.");
		}

		// write to disk after coverting all data
		await fs.writeJSON(path, allObjects);
		// keep track of the id (and kind for list dataset)
		this.existingDataset.set(id, kind);
		// Updating the existingDataset onto disk
		const existingDatasetJson = Object.fromEntries(
			// Making an array of [[key, value], [key2, value2]]
			Array.from(this.existingDataset.entries()).map(([key, value]) => {
				// convert value as string version of InsightDatasetKind
				return [key, value === InsightDatasetKind.Sections ? "sections" : "rooms"];
			})
		);
		await fs.writeJSON(this.DATA_DIR + "existingDataset.json", existingDatasetJson);
		// return list of id
		return Array.from(this.existingDataset.keys());
	}

	public async removeDataset(id: string): Promise<string> {
		const path = this.DATA_DIR + id + ".json";
		idValidator(id);
		// const fileExists = await fs.pathExists(path);

		// if (!fileExists) {
		// 	throw new NotFoundError(`${id} does not exist!`);
		// }

		if (!this.existingDataset.has(id)) {
			throw new NotFoundError(`${id} does not exist!`);
		}
		try {
			await fs.remove(path);
			this.existingDataset.delete(id);

			// Recreate json with modified existingDataset
			const existingDatasetJson = Object.fromEntries(
				Array.from(this.existingDataset.entries()).map(([key, value]) => {
					// convert value as string version of InsightDatasetKind
					return [key, value === InsightDatasetKind.Sections ? "sections" : "rooms"];
				})
			);
			// save changes onto disk
			await fs.writeJSON(this.DATA_DIR + "existingDataset.json", existingDatasetJson);
			return id;
		} catch (err) {
			throw new InsightError(err instanceof Error ? err.message : String(err)); // chat gpt
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// const queryObject = Object(query);
		queryValidator(query);
		const resultSoFar = handleWhere(query);
		return handleOptions(query, resultSoFar);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const result: Promise<InsightDataset>[] = [];
		// loop through the existing dataset
		for (const id of this.existingDataset.keys()) {
			// read the file
			const promise = fs.readJson(this.DATA_DIR + id + ".json").then((content: string) => {
				// get number of rows of this file and add this InsightDataset object to the result
				const numRows = content.length;
				return { id, kind: this.existingDataset.get(id), numRows };
			});
			result.push(promise);
		}
		return await Promise.all(result);
	}
}
