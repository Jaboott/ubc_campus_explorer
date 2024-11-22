export const getAllBuildingsQuery = () => {
    return {
      query: {
        WHERE: {},
        OPTIONS: {
          COLUMNS: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon",
            "rooms_address"
          ]
        },
        TRANSFORMATIONS: {
          GROUP: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon",
            "rooms_address"
          ],
          APPLY: []
        }
      }
    };
  };
  