import * as chai from 'chai';
import * as https from 'https';
import * as http from 'http';
import * as ProxyAgent from 'proxy-agent';

import { getHttpAgent } from '_/main/getConsoleURL';
import { MinimalSessionDriver } from '_/main/types';
// seems a bit yick.  modifies Object.prototype
// is needed once, can be invoked more than once
chai.should();

const directSessionDriver: MinimalSessionDriver = {
    defaultSession: {
        resolveProxy: () => Promise.resolve('DIRECT'),
    },
};
const httpProxySessionDriver: MinimalSessionDriver = {
    defaultSession: {
        resolveProxy: () => Promise.resolve('PROXY http://example.com:3128;'),
    },
};
const httpsProxySessionDriver: MinimalSessionDriver = {
    defaultSession: {
        resolveProxy: () => Promise.resolve('PROXY https://example.com:3128;'),
    },
};

describe('Get HTTP Agent', () => {
    describe('Get HTTPS URL with no proxy', () => {
        it('should return an instance of https.Agent', async () => {
            const httpAgent = await getHttpAgent({
                url: 'https://example.com',
                sessionDriver: directSessionDriver,
            });
            httpAgent.should.be.an.instanceof(https.Agent);
        });
    });
    describe('Get HTTP URL with no proxy', () => {
        it('should return an instance of http.Agent', async () => {
            const httpAgent = await getHttpAgent({
                url: 'https://example.com',
                sessionDriver: directSessionDriver,
            });
            httpAgent.should.be.an.instanceof(http.Agent);
        });
    });
    describe('Get HTTPS URL with HTTP proxy', () => {
        it('should return an instance of ProxyAgent', async () => {
            const httpAgent = await getHttpAgent({
                url: 'https://example.com',
                sessionDriver: httpProxySessionDriver,
            });
            httpAgent.should.be.an.instanceof(ProxyAgent);
        });
    });
    describe('Get HTTPS URL with HTTPS proxy', () => {
        it('should return an instance of ProxyAgent', async () => {
            const httpAgent = await getHttpAgent({
                url: 'https://example.com',
                sessionDriver: httpsProxySessionDriver,
            });
            httpAgent.should.be.an.instanceof(ProxyAgent);
        });
    });
    describe('Get HTTP URL with HTTP proxy', () => {
        it('should return an instance of ProxyAgent', async () => {
            const httpAgent = await getHttpAgent({
                url: 'http://example.com',
                sessionDriver: httpProxySessionDriver,
            });
            httpAgent.should.be.an.instanceof(ProxyAgent);
        });
    });
    describe('Get HTTP URL with HTTPS proxy', () => {
        it('should return an instance of ProxyAgent', async () => {
            const httpAgent = await getHttpAgent({
                url: 'http://example.com',
                sessionDriver: httpsProxySessionDriver,
            });
            httpAgent.should.be.an.instanceof(ProxyAgent);
        });
    });
});
