import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import { idValidator } from "../datasetProcessor/sectionProcessingHandler";
import { handleOptions, handleWhere } from "../queryEngine/queryHandler";
import { dataToInsightKind, readData, readExistingDataset } from "../datasetProcessor/processingHandler";
import { queryValidator } from "../queryEngine/queryValidator";

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
		this.existingDataset = new Map();
	}

	private async initFacade(): Promise<void> {
		const path = this.DATA_DIR + "existingDataset.json";
		// Making sure "data/" exists
		await fs.mkdir(this.DATA_DIR, { recursive: true });

		try {
			const data = await fs.readFile(path, "utf8");
			this.existingDataset = readExistingDataset(data);
		} catch (error) {
			if (error instanceof Error && error.name === "364") {
				await fs.writeFile(path, "");
			}
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		await this.initFacade();
		if (!id || !content || !kind) {
			throw new InsightError("Param not set");
		} else if (this.existingDataset.has(id)) {
			throw new InsightError("Cannot add the same dataset twice");
		}

		// Throws InsightError if not valid
		idValidator(id);

		// Throws InsightError if unexpected kind
		const dataEntities = await readData(content, kind);
		const allObjects = dataToInsightKind(dataEntities, kind);

		// path is "data/${id}"
		const path = this.DATA_DIR + id + ".json";
		await fs.ensureDir(this.DATA_DIR);

		// write to disk after converting all data
		await fs.writeJSON(path, allObjects);
		// keep track of the id (and kind for list dataset)
		this.existingDataset.set(id, kind);
		// Updating the existingDataset onto disk
		await this.updateDisk();
		// return list of id
		return Array.from(this.existingDataset.keys());
	}

	public async removeDataset(id: string): Promise<string> {
		await this.initFacade();
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
			await this.updateDisk();
			return id;
		} catch (err) {
			throw new InsightError(err instanceof Error ? err.message : String(err)); // chat gpt
		}
	}

	private async updateDisk(): Promise<void> {
		// Recreate json with modified existingDataset
		const existingDatasetJson = Object.fromEntries(
			// Making an array of [[key, value], [key2, value2]]
			Array.from(this.existingDataset.entries()).map(([key, value]) => {
				// convert value as string version of InsightDatasetKind
				return [key, value === InsightDatasetKind.Sections ? "sections" : "rooms"];
			})
		);
		// save changes onto disk
		await fs.writeJSON(this.DATA_DIR + "existingDataset.json", existingDatasetJson);
	}

	public async performQuery(query: any): Promise<InsightResult[]> {
		await this.initFacade();
		// const queryObject = Object(query);
		const [datasetName, applyKey] = queryValidator(query, this.existingDataset);
		const resultSoFar = await handleWhere(query, datasetName, applyKey);
		return handleOptions(query, resultSoFar);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		await this.initFacade();
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
