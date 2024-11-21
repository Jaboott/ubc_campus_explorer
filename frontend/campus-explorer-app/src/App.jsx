import "./App.css";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";

function App() {
	return (
		<>
			<Router>
			<Navbar />
				<Routes>
					<Route exact path="/" element={<Home />} />
					<Route path="/rooms" element={<Rooms />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;
