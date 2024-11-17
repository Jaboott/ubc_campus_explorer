import React, { useState, useEffect } from "react";

const AllRooms = ({ selectedRooms, setSelectedRooms }) => {
	const [rooms, setRooms] = useState([]);

	useEffect(() => {
		const allRoomsQuery = {
			query: {
				WHERE: {},
				OPTIONS: {
					COLUMNS: [
						"rooms_shortname",
						"rooms_fullname",
						"rooms_lat",
						"rooms_lon",
						"rooms_number",
						"rooms_address",
						"rooms_seats",
					],
					ORDER: "rooms_shortname",
				},
				TRANSFORMATIONS: {
					GROUP: [
						"rooms_shortname",
						"rooms_fullname",
						"rooms_lat",
						"rooms_lon",
						"rooms_number",
						"rooms_address",
						"rooms_seats",
					],
					APPLY: [],
				},
			},
		};

		fetch("http://localhost:4321/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(allRoomsQuery),
		})
			.then((response) => {
				if (response.ok) {
					return response.json();
				}
			})
			.then((data) => {
				if (data.result) {
					const roomData = data.result.map((item) => ({
						identifier: item.rooms_shortname + item.rooms_number, // using shortname room number as the unique identifier
						fullname: item.rooms_fullname,
						address: item.rooms_address,
						seats: item.rooms_seats,
						location: { lat: item.rooms_lat, lng: item.rooms_lon },
					}));
					setRooms(roomData);
				}
			})
			.catch((err) => {
				console.log("error:", err.message);
			});
	}, []);

	const handleCheckboxChange = (room) => {
		setSelectedRooms((prevSelected) => {
			const updatedSelected = { ...prevSelected };

			if (updatedSelected[room.identifier]) {
				delete updatedSelected[room.identifier];
			} else {
				updatedSelected[room.identifier] = room;
			}
			return updatedSelected;
		});
	};

	return (
		<div>
			<h2 className="text-center">All Rooms</h2>
			<div
				className="p-3 d-flex flex-wrap justify-content-center"
				style={{
					maxHeight: "500px",
					overflowY: "auto",
				}}
			>
				{rooms.map((room) => (
					<div key={room.identifier} className="d-flex align-items-center gap-2">
						<input
							type="checkbox"
							id={`checkbox-${room.identifier}`}
							checked={!!selectedRooms[room.identifier]}
							onChange={() => handleCheckboxChange(room)}
						/>
						<div className="card m-2 p-2" style={{ width: "400px" }}>
							<h5 className="card-title">{`${room.identifier}`}</h5>
							<p className="card-text">{room.fullname}</p>
							<p className="card-text">
								<strong>Address:</strong> {room.address}
							</p>
							<p className="card-text">
								<strong>Seats:</strong> {room.seats}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default AllRooms;
