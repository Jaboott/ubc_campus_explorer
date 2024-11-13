import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";
import * as fs from "fs-extra";
import { clearDisk } from "../TestUtil";

const PORT_NUMBER = 4321;
let server: Server;
const SERVER_URL = `http://localhost:${PORT_NUMBER}`;

describe("Facade C3", function () {
	before(async function () {
		// TODO: start server here once and handle errors properly
		server = new Server(PORT_NUMBER);
		try {
			await server.start();
			Log.info("Server started");
		} catch (err) {
			Log.error("Error starting server:", err);
			expect.fail();
		}
		await clearDisk();
	});

	after(async function () {
		// TODO: stop server here once!
		try {
			await server.stop();
			Log.info("Server stoped");
		} catch (err) {
			Log.error("Error stopping server:", err);
			expect.fail();
		}
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("PUT test for room dataset", async function () {
		const ENDPOINT_URL = "/dataset/rooms/rooms";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/" + "campus.zip");

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function (err) {
					// some logging here please!
					Log.error(`PUT request failed: ${err}`);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			Log.error(`Unexpected error occurred during PUT request: ${err}`);
			expect.fail();
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
	it("DELETE test for rooms dataset", async function () {
		const ENDPOINT_URL = "/dataset/rooms";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					Log.info("DELETE request response", res.body);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function (err) {
					Log.error("Error during DELETE request", err);
					expect.fail("DELETE request failed");
				});
		} catch (err) {
			Log.error("Unexpected error during DELETE test", err);
			expect.fail();
		}
	});

	it("DELETE test for dataset not found error", async function () {
		const ENDPOINT_URL = "/dataset/notFound";

		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					Log.info("DELETE request response", res.body);
					expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
				})
				.catch(function (err) {
					Log.error("Error during DELETE request", err);
				});
		} catch (err) {
			Log.error("Unexpected error during DELETE test", err);
			expect.fail();
		}
	});

	it("POST test for query", async function () {
		const ENDPOINT_URL_PUT = "/dataset/rooms/rooms";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/" + "campus.zip");
		try {
			const resPut = await request(SERVER_URL)
				.put(ENDPOINT_URL_PUT)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed");
			Log.info("PUT request response", resPut.body);
			expect(resPut.status).to.be.equal(StatusCodes.OK);
		} catch (err) {
			Log.error(`PUT request failed: ${err}`);
			expect.fail("PUT request failed: " + err);
		}

		const ENDPOINT_URL = "/query";
		const query = {
			WHERE: {
				LT: {
					rooms_seats: 7,
				},
			},
			OPTIONS: {
				COLUMNS: ["rooms_fullname", "rooms_seats", "rooms_shortname"],
			},
		};
		try {
			const resPost = await request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send({ query })
				.set("Content-Type", "application/json");

			Log.info("POST request response", resPost.body);
			expect(resPost.status).to.be.equal(StatusCodes.OK);
		} catch (err) {
			Log.error("Error during POST request", err);
			expect.fail("POST request failed: " + err);
		}
	});

	//Timeout issues
	// it("GET test for fetching datasets", async function () {
	// 	const ENDPOINT_URL_GET = "/datasets";
	// 	try {
	// 		const res = await request(SERVER_URL).get(ENDPOINT_URL_GET);
	// 		Log.info("GET request response", res.body);
	// 		expect(res.status).to.be.equal(StatusCodes.OK);
	// 	} catch (err) {
	// 		Log.error("Error during GET request", err);
	// 		expect.fail("GET request failed");
	// 	}
	// });
});
