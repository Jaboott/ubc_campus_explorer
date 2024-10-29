export default class Building {
	private readonly _fullname: string;
	private readonly _shortname: string;
	private readonly _address: string;
	private readonly _lat: number;
	private readonly _lon: number;
	private readonly _buildingHref: string;

	constructor(fullname: string, shortname: string, address: string, lat: number, lon: number, href: string) {
		this._fullname = fullname;
		this._shortname = shortname;
		this._address = address;
		this._lat = lat;
		this._lon = lon;
		this._buildingHref = href;
	}

	public get fullname(): string {
		return this._fullname;
	}

	public get shortname(): string {
		return this._shortname;
	}

	public get address(): string {
		return this._address;
	}

	public get lat(): number {
		return this._lat;
	}

	public get lon(): number {
		return this._lon;
	}

	public get buildingHref(): string {
		return this._buildingHref;
	}
}
