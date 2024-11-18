const getBuildings = async (query) => {
    try {
      const response = await fetch("http://localhost:4321/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch buildings');
      }
  
      const data = await response.json();
  
      if (data.result) {
        return data.result.map((item) => ({
          shortname: item.rooms_shortname,
          fullname: item.rooms_fullname,
          location: { lat: item.rooms_lat, lng: item.rooms_lon },
        }));
      }
    } catch (err) {
      console.log("error:", err.message);
      return [];
    }
  };
  
  export default getBuildings;
  