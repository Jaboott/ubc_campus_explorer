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

export async function readContent(content: string): Promise<any[]> {
	let zipFile;

	try {
		// Attempting to load the base 64 zip file
		zipFile = await JSZip.loadAsync(content, { base64: true });
		// Using .files to check the existence of "courses/"
		const validStructure = zipFile.files["courses/"];

		if (!validStructure) {
			throw new InsightError("not located within a folder called courses/ in the zip's root directory.");
		}
	} catch (err: unknown) {
		let message = "Unknown Error";
		// To access the .message field
		if (err instanceof Error) {
			message = err.message;
		}
		throw new InsightError(message);
	}
	const allPromises: Promise<any>[] = [];

	// Iterating through all the files under zip file
	for (const filename of Object.keys(zipFile.files)) {
		// Process file that follows the path "courses/" and is not a directory (+ not .DS_Store) - not sure if there is a better way to do this
		if (filename.startsWith("courses/") && !zipFile.files[filename].dir && !filename.endsWith(".DS_Store")) {
			// Turn the file into text then check the validity of the section
			const section = zipFile.files[filename]
				.async("text")
				.then((fileContent) => {
					return processFile(fileContent);
				})
				.then((result) => {
					if (result !== null) {
						return result;
					}
				});
			allPromises.push(section);
		}
	}
	// wait for all file to process
	return await Promise.all(allPromises);
}

function processFile(fileContent: any): any {
	try {
		// problem here when there are more than 1 file in courses
		// console.log(fileContent);
		const courseJson = JSON.parse(fileContent);
		// Check if the jsonData is valid
		if (courseValidator(courseJson)) {
			return courseJson.result;
		} else {
			return null;
		}
	} catch (err) {
		throw new InsightError(err instanceof Error ? err.message : String(err));
	}
}

function courseValidator(course: any): boolean {
	const courseData = course.result;
	const requiredFields = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];
	// If "result" is not present, throw an error
	if (!courseData || courseData.length === 0) {
		return false;
	}

	// A file can include multiple section data
	for (const section of courseData) {
		// Checks if all the fields are present in JSON
		if (!requiredFields.every((field) => field in section)) {
			return false;
		}
	}
	return true;
}
