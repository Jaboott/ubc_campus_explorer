export const getAllBuildingsQuery = () => {
    return {
      query: {
        WHERE: {},
        OPTIONS: {
          COLUMNS: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon"
          ]
        },
        TRANSFORMATIONS: {
          GROUP: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon"
          ],
          APPLY: []
        }
      }
    };
  };
  