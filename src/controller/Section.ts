export default class Section {
	private readonly uuid: string; // section identifier
	private readonly id: string; // course ID number
	private readonly title: string;
	private readonly instructor: string;
	private readonly dept: string;
	private readonly year: number;
	private readonly avg: number;
	private readonly pass: number;
	private readonly fail: number;
	private readonly audit: number;

	public constructor(
		uuid: string,
		id: string,
		title: string,
		instructor: string,
		dept: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}

	// can use this when saving instances onto disk
	public instanceToObject(): object {
		return {
			uuid: this.uuid,
			id: this.id,
			title: this.title,
			instructor: this.instructor,
			dept: this.dept,
			year: this.year,
			avg: this.avg,
			pass: this.pass,
			fail: this.fail,
			audit: this.audit,
		};
	}

	// can use this when converting object to an instance when querying
	public static objectToInstance(obj: any): Section {
		return new Section(
			obj.id,
			obj.Course,
			obj.Title,
			obj.Professor,
			obj.Subject,
			obj.Avg,
			obj.Year,
			obj.Pass,
			obj.Fail,
			obj.Audit
		);
	}
}
