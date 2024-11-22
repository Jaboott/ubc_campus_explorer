import React, { useState, useEffect } from "react";
import MapWithMarkers from "../components/MapWithMarkers";
import SearchBar from "../components/SearchBar";
import { getAllBuildingsQuery } from "../query/getAllBuildingsQuery";
import getBuildings from "../hooks/getBuildings";
import HomeInfoBox from "../components/HomeInfoBox";

function Home() {
	const [buildings, setbuildings] = useState([]);
	const [nearestBuilding, setNearest] = useState({});
	const [isLoading, setIsLoading] = useState(false);

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

	const handleOnClick = () => {
		if (navigator.geolocation) {
			setIsLoading(true);
			navigator.geolocation.getCurrentPosition(computerNearestBuilding);
		}
	}

	const computerNearestBuilding = (position) => {
		const lon = position.coords.longitude;
		const lat = position.coords.latitude;

		let nearestBuilding = null;
		let shortestDistance = Infinity;

		for (const building of buildings) {
			const buildingLon = building.location.lng;
			const buildingLat = building.location.lat;
			const distance = Math.sqrt(
				Math.pow(buildingLat - lat, 2) + Math.pow(buildingLon - lon, 2)
			);

			if (distance < shortestDistance) {
				shortestDistance = distance;
				nearestBuilding = building;
			}
		}
		console.log(nearestBuilding);
		setNearest(nearestBuilding);
		setIsLoading(false);
	}

	return (
		<div className="pt-4 d-flex flex-column gap-2">
			<div className="d-flex flex-row justify-content-between mx-1">
				<SearchBar setResults={setbuildings} />
				<button
					type="button"
					style={{
						color: "white",
						borderRadius: "8px",
						border: "none",
						background: "linear-gradient(180deg, #0c58b4, #97d4e9)",
					}}
					onClick = {handleOnClick}
				>
					✨ Find Nearest Building
				</button>
			</div>
			{buildings.length === 0 && (
				<div style={{ textAlign: "center", color: "red" }}>No buildings found. Please try again.</div>
			)}
			<div className="d-flex">
				<MapWithMarkers locations={buildings} />
				<HomeInfoBox nearest={nearestBuilding} isLoading={isLoading}/>
			</div>
		</div>
	);
}

export default Home;
