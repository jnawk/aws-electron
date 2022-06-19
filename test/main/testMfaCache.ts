import * as chai from 'chai';

import {
    getAWSConfig,
    getCachableProfiles,
} from '_main/AWSConfigReader';
// seems a bit yick.  modifies Object.prototype
// is needed once, can be invoked more than once
chai.should();

describe('MFA Cache', () => {
    describe('Listing profiles that could have MFA attached', () => {
        it('should return profiles that have an MFA device and long term credentials', () => {
            const config = getCachableProfiles({ config: getAWSConfig(`${__dirname}/aws2faConfig`, `${__dirname}/aws2faCredentials`) });
            config.awsConfig.should.have.property('identity');
        });
        it('should not return profiles that are assuming a role, have an MFA device, and long term credentials', () => {
            const config = getCachableProfiles({ config: getAWSConfig(`${__dirname}/aws2faConfig`, `${__dirname}/aws2faCredentials`) });
            config.awsConfig.should.not.have.property('nomfacache');
        });
    });
});
