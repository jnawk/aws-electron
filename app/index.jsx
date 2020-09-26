import React from 'react';
import {render} from 'react-dom';
import AWSConsole from './AWSConsole.jsx';
import 'bootstrap/dist/css/bootstrap.css';
import {
    HashRouter as Router,
    Switch,
    Route
} from "react-router-dom"

const app = (
  <Router>
    <Switch>
      <Route exact path="/">
        <AWSConsole/>
      </Route>
    </Switch>
  </Router>
);

render(app, document.getElementById('app'));
