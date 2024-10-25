export default class Room {
    private readonly fullname: string;
    private readonly shortname: string;
    private readonly number: string;
    private readonly name: string;
    private readonly address: string;
    private readonly lat: number;
    private readonly lon: number;
    private readonly seats: number;
    private readonly type: string;
    private readonly furniture: string;
    private readonly href: string;
    
    public constructor(    
        fname: string,
        sname: string,
        number: string,
        name: string,
        address: string,
        lat: number,
        lon: number,
        seats: number,
        type: string,
        furniture: string,
        href: string
    ) {
        this.fullname = fname;
        this.shortname = sname;
        this.number = number;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.seats = seats;
        this.type = type;
        this.furniture = furniture;
        this.href = href;
    }

	// public htmToInstance() {
    //     // TODO
    //     return new Room(
            
    //     );
	// }

	 public instanceToObject(): object {
        return {
            fullname: this.fullname,
            shortname: this.shortname,
            number: this.number,
            name: this.name,
            address: this.address,
            lat: this.lat,
            lon: this.lon,
            seats: this.seats,
            type: this.type,
            furniture: this.furniture,
            href: this.href
        }
	 }
}
