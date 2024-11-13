import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";
import * as fs from "fs-extra";

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

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("PUT test for room dataset", async function () {
		const ENDPOINT_URL = "/dataset/campus/rooms";
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

	it("PUT test for section dataset", async function () {
		const ENDPOINT_URL = "/dataset/campus/sections";
		const ZIP_FILE_DATA = await fs.readFile("test/resources/archives/" + "pair.zip");

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
	it("DELETE test for room dataset", async function () {
		const ENDPOINT_URL = "/dataset/campus";

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

	// TODO This will delete both disk and memory caches for the dataset for the id, meaning that subsequent queries for that id should fail unless a new PUT happens first.
	// TODO POST
	// TODO GET
});
