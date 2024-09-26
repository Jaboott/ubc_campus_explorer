import { InsightError } from "../controller/IInsightFacade";
import JSZip from "jszip";

export function idValidator(id: string): boolean {
	// chatgpt generated regex expression
	const regex = new RegExp("^(?!\\s*$)(?!.*_).+$");

	if (!regex.test(id)) {
		throw new InsightError("id invalid: " + id);
	}

	// TODO: should reject with an id that is the same as the id of an already added dataset
	// maybe: for files in dataFolder, if a file that has the same ID already exists, reject
	return true;
}

export async function readContent(content: string): Promise<any> {
	let zipFile;
	try {
		// Attempting to load the base 64 zip file
		zipFile = await JSZip.loadAsync(content, { base64: true });
		// Using .files to check the existence of "courses/"
		const validStructure = zipFile.files["courses/"];
		if (!validStructure) {
			throw new InsightError("not located within a folder called courses/ in the zip's root directory.");
		}
		const allPromises: Promise<any>[] = [];

		for (const filename of Object.keys(zipFile.files)) {
			if (filename.startsWith("courses/") && !zipFile.files[filename].dir) {
				const promise = zipFile.files[filename].async("text").then((fileContent) => {
					try {
						const jsonData = JSON.parse(fileContent);
						// console.log(jsonData);
						// TODO check if it is a valid section
						return jsonData;
					} catch (e) {
						throw new InsightError(`${e}`);
					}
				});
				allPromises.push(promise);
			}
		}

		// for now results contains the all json objects
		const results = await Promise.all(allPromises);
		return results;
	} catch (err: unknown) {
		let message = "Unknown Error";
		// To access the .message field
		if (err instanceof Error) {
			message = err.message;
		}
		throw new InsightError(message);
	}
	// JSZip doesn't have a way to just return a folder, so we can only return the entire zip file
	// after checking its validity
	return zipFile;
	// iterate over the files (courses) and see if they are valid?
}

// function sectionValidator(section: any): boolean {
// 	// check if the section contains every valid query key?
// 	return false; // TODO
// }
