import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import { idValidator, readContent } from "../util/helpers";
import Section from "./Section";
const fs = require("fs-extra");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private existingDataset: Set<string>;
	private readonly DATA_DIR = "data/"; // change back to data

	constructor() {
		this.existingDataset = new Set();
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!id || !content || !kind) {
			throw new InsightError("Param not set");
		}

		if (this.existingDataset.has(id)) {
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
			// This should not be needed anymore, the handling null course logic is done in helpers
			if (!course) {
				continue;
			}
			// convert course data to section instances and store them in an array
			const sections = course.map((section: any) => Section.objectToInstance(section));
			const sectionObj = sections.map((section: any) => section.instanceToObject());
			allObjects.push(...sectionObj);
		}

		// write to disk after coverting all data
		await fs.writeJSON(path, allObjects);
		// keep track of the id added
		this.existingDataset.add(id);
		// convert set to array
		return Array.from(this.existingDataset);
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
			return id;
		} catch (err) {
			throw new InsightError(err instanceof Error ? err.message : String(err)); // chat gpt
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const result: InsightDataset[] = [];
		const datasetAdded = await fs.pathExists(this.DATA_DIR);
		if (!datasetAdded) {
			return result;
		}
		// const getDatasetIds = await fs.readdir(this.DATA_DIR);
		// console.log(getDatasetIds);
		// TODO
		return result;
	}
}
