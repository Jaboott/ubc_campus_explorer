import { useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import React from "react";
import { createRoot } from "react-dom/client";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

function App() {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	return (
		<>
			<Navbar/>
			<div className="d-flex justify-content-center">
      <APIProvider apiKey={mapsApiKey}>
				<Map
					style={{ width: "50vw", height: "50vh" }}
					defaultCenter={{ lat: 49.26115791687482, lng: -123.24602244318108 }} // UBC: 49.26115791687482, -123.24602244318108
					defaultZoom={14}
					gestureHandling={"greedy"}
					disableDefaultUI={true}
				/>
			</APIProvider>
      </div>
		</>
	);
}

export default App;
