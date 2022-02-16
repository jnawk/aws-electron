/**
 * React renderer.
 */
// Import the styles here to process them with webpack
// import '_public/style.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Route,
  HashRouter as Router,
  Switch,
} from 'react-router-dom';

import AWSConsole from './AWSConsole';
import KeyRotation from './KeyRotation';
import MfaCache from './MfaCache';
import Settings from './Settings';

const app = (
  <Router>
    <Switch>
      <Route exact path="/">
        <AWSConsole />
      </Route>
      <Route exact path="/settings">
        <Settings />
      </Route>
      <Route exact path="/keyRotation">
        <KeyRotation />
      </Route>
      <Route exact path="/mfaCache">
        <MfaCache />
      </Route>
    </Switch>
  </Router>
);

ReactDOM.render(
  app,
  document.getElementById('app'),
);
