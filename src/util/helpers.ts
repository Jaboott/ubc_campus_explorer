import { InsightError } from "../controller/IInsightFacade";
import JSZip from "jszip";

export function idValidator(id: string): boolean {
	// should we make two versions of this for add and remove?
	// whitespace only and contains underscore?
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
	const zip = new JSZip();
	let zipFile;
	try {
		zipFile = await zip.loadAsync(content, { base64: true });
	} catch (err) {
		console.log(err); // remove later
		throw new InsightError("not a base64 string");
	}

	const validStructure = zipFile.folder("courses");
	if (!validStructure) {
		throw new InsightError("not located within a folder called courses/ in the zip's root directory.");
	}

	return validStructure;
	// iterate over the files (courses) and see if they are valid?
}

// function sectionValidator(section: any): boolean {
// 	// check if the section contains every valid query key?
// 	return false; // TODO
// }
