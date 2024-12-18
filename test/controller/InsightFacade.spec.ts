// import { get } from "http";
import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	InsightResult,
	InsightDataset,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sectionOne: string;
	let sections: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		sectionOne = await getContentFromArchives("oneCourse.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should successfully add a dataset", function () {
			const result = facade.addDataset("ubc", sectionOne, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add more than one dataset", async function () {
			const result = await facade.addDataset("ubc", sectionOne, InsightDatasetKind.Sections);
			expect(result).to.have.deep.members(["ubc"]);

			const resultTwo = await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			return expect(resultTwo).to.have.deep.members(["ubc", "test123"]);
		});

		it("should reject with an empty dataset id", function () {
			const result = facade.addDataset("", sectionOne, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an id containing underscore", function () {
			const result = facade.addDataset("test_", sectionOne, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an id that contains whitespace only", function () {
			const result = facade.addDataset(" ", sectionOne, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an id that is the same as the id of an already added dataset", async function () {
			try {
				await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
				await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
				expect.fail("Should enter catch block");
			} catch (err) {
				return expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an content that is not base64 string", function () {
			const invalidContent = "@@@";
			const result = facade.addDataset("test123", invalidContent, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject without content", function () {
			const result = facade.addDataset("test123", "", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when dataset is not in zip file", async function () {
			const invalidFileFormat = await getContentFromArchives("course.txt");
			const result = facade.addDataset("test123", invalidFileFormat, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when dataset is not located within a folder called courses/ in the zip's root directory. ", async function () {
			const invalidFileFormat = await getContentFromArchives("AANB504.zip");
			const result = facade.addDataset("test123", invalidFileFormat, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when the zip file is empty", async function () {
			const emptyFile = await getContentFromArchives("emptyFile.zip");
			const result = facade.addDataset("test123", emptyFile, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when content does not have a valid section with result key", async function () {
			const emptySection = await getContentFromArchives("emptyResult.zip");
			const result = facade.addDataset("test123", emptySection, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when section does not contains every valid query keys", async function () {
			const missingQueryKey = await getContentFromArchives("missingQueryKey.zip");
			const result = facade.addDataset("test123", missingQueryKey, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully add a large dataset", async function () {
			const file = await getContentFromArchives("pair.zip");
			const result = facade.addDataset("pair", file, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.deep.members(["pair"]);
		});
		it("should reject when id already exist on disk", async function () {
			const validFile = await getContentFromArchives("oneCourse.zip");
			await facade.addDataset("pair", validFile, InsightDatasetKind.Sections);
			const nFacade = new InsightFacade();
			const result = nFacade.addDataset("pair", validFile, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should successfully remove a dataset", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			const result = facade.removeDataset("test123");
			return expect(result).to.eventually.equal("test123");
		});

		it("should successfully remove multiple dataset", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			await facade.addDataset("ubc", sectionOne, InsightDatasetKind.Sections);
			await facade.removeDataset("ubc");
			const result = facade.removeDataset("test123");
			return expect(result).to.eventually.equal("test123");
		});

		it("should reject when empty dataset id", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when id contains underscore", function () {
			const result = facade.removeDataset("test_");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when id contains whitespace only", function () {
			const result = facade.removeDataset(" ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when trying to remove a data that is not added", function () {
			const result = facade.removeDataset("test123");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject when trying to remove the same dataset twice", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			await facade.removeDataset("test123");
			const result = facade.removeDataset("test123");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should successfully delete an existing dataset using a different instance", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			const nFacade = new InsightFacade();
			const result = nFacade.removeDataset("test123");
			return expect(result).to.eventually.equal("test123");
		});

		it("should reject when trying to remove a dataset that no longer exists (using a different instance)", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			await facade.removeDataset("test123");
			const nFacade = new InsightFacade();
			const result = nFacade.removeDataset("test123");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});
	});

	describe("ListDatasets", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should return empty array when there aren't any available datasets for querying", function () {
			const expectedResult: InsightDataset[] = [];
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal(expectedResult);
		});

		it("should successfully list one data set", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			const result: InsightDataset[] = await facade.listDatasets();
			const expectedResult: InsightDataset[] = [
				{
					id: "test123",
					kind: InsightDatasetKind.Sections,
					numRows: 2,
				},
			];
			return expect(result).to.have.deep.members(expectedResult);
		});

		it("should successfully list more than one data set", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			await facade.addDataset("test456", sectionOne, InsightDatasetKind.Sections);
			const expectedResult: InsightDataset[] = [
				{
					id: "test123",
					kind: InsightDatasetKind.Sections,
					numRows: 2,
				},
				{
					id: "test456",
					kind: InsightDatasetKind.Sections,
					numRows: 2,
				},
			];
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal(expectedResult);
		});

		it("should successfully return empty dataset when removeDataset is called after addDataset", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			await facade.removeDataset("test123");
			const expectedResult: InsightDataset[] = [];
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal(expectedResult);
		});

		it("should successfully return 1 dataset when 2 dataset is added and 1 is removed", async function () {
			await facade.addDataset("test123", sectionOne, InsightDatasetKind.Sections);
			await facade.addDataset("test456", sectionOne, InsightDatasetKind.Sections);
			await facade.removeDataset("test456");
			const expectedResult: InsightDataset[] = [
				{
					id: "test123",
					kind: InsightDatasetKind.Sections,
					numRows: 2,
				},
			];
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal(expectedResult);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<any> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// TODO: replace with your assertions
				// If performQuery() is expected to reject, expected will be a string that represents the error type.
				if (err instanceof Error) {
					return expect(err.constructor.name).to.equal(expected);
				}
				expect.fail(`should thrown error`);
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			return expect(result).to.have.deep.members(expected); // TODO: replace with your assertions
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("ubc", sectionOne, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97 ORDER by avg", checkQuery);
		it("[valid/complex.json] SELECT instructor, fail WHERE avg > 98 AND NOT instructor IS f*", checkQuery);
		it("[valid/allKeysSelected.json] SELECT * WHERE avg > 99", checkQuery);
		it("[valid/optionsFirst.json] SELECT dept, avg WHERE avg = 97", checkQuery);
		it("[valid/endWithAsterisk.json] SELECT dept, avg WHERE dept IS z*", checkQuery);
		it("[valid/startWithAsterisk.json] SELECT dept, avg WHERE dept IS *y", checkQuery);
		it("[valid/containString.json] SELECT dept, avg  WHERE dept IS *cnt*", checkQuery);
		it("[valid/matchString.json] SELECT dept, avg  WHERE dept IS cnto", checkQuery);
		it("[valid/logicAnd.json] SELECT dept, avg WHERE avg > 20 AND avg < 40", checkQuery);
		it("[valid/nestedAnd.json] SELECT dept, (avg > 35 AND pass < 100) AND avg < 40", checkQuery);
		it("[valid/logicOr.json] SELECT dept, avg WHERE title IS *hong* OR avg = 98", checkQuery);
		it("[valid/multipleWhere.json] SELECT dept, avg WHERE avg = 98", checkQuery);
		it("[valid/negationNumber.json] SELECT dept, avg WHERE NOT avg < 99", checkQuery);
		it("[valid/negationString.json] SELECT fail, audit WHERE NOT dept IS *", checkQuery);
		it("[valid/anyOrder.json] SELECT dept, avg WHERE avg = 97", checkQuery);
		it("[valid/emptyResult.json] SELECT dept, avg WHERE year = 0", checkQuery);
		it("[valid/andStringNumber.json] SELECT instructor and uuid WHERE dept IS z* AND year = 2015", checkQuery);
		it("[valid/ascSort.json] SELECT dept, avg WHERE avg > 97 ORDER by avg ASC", checkQuery);
		it("[valid/descSort.json] SELECT dept, avg WHERE avg > 97 ORDER by avg DESC", checkQuery);
		it(
			"[valid/sortMultipleKey.json] SELECT * WHERE avg > 99 ORDER BY sections_avg DESC, sections_year DESC",
			checkQuery
		);
		// moved the test here because this uses section dataset and we did not add the dataset in the function below
		it("[valid/allAggregations.json] Should return a result for a query containing all agreggations", checkQuery);
		it("[invalid/resultTooLarge.json] Result too large error", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/options.json] Query missing OPTIONS", checkQuery);
		it("[invalid/empty.json] Query that is empty", checkQuery);
		it("[invalid/middleAsterisks.json] Query with middle asterisk", checkQuery);
		it("[invalid/multipleAsterisks.json] Query with multiple asterisk", checkQuery);
		it("[invalid/twoReferences.json] Query that references more than one dataset in its query keys", checkQuery);
		it("[invalid/datasetNotAdded.json] Query that references a dataset that is not added", checkQuery);
		it("[invalid/idStringInvalid.json] Query that uses invalid idstring", checkQuery);
		it("[invalid/emptyIdString.json] Query that uses empty idstring", checkQuery);
		it("[invalid/caseSensitiveIdString.json] Query that uses all caps idstring", checkQuery);
		it("[invalid/mfield.json] Query that references an invalid mfield", checkQuery);
		it("[invalid/sfield.json] Query that references an invalid sfield", checkQuery);
		it("[invalid/mComparator.json] Query that uses an invalid MCOMPARATOR", checkQuery);
		it("[invalid/logicKey.json] Query that uses an invalid LOGIC key (XOR)", checkQuery);
		it(
			"[invalid/orderKeyNotFound.json] Query that have an order key that is not in COLUMNS KEY_LIST array",
			checkQuery
		);
		it("[invalid/noColumns.json] Query that does not have COLUMNS", checkQuery);
		it("[invalid/emptyColumn.json] Query with empty COLUMNS array", checkQuery);
		it("[invalid/emptyOrderKeys.json] Query with empty order keys array", checkQuery);
		it("[invalid/missingOrderKeys.json] Query with missing order keys array", checkQuery);
		it("[invalid/missingOrderDir.json] Query with missing order dir key", checkQuery);
		it("[invalid/sComparison.json] Query that compare a mkey using SCOMPARISON", checkQuery);
		it("[invalid/mComparison.json] Query that compare a skey using MCOMPARISON", checkQuery);
		it("[invalid/emptyAnd.json] Query with empty AND array", checkQuery);
		it("[invalid/emptyIs.json] Query with empty IS array", checkQuery);
		it("[invalid/missingAnd.json] Query that should have AND connecting", checkQuery);
		it("[invalid/orderByTwoKeys.json] Query with two keys in ORDER", checkQuery);
		it("[invalid/multipleKeyGT.json] Query with multiple key in GT", checkQuery);
		it("[invalid/keyTypeEQ.json] Query with invalid key type in EQ", checkQuery);
		it("[invalid/structure.json] Query with a wrong structure (GT not inside WHERE)", checkQuery);
		it("[invalid/optionKey.json] Query with an invalid key in OPTIONS (LT inside OPTIONS)", checkQuery);
		it("[invalid/isNotObject.json] Query with IS that is not an object", checkQuery);
		it("[invalid/gtNotObject.json] Query with GT that is not an object", checkQuery);
	});
});

describe("InsightFacade Tests for C2 Features", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let simpleCampus: string;
	let simpleDupBuilding: string;
	let ubcCampus: string;
	let noBuildings: string;
	let noIndex: string;
	let emptyIndex: string;
	let missingRoomsTable: string;
	let missingFields: string;

	before(async function () {
		// This block runs once and loads the datasets.
		simpleCampus = await getContentFromArchives("simpleCampus.zip");
		simpleDupBuilding = await getContentFromArchives("simpleCampusDuplicateBuilding.zip");
		ubcCampus = await getContentFromArchives("campus.zip");
		noBuildings = await getContentFromArchives("campusNoBuildings.zip");
		noIndex = await getContentFromArchives("campusNoIndex.zip");
		emptyIndex = await getContentFromArchives("campusEmptyIndex.zip");
		missingRoomsTable = await getContentFromArchives("simpleInvalidCampusNoRooms.zip");
		missingFields = await getContentFromArchives("simpleInavlidCampusMissingFields.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset (RoomDataset)", function () {
		beforeEach(function () {
			facade = new InsightFacade();
		});

		afterEach(async function () {
			await clearDisk();
		});

		it("should successfully add a simple room dataset", function () {
			const result = facade.addDataset("simple", simpleCampus, InsightDatasetKind.Rooms);
			// const names = await facade.listDatasets();
			// console.log(names);
			return expect(result).to.eventually.have.members(["simple"]);
		});

		it("should successfully add a big room dataset", function () {
			const result = facade.addDataset("ubc", ubcCampus, InsightDatasetKind.Rooms);
			// const names = await facade.listDatasets();
			// console.log(names);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		// reject when:
		// invalid zip: zip does not contain a valid room, no index file
		// invalid index: no valid building list table
		// invalid room: room file is missing a field, invalid geolocation
		it("should reject when zip file has no buildings (ie. no rooms)", function () {
			const result = facade.addDataset("noBuildings", noBuildings, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when room dataset is missing index file", function () {
			const result = facade.addDataset("noIndex", noIndex, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when room dataset has a blank index file (ie. index has no tables)", function () {
			const result = facade.addDataset("emptyIndex", emptyIndex, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// not actually sure if this the expected behaviour
		it("should reject if the only building file has no rooms table (ie. the dataset does not contain at least one valid room)", function () {
			const result = facade.addDataset("missingRoomsTable", missingRoomsTable, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the only building file has a rooms table but the rooms are missing some fields (ie. the dataset does not contain at least one valid room)", function () {
			const result = facade.addDataset("missingFields", missingFields, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// duplicate buildings on table
		// many invalids with a single valid buildings
	});

	describe("PerformQuery (RoomDataset)", function () {
		async function checkQuery(this: Mocha.Context): Promise<any> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// TODO: replace with your assertions
				// If performQuery() is expected to reject, expected will be a string that represents the error type.
				if (err instanceof Error) {
					return expect(err.constructor.name).to.equal(expected);
				}
				expect.fail(`should thrown error`);
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			return expect(result).to.have.deep.members(expected); // TODO: replace with your assertions
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("rooms", ubcCampus, InsightDatasetKind.Rooms),
				facade.addDataset("dup", simpleDupBuilding, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		it("[valid/rqAllKeys.json] SELECT * WHERE room_seats < 7", checkQuery);
		it("[valid/rqBasic.json] SELECT rooms_shortname, rooms_fullname, rooms_seats WHERE rooms_seats > 300", checkQuery);
		it(
			"[valid/rqComplex.json] SELECT rooms_shortname, MAX(room_seats) WHERE rooms_furniture IS 'Tables' AND rooms_seats > 300 GROUP BY rooms_shortname",
			checkQuery
		);
		it("[valid/aggAvg.json] SELECT rooms_shortname, AVG(rooms_seats) WHERE rooms_fullname IS 'A*'", checkQuery);
		it("[valid/aggCount.json] SELECT rooms_shortname, COUNT(*) WHERE rooms_fullname IS 'A*'", checkQuery);
		it("[valid/aggMin.json] SELECT rooms_shortname, MIN(rooms_seats) WHERE rooms_fullname IS 'A*'", checkQuery);
		it("[valid/aggMax.json] SELECT rooms_shortname, MAX(rooms_seats) WHERE rooms_fullname IS 'A*'", checkQuery);
		it("[valid/aggSum.json] SELECT rooms_shortname, SUM(rooms_seats) WHERE rooms_fullname IS 'A*'", checkQuery);
		it(
			"[valid/simpleGrouping.json] SELECT rooms_shortname, rooms_furniture WHERE rooms_shortname IS 'B*' GROUP BY rooms_shortname",
			checkQuery
		);
		it(
			"[valid/multipleGroupings.json] SELECT rooms_shortname, rooms_furniture, MAX(rooms_seats) WHERE rooms_shortname IS 'BUCH' GROUP BY rooms_shortname, rooms_furniture",
			checkQuery
		);
		it(
			"[valid/rqDuplicateBuilding.json] Should create duplicate entries if index table has multiple copies of a building",
			checkQuery
		);
		it("[valid/rqTwoAggregations.json] Should support >1 aggregations", checkQuery);
		it(
			"[valid/duplicateAggregation.json] Should be able to run the same aggregation multiple times as long as column name is different",
			checkQuery
		);

		it("[invalid/rqInvalidWhereKey.json] Room query using a Section key in WHERE clause", checkQuery);
		it("[invalid/rqInvalidOptionsKeys.json] Room query using Section keys in OPTIONS", checkQuery);
		it("[invalid/invalidApplyKey.json] Room query that uses underscore in applyKey", checkQuery);
		it(
			"[invalid/invalidKeyCol.json] Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present",
			checkQuery
		);
		it("[invalid/emptyGroup.json] GROUP must be a non-empty array", checkQuery);
		it("[invalid/noGroup.json] TRANSFORMATIONS missing GROUP", checkQuery);
		it("[invalid/applyNotObj.json] Apply body must be object", checkQuery);
		it("[invalid/noApply.json] TRANSFORMATIONS missing APPLY", checkQuery);
		it("[invalid/invalidApplyToken.json] Invalid transformation operator", checkQuery);
		it(
			"[invalid/columnKeyMissingInGroup.json] All column keys must be in GROUP/APPLY when TRANSFORMATIONS is present",
			checkQuery
		);
		it("[invalid/emptyApplyKey.json] Apply key cannot be empty string", checkQuery);
		it("[invalid/multipleApplyKeys.json] A single apply rule should only have 1 key", checkQuery);
		it("[invalid/nonNumericKeyAvg.json] Invalid key type -- Cannot use non-numeric key on avg", checkQuery);
		it("[invalid/nonNumericKeySum.json] Invalid key type -- Cannot use non-numeric key on sum", checkQuery);
		it("[invalid/nonNumericKeyMin.json] Invalid key type -- Cannot use non-numeric key on min", checkQuery);
		it("[invalid/nonNumericKeyMax.json] Invalid key type -- Cannot use non-numeric key on max", checkQuery);
		it(
			"[invalid/emptyStringDataset.json] Referenced dataset cannot be empty string (dataset empty in COLUMNS and TRANSFORMATIONS)",
			checkQuery
		);
		it(
			"[invalid/multipleDatasetsReferenced.json] Multiple datasets referenced in COLUMNS and TRANSFORMATIONS -- Cannot query >1 dataset",
			checkQuery
		);
		it("[invalid/duplicateAggregationKey.json] Multiple aggregations cannot have the same name", checkQuery);
	});
});
