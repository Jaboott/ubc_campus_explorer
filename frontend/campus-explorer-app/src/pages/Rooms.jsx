import React, { useState } from "react";
import AllRooms from "../components/AllRooms";
import WalkingTime from "../components/WalkingTime";

function Rooms() {
	const [selectedRooms, setSelectedRooms] = useState({});

	return (
		<div className="d-flex justify-content-between mt-4">
			<div className="card rounded w-50 m-1" style={{ border: "none" }}>
				<AllRooms selectedRooms={selectedRooms} setSelectedRooms={setSelectedRooms} />
			</div>
			<div className="card rounded w-50 m-1 text-white" style={{border: "none", background: "linear-gradient(180deg, #0c58b4, #97d4e9)" }}>
				<WalkingTime selectedRooms={selectedRooms} />
			</div>
		</div>
	);
}

export default Rooms;
