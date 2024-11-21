import navbarLogo from "../assets/navbar_logo.png";
import { Link, useLocation } from "react-router-dom";

// reference: https://getbootstrap.com/docs/4.0/components/navbar/
function Navbar() {
	const location = useLocation(); // Get the current location
	const currentPath = location.pathname;
	console.log("PATH: ", currentPath);

	return (
		<nav className="navbar navbar-expand-lg">
			<div className="container-fluid">
				<a className="navbar-brand" href="/">
					<img src={navbarLogo} alt="Logo" width="24" height="24" className="d-inline-block align-text-top" />
					UBC Campus Explorer
				</a>{" "}
				<button
					className="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#navbarNav"
					aria-controls="navbarNav"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse justify-content-end" id="navbarNav">
					<ul className="navbar-nav">
						<li className={`nav-item mx-1 ${currentPath === "/" ? "activePage" : ""}`}>
							<a className="nav-link" href="/">
								Home
							</a>
						</li>
						{/* <li class="nav-item">
							<a class="nav-link" href="#">
								Buildings
							</a>
						</li> */}
						<li className={`nav-item mx-1 ${currentPath === "/rooms" ? "activePage" : ""}`}>
							<a className="nav-link" href="/rooms">
								Rooms
							</a>
						</li>
					</ul>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
