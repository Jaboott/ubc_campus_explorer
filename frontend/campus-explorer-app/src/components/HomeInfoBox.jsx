import React from "react";
import loadingGif from "../assets/loading.gif";

function HomeInfoBox({ nearest, isLoading }) {
	const WelcomeText =
		"Welcome to UBC Campus Explorer! To get started, click Find Nearest Building, search for a building using the search bar, or view all rooms in the Rooms tab";
	const nearestRoom = "AMS Nest | 800 West Mall, Vancouver";

	return (
		<div
			className="card m-1 d-flex align-items-center justify-content-center"
			style={{
				color: "#0C58B4",
				width: "70vw",
				height: "70vh",
				border: "5px solid #0C58B4",
				backgroundColor: "transparent", 
				borderRadius: "4px",
			}}
		>
			<div className="p-3 text-center">
				{isLoading ? (
					<div>
						<img
							src={loadingGif}
							alt="Loading..."
							style={{ width: "70px", height: "50px" }}
						/>
						Locating...
					</div>
				) : nearest && Object.keys(nearest).length === 0 ? (
					WelcomeText
				) : (
                        <>
                        <div>The closest building to you is</div>
                        <div><strong>{nearest.fullname} ({nearest.shortname}) | 📍{nearest.address}</strong></div>
                        <div className="tip">Tip: try searching the building code in the search bar!</div>
                        </>
				)}
			</div>
		</div>
	);
}

export default HomeInfoBox;
