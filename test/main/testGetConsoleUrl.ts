import * as chai from 'chai';
import * as path from 'path';

import { getProfileList, getAWSConfig } from '_/main/AWSConfigReader';

import { expect } from 'chai';

// seems a bit yick.  modifies Object.prototype
// is needed once, can be invoked more than once
chai.should();

const awsConfigFile1 = path.join(__dirname, 'awsConfig1');

describe('Get Profile List', () => {
    describe('when determining the profile list for a profile that does not assume a role', () => {
        it('should return just the single profile', () => {
            const config = getAWSConfig(awsConfigFile1).awsConfig;
            const profileList = getProfileList(config, 'default');
            profileList.should.have.length(1);
            profileList.should.contain('default');
        });
    });

    describe('Get a regular cross account profile', () => {
        it('should return the target and credentials profiles', () => {
            const config = getAWSConfig(awsConfigFile1).awsConfig;
            const profileList = getProfileList(config, 'notdefault');
            profileList.should.have.length(2);
            profileList[0].should.equal('default');
            profileList[1].should.equal('notdefault');
        });
    });

    describe('Get a multi-stage cross account profile', () => {
        it('should return the target, intermediate, and credentials profiles', () => {
            const config = getAWSConfig(awsConfigFile1).awsConfig;
            const profileList = getProfileList(config, 'target');
            profileList.should.have.length(3);
            profileList[0].should.equal('default');
            profileList[1].should.equal('intermediate');
            profileList[2].should.equal('target');
        });
    });

    describe('Get a multi-stage cross account profile with a loop', () => {
        it('should throw an exception', () => {
            const config = getAWSConfig(awsConfigFile1).awsConfig;
            expect(() => getProfileList(config, 'loopStart')).to.throw(Error);
        });
    });
});
