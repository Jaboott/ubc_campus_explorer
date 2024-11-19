import React, { useState } from "react";
import AllRooms from "../components/AllRooms";
import WalkingTime from "../components/WalkingTime";

function Rooms() {
	const [selectedRooms, setSelectedRooms] = useState({});

	return (
		<div className="d-flex justify-content-between">
			<div className="card rounded w-50 m-1">
				<AllRooms selectedRooms={selectedRooms} setSelectedRooms={setSelectedRooms} />
			</div>
			<div className="card rounded w-50 m-1">
				<WalkingTime selectedRooms={selectedRooms} />
			</div>
		</div>
	);
}

export default Rooms;
