import * as chai from 'chai';

import { timeRemainingMessage } from '_/main/timeRemaining';

// seems a bit yick.  modifies Object.prototype
// is needed once, can be invoked more than once
chai.should();

describe('Time Remaining display', () => {
    describe('With hours, minutes, and seconds left', () => {
        it('should return a string with hours and minutes and seconds', () => {
            const message = timeRemainingMessage(3661000); // 1h 1m 1s
            message.should.equal('Time remaining: 1 hours, 1 minutes, 1 seconds');
        });
    });
    describe('With hours, minutes, but no seconds left', () => {
        it('should return a string with hours and minutes', () => {
            const message = timeRemainingMessage(3660000); // 1h 1m 0s
            message.should.equal('Time remaining: 1 hours, 1 minutes, 0 seconds');
        });
    });
    describe('With hours, no minutes, and some seconds left', () => {
        it('should return a string with hours and seconds', () => {
            const message = timeRemainingMessage(3601000); // 1h 0m 1s
            message.should.equal('Time remaining: 1 hours, 1 seconds');
        });
    });
    describe('With exactly an hour left', () => {
        it('should return a string with hours only', () => {
            const message = timeRemainingMessage(3600000); // 1h 0m 0s
            message.should.equal('Time remaining: 1 hours, 0 seconds');
        });
    });
    describe('With less than an hour, but more than a minute left', () => {
        it('should return a string with minutes and seconds', () => {
            const message = timeRemainingMessage(61000); // 0h 1m 1s
            message.should.equal('Time remaining: 1 minutes, 1 seconds');
        });
    });
    describe('With exactly a minute left', () => {
        it('should return a string with minutes only', () => {
            const message = timeRemainingMessage(60000); // 0h 1m 0s
            message.should.equal('Time remaining: 1 minutes, 0 seconds');
        });
    });
    describe('With less than a minute left', () => {
        it('should return a string with seconds only', () => {
            const message = timeRemainingMessage(1000); // 0h 0m 1s
            message.should.equal('Time remaining: 1 seconds');
        });
    });
});
