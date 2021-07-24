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


const app = (
    <Router>
        <Switch>
            <Route exact path="/">
                <AWSConsole/>
            </Route>
        </Switch>
    </Router>
)

render(app, document.getElementById("app"))
