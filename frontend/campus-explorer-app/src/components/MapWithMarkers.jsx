import React, { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";

// https://visgl.github.io/react-google-maps/docs/get-started
function MapWithMarkers({ locations }) {
	const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const mapID = "eb2d36cf0095db5e";

	return (
		<div className="d-flex justify-content-center m-1">
			<APIProvider apiKey={mapsApiKey}>
				<Map
					style={{ width: "50vw", height: "70vh" }}
					defaultCenter={{ lat: 49.26115791687482, lng: -123.24602244318108 }} // UBC: 49.26115791687482, -123.24602244318108
					defaultZoom={14}
					gestureHandling={"greedy"}
					mapId={mapID}
				>
					<PoiMarkers pois={locations} />
				</Map>
			</APIProvider>
		</div>
	);
}

// https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js#0
// click on a marker to show name and address
const PoiMarkers = ({ pois }) => {
	const [selectedPoi, setSelectedPoi] = useState(null);

	const handleMarkerClick = (poi) => {
		setSelectedPoi(poi);
	};

	return (
		<>
			{pois.map((poi, index) => (
				<AdvancedMarker key={index} position={poi.location} onClick={() => handleMarkerClick(poi)}>
					<Pin background={"#0C58B4"} glyphColor={"#FFFFFF"} borderColor={"#FFFFFF"} />
				</AdvancedMarker>
			))}

			{selectedPoi && (
				<InfoWindow
					position={selectedPoi.location}
					onCloseClick={() => setSelectedPoi(null)}
					shouldFocus={true}
					headerContent={selectedPoi.fullname}
					content={selectedPoi.address}
				/>
			)}
		</>
	);
};

export default MapWithMarkers;
