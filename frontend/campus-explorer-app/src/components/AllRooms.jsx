import React, { useState, useEffect } from "react";
import SortButton from "./SortButton";
import getRoomQuery from "../query/getRoomQuery";
import FilterButton from "./FilterButton";
import { Chip } from "@mui/material";

const AllRooms = ({ selectedRooms, setSelectedRooms }) => {
	const [rooms, setRooms] = useState([]);
	const [order, setOrder] = useState("");
	const [filter, setFilter] = useState("");

	// rearrange the room list when the order changes
	useEffect(() => {
		const allRoomsQuery = getRoomQuery(order);

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
						type: item.rooms_type,
						furniture: item.rooms_furniture,
					}));
					setRooms(roomData);
				}
			})
			.catch((err) => {
				console.log("error:", err.message);
			});
	}, [order]);

	useEffect(() => {
		console.log("FILTER SELECTED: ", filter);
		if (filter === "Min Seats") {
			const minSeats = prompt("Enter minimum number of seats: ");
			if (minSeats !== null) {
				console.log("MIN: ", minSeats);
			}
		}

		if (filter === "Max Seats") {
			const maxSeats = prompt("Enter maximum number of seats: ");
			if (maxSeats !== null) {
				console.log("MAX: ", maxSeats);
			}
		}
	}, [filter]);

	const handleCheckboxChange = (room) => {
		setSelectedRooms((prevSelected) => {
			const updatedSelected = { ...prevSelected };
			updatedSelected[room.identifier]
				? delete updatedSelected[room.identifier]
				: (updatedSelected[room.identifier] = room);
			return updatedSelected;
		});
	};

	return (
		<div>
			<div className="d-flex justify-content-between" style={{ padding: "20px" }}>
				<h2 className="text-center">All Rooms</h2>
				<FilterButton filter={filter} setFilter={setFilter} />
				<SortButton order={order} setOrder={setOrder} />
			</div>
			<div
				className="p-3 d-flex flex-wrap justify-content-center"
				style={{
					maxHeight: "70vh",
					overflowY: "auto",
				}}
			>
				{rooms.map((room) => (
					<div key={room.identifier} className="d-flex align-items-center gap-2">
						<input
							type="checkbox"
							className="form-check-input text-primary"
							id={`checkbox-${room.identifier}`}
							checked={!!selectedRooms[room.identifier]}
							onChange={() => handleCheckboxChange(room)}
						/>
						<div className="card m-2 p-2" style={{ width: "400px", display: "block" }}>
							<h5 className="card-title">{`${room.identifier}`}</h5>
							<p className="card-text">{room.fullname} | 📍{room.address}</p>
							<p className="card-text">
								<strong>Seats:</strong> {room.seats}
							</p>
							<Chip
								label={room.type}
								color="primary"
								variant="outlined"
								sx={{
									mx: "5px", 
									mb: 1,
								}}
							/>
							<Chip
								label={room.furniture}
								color="secondary"
								variant="outlined"
								sx={{
									mx: "5px", 
									mb: 1,
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default AllRooms;
