function HomeInfoBox() {
	const showWelcomeText = true;
	const WelcomeText = "To get started, click Find Nearest Building, or search for a building using the search bar";
	const nearestRoom = "AMS Nest | 800 West Mall, Vancouver";

	return (
        <div
			className="card m-1 d-flex align-items-center justify-content-center"
			style={{
                color: "#0C58B4",
				width: "70vw",
				height: "70vh",
				border: "5px solid #0C58B4", // Blue border (you can customize the color)
				backgroundColor: "transparent", // Remove the background color
				borderRadius: "8px", // Optional: Rounds the corners of the border
			}}
		>
			<div className="p-3">{showWelcomeText ? WelcomeText : nearestRoom}</div>
		</div>
	);
}

export default HomeInfoBox;
