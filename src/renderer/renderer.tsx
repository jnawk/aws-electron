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
  Routes,
} from 'react-router-dom';

import AWSConsole from './AWSConsole';
import KeyRotation from './KeyRotation';
import MfaCache from './MfaCache';
import Settings from './Settings';

const app = (
  <Router>
    <Routes>
      <Route path="/" element={<AWSConsole />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/keyRotation" element={<KeyRotation />} />
      <Route path="/mfaCache" element={<MfaCache />} />
    </Routes>
  </Router>
);

ReactDOM.render(
  app,
  document.getElementById('app'),
);
