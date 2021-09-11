import React from "react"
import { render } from "react-dom"
import {
    HashRouter as Router,
    Switch,
    Route
} from "react-router-dom"

import "bootstrap/dist/css/bootstrap.css"

import AWSConsole from "./AWSConsole.jsx"
import Settings from "./Settings.jsx"
import KeyRotation from "./KeyRotation.jsx"


const app = (
    <Router>
        <Switch>
            <Route exact path="/">
                <AWSConsole/>
            </Route>
            <Route exact path="/settings">
                <Settings/>
            </Route>
            <Route exact path="/keyRotation">
                <KeyRotation/>
            </Route>
        </Switch>
    </Router>
)

render(app, document.getElementById("app"))
