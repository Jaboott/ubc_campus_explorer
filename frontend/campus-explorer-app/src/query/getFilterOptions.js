const getFilterOptions = (type) => {
	const base_filter = "rooms_" + type;

	return {
		WHERE: {},
		OPTIONS: {
			COLUMNS: [
				base_filter
			]
		},
		TRANSFORMATIONS: {
			GROUP: [
				base_filter
			],
			APPLY: []
		}
	}
}
