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
import MfaCache from "./MfaCache.jsx"


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
            <Route exact path="/mfaCache">
                <MfaCache/>
            </Route>
        </Switch>
    </Router>
)

render(app, document.getElementById("app"))
