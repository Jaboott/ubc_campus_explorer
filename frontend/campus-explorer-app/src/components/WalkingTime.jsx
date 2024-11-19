import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Declare libraries as a constant outside the component
const libraries = ['places'];

const WalkingTime = ({ selectedRooms }) => {
  const [routeResults, setRouteResults] = useState([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && Object.keys(selectedRooms).length > 1) {
      const roomEntries = Object.entries(selectedRooms); // Array of [roomName, roomData]
      calculateWalkingTimes(roomEntries);
    }
  }, [selectedRooms, isLoaded]);

  const calculateWalkingTimes = async (roomEntries) => {
    let results = [];
    const service = new google.maps.DistanceMatrixService();

    for (let i = 0; i < roomEntries.length - 1; i++) {
      const [originName, originData] = roomEntries[i];
      const [destinationName, destinationData] = roomEntries[i + 1];

      await new Promise((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [new google.maps.LatLng(originData.location.lat, originData.location.lng)],
            destinations: [new google.maps.LatLng(destinationData.location.lat, destinationData.location.lng)],
            travelMode: 'WALKING',
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (response, status) =>
            processResult({
              response,
              status,
              originName,
              destinationName,
              results,
              resolve,
              reject,
            })
        );
      });
    }

    setRouteResults(results);
    console.log('Route Results:', results);
  };

  const processResult = ({ response, status, originName, destinationName, results, resolve, reject }) => {
    if (status === 'OK') {
      const result = response.rows[0].elements[0];
      if (result.status === 'OK') {
        results.push({
          from: originName,
          to: destinationName,
          distance: result.distance.text,
          duration: result.duration.text,
        });
      }
      resolve();
    } else {
      console.error('Distance Matrix request failed due to:', status);
      reject(status);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Walking Time</h2>
      {Object.keys(selectedRooms).length > 1 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}> Routes:
          {routeResults.map((result, index) => (
            <li key={index}>
              📍 <strong>{result.from}</strong> ➡ <strong>{result.to}</strong>: {result.distance} in {result.duration}
            </li>
          ))}
        </ul>
      ) : (
        <p>Choose 2 or more rooms to estimate walking time</p>
      )}
    </div>
  );
};

export default WalkingTime;
