export default class Building {
	private readonly fullname: string;
	private readonly shortname: string;
	private readonly address: string;
	private readonly lat: number;
	private readonly lon: number;
	private readonly href: string;

	constructor(fullname: string, shortname: string, address: string, lat: number, lon: number, href: string) {
		this.fullname = fullname;
		this.shortname = shortname;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.href = href;
	}
}
