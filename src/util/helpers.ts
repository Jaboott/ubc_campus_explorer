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
		// Process file that follows the path "courses/" and is not a directory
		if (filename.startsWith("courses/") && !zipFile.files[filename].dir) {
			// Turn the file into text then check the validity of the section
			const section = zipFile.files[filename].async("text").then((fileContent) => {
				const courseJson = JSON.parse(fileContent);
				// Check if the jsonData is valid
				if (courseValidator(courseJson)) {
					return courseJson.result;
				} else {
					return null;
				}
			});
			allPromises.push(section);
		}
	}

	// for now results contains the all json objects
	return await Promise.all(allPromises);
}

function courseValidator(course: any): boolean {
	const courseData = course.result;
	const requiredFields = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];
	// If "result" is not present, throw an error
	if (!courseData) {
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
