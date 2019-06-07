import React from 'react';
import {render} from 'react-dom';
import AWSConsole from './AWSConsole.jsx';
import 'bootstrap/dist/css/bootstrap.css';

const awsconsole = (
    <AWSConsole/>
);
render(awsconsole, document.getElementById('awsconsole'));
