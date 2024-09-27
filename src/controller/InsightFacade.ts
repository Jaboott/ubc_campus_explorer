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
	private readonly DATA_DIR = "data/";

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
		const courses = await readContent(content);
		const path = `data/${id}`;

		try {
			const sections = courses[0].map(
				(course: any) =>
					new Section(
						course.uuid,
						course.id,
						course.title,
						course.instructor,
						course.dept,
						course.year,
						course.avg,
						course.pass,
						course.fail,
						course.audit
					)
			);
			// make a directory if it does not exist otherwise use the directory
			await fs.ensureDir(this.DATA_DIR);
			// covert section instances to object
			const sectionObj = sections.map((section: { instanceToObject: () => any }) => section.instanceToObject());
			await fs.writeJSON(path, sectionObj);
			this.existingDataset.add(id);
		} catch (err) {
			throw new InsightError(err instanceof Error ? err.message : String(err)); // chat gpt
		}
		// convert set to array
		return Array.from(this.existingDataset);
	}

	public async removeDataset(id: string): Promise<string> {
		const path = `data/${id}`;
		idValidator(id);
		const fileExists = await fs.pathExists(path);

		if (!fileExists) {
			throw new NotFoundError("ID does not exist");
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
