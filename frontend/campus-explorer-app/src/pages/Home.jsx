import React, { useState, useEffect } from "react";
import MapWithMarkers from "../components/MapWithMarkers";
import SearchBar from "../components/SearchBar";
import { getAllBuildingsQuery } from "../query/getAllBuildingsQuery";
import getBuildings from "../hooks/getBuildings";
import HomeInfoBox from "../components/HomeInfoBox";

function Home() {
	const [buildings, setbuildings] = useState([]);

	// fetch all buildings once when the page renders
	useEffect(() => {
		const fetchBuildings = async () => {
			try {
				const buildings = await getBuildings(getAllBuildingsQuery());
				setbuildings(buildings);
			} catch (err) {
				console.error("Error fetching buildings:", err);
			}
		};
		fetchBuildings();
	}, []);

	return (
		<div className="pt-4 d-flex flex-column gap-2">
			<div className="d-flex flex-row justify-content-between">
				<SearchBar setResults={setbuildings} />
				<button
					type="button"
					style={{
						color: "white",
						borderRadius: "8px",
						border: "none",
						background: "linear-gradient(180deg, #0c58b4, #97d4e9)",
					}}
				>
					✨ Find Nearest Building
				</button>
			</div>
			{buildings.length === 0 && (
				<div style={{ textAlign: "center", color: "red" }}>No buildings found. Please try again.</div>
			)}
			<div className="d-flex">
				<MapWithMarkers locations={buildings} />
				<HomeInfoBox/>
			</div>
		</div>
	);
}

export default Home;
