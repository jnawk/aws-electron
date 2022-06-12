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
  useParams,
} from 'react-router-dom';

import AWSConsole from './AWSConsole';
import KeyRotation from './KeyRotation';
import MfaCache from './MfaCache';
import Settings from './Settings';
import Tabs from './Tabs';

function ConsoleWindow() {
  const { profile } = useParams();
  if (profile) {
    return (<Tabs profile={profile} />);
  }
  return null;
}

const app = (
  <Router>
    <Routes>
      <Route path="/" element={<AWSConsole /> as React.ReactNode} />
      <Route path="/settings" element={<Settings /> as React.ReactNode} />
      <Route path="/keyRotation" element={<KeyRotation /> as React.ReactNode} />
      <Route path="/mfaCache" element={<MfaCache /> as React.ReactNode} />
      <Route path="/tabs/:profile" element={<ConsoleWindow />} />
    </Routes>
  </Router>
) as React.ReactElement;

ReactDOM.render(
  app,
  document.getElementById('app'),
);
