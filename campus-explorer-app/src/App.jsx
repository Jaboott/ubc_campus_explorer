import "./App.css";
import React from "react";
// import { APIProvider, Map, AdvancedMarker, MapCameraChangedEvent, Pin } from "@vis.gl/react-google-maps";

import Navbar from "./components/Navbar";
import MapWithMarkers from "./components/MapWithMarkers";

function App() {
	return (
		<>
			<Navbar/>
      <MapWithMarkers/>
		</>
	);
}

export default App;
