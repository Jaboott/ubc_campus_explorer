import * as http from "http";
const URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team228";

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

// Addresses should be given exactly as they appear in the dataset files, or an HTTP 404 error code will be returned.
// The response will match the GeoResponse interface (either you will get lat & lon, or error, but never both):
// Tbh I am not sure if I understand the spec correctly...
export async function fetchLocation(
	address: string
): Promise<[GeoResponse["lat"], GeoResponse["lon"]] | GeoResponse["error"]> {
	const encodedAddress = encodeURIComponent(address);
	const url = `${URL}/${encodedAddress}`;

	return new Promise((resolve) => {
		http.get(url, (res: http.IncomingMessage) => {
			let rawData = "";

			res.on("data", (chunk) => {
				rawData += chunk;
			});

			res.on("end", () => {
				const parsedData: GeoResponse = JSON.parse(rawData);
				if (parsedData.error) {
					resolve(parsedData.error);
				} else {
					resolve([parsedData.lat, parsedData.lon]);
				}
			});
		});
	});
}

// I tried adding a test file but I keep getting this error - TypeError: (0 , fetchLocation_1.fetchLocation) is not a function
// I have no idea how to fix that so I just test this out by running this file
// fetchLocation("6245 Agronomy Road V6T 1Z4")
//     .then(result => {
//         console.log("result:", result);
//     })
//     .catch(error => {
//         console.log(error);
//     });
