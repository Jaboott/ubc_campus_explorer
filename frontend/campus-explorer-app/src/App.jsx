import "./App.css";
import React from "react";
// import { APIProvider, Map, AdvancedMarker, MapCameraChangedEvent, Pin } from "@vis.gl/react-google-maps";

import Navbar from "./components/Navbar";
import MapWithMarkers from "./components/MapWithMarkers";
// import { Router } from "express";
// import Home from "./pages/Home";

function App() {
	return (
		<>
			<Navbar />
			<MapWithMarkers />
			{/* <Router>
				<Routes>
					<Route exact path="/" element={<Home />} />
				</Routes>
			</Router> */}
		</>
	);
}

export default App;
