import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import { idValidator, readContent } from "../util/helpers";
const fs = require("fs-extra");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private existingDataset: Set<string>; // Not sure if we need this but we could use this set to keep track of added dataset IDs to avoid adding duplicates / removing dataset that is not added

	constructor() {
		this.existingDataset = new Set();
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// TODO: Remove this once you implement the methods!
		// throw new Error(
		// 	`InsightFacadeImpl::addDataset() is unimplemented! - id=${id}; content=${content?.length}; kind=${kind}`
		// );

		if (!id || !content || !kind) {
			throw new InsightError("Param not set");
		}
		// try {
		// 	idValidator(id);
		// 	const courses = await readContent(content);
		// 	console.log(courses); // remove later
		// } catch (err) {
		// 	throw err;
		// }

		idValidator(id);
		const courses = await readContent(content);
		console.log(courses.name); // remove later

		return Promise.resolve([""]); // TODO
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		// throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
		const path = `data/${id}`;
		idValidator(id);
		const fileExists = await fs.pathExists(path);

		if (!fileExists) {
			throw new NotFoundError("ID does not exist");
		}

		try {
			await fs.remove(path);
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
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
