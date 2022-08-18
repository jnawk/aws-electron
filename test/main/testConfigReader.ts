import * as chai from 'chai';
import * as path from 'path';
import React from 'react';
import { LaunchButton } from '_/main/types';

import {
    getAWSConfig,
    getUsableProfiles,
    getProfileList,
} from '_main/AWSConfigReader';

import { profileRows } from '_renderer/getRoleData';

// seems a bit yick.  modifies Object.prototype
// is needed once, can be invoked more than once
const should = chai.should();

import { expect } from 'chai';

const awsConfigFile1 = path.join(__dirname, 'awsConfig1');
const awsConfigFile2 = path.join(__dirname, 'awsConfig2');
const vaultConfigFile = path.join(__dirname, 'vaultConfig');
const aws2faConfig = path.join(__dirname, 'aws2faConfig');
const aws2faCredentials = path.join(__dirname, 'aws2faCredentials');

describe('AWS Config Reader', () => {
    describe('Get Config - reading a canonical AWS config', () => {
        it('should return an object with an awsConfig', () => {
            const config = getAWSConfig(awsConfigFile1);
            config.should.have.property('awsConfig');
        });

        it('should return an object with the default profile', () => {
            const config = getAWSConfig(awsConfigFile1);
            expect(config.awsConfig).to.have.property('default');
            expect(config.awsConfig.default).to.have.property('region', 'ap-southeast-2');
        });

        it('should return an object with the notdefault profile', () => {
            const config = getAWSConfig(awsConfigFile1);
            expect(config.awsConfig).to.have.property('notdefault');
            expect(config.awsConfig.notdefault).to.have.property('role_arn');
            expect(config.awsConfig.notdefault).to.have.property('source_profile', 'default');
        });

        it('should return an object which does not contain commented out profiles', () => {
            const config = getAWSConfig(awsConfigFile1);
            expect(config.awsConfig).to.not.have.property('ghostprofile');
        });

        it('should not have a vaultConfig property', () => {
            const config1 = getAWSConfig(awsConfigFile1);
            config1.should.not.have.property('vaultConfig');

            const config2 = getAWSConfig(awsConfigFile2);
            config2.should.not.have.property('vaultConfig');
        });
    });

    describe('Get Config, reading a Vault(v4)-style config', () => {
        it('should return an object with a vaultConfig property', () => {
            const config = getAWSConfig(vaultConfigFile);
            config.should.have.property('vaultConfig');
        });

        it('should return an object with the notdefault profile,\n\t  which inherits new properties from its source_profile', () => {
            const config = getAWSConfig(vaultConfigFile);
            should.exist(config.vaultConfig);
            config.vaultConfig?.should.have.property('notdefault');
            config.vaultConfig?.notdefault.should.have.property('role_arn');
            config.vaultConfig?.notdefault.should.have.property('source_profile', 'default');
            config.vaultConfig?.notdefault.should.have.property('mfa_serial', 'arn:aws:iam::123456789012:mfa/defaultUsername');
        });

        it('should return an object with the leavemymfaalone profile,\n\t  which does not inherit existing properties from its source_profile', () => {
            const config = getAWSConfig(vaultConfigFile);
            should.exist(config.vaultConfig);
            config.vaultConfig?.should.have.property('leavemymfaalone');
            config.vaultConfig?.leavemymfaalone.should.have.property('role_arn');
            config.vaultConfig?.leavemymfaalone.should.have.property('source_profile', 'default');
            config.vaultConfig?.leavemymfaalone.should.have.property('mfa_serial', 'arn:aws:iam::123456789012:mfa/notDefaultUsername');
        });

        it('should return an awsConfig without enriched profiles', () => {
            const config = getAWSConfig(vaultConfigFile);
            expect(config.awsConfig.notdefault).to.not.have.property('mfa_serial');
        });
    });

    describe('Reading AWS2FA config', () => {
        it('should not blow up', () => {
            const config = getAWSConfig(aws2faConfig);
            const usableProfiles = getUsableProfiles({
                config: config.awsConfig,
                credentialsProfiles: config.credentialsProfiles,
            });
            profileRows({
                usableProfiles,
                config: config.awsConfig,
                configType: 'awsConfig',
                mfaCode: '',
                expiredCredentialsProfiles: [],
                clearMfaCode: () => null,
                launchConsole: () => null as unknown as Promise<void>,
                onSuccess: () => null,
                onError: () => null,
                launchButtonGenerator: () => null as unknown as LaunchButton,
                profileRowGenerator: () => null as unknown as React.ReactElement<unknown, string>,
            });
        });
        it('should not return profiles which do not assume roles', () => {
            const config = getAWSConfig(aws2faConfig, aws2faCredentials);
            const usableProfiles = getUsableProfiles({
                config: config.awsConfig,
                credentialsProfiles: config.credentialsProfiles,
            });
            expect(usableProfiles).to.contain('role');
            expect(usableProfiles).to.contain('chained');
        });
        it('should return the correct profile list', () => {
            const config = getAWSConfig(aws2faConfig, aws2faCredentials);
            const profileList = getProfileList(config.awsConfig, 'chained');
            expect(profileList.length).to.equal(3);
            expect(profileList).to.contain('chained');
            expect(profileList).to.contain('role');
            expect(profileList).to.contain('identity');
        });
    });
});
