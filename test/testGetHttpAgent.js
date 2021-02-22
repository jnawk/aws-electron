require("chai").should()
const https = require('https')
const http = require('http')
const ProxyAgent = require('proxy-agent')

const { getHttpAgent } = require("../getConsoleURL")

const directSessionDriver = {
  defaultSession: {
    resolveProxy: async url => "DIRECT"
  }
}
const httpProxySessionDriver = {
  defaultSession: {
    resolveProxy: async url => "PROXY http://example.com:3128;"
  }
}
const httpsProxySessionDriver = {
  defaultSession: {
    resolveProxy: async url => "PROXY https://example.com:3128;"
  }
}

describe("Get HTTP Agent", function () {
    describe("Get HTTPS URL with no proxy", function () {
        it("should return an instance of https.Agent", async function () {
            const httpAgent = await getHttpAgent({
              url: 'https://example.com',
              sessionDriver: directSessionDriver
            })
            httpAgent.should.be.an.instanceof(https.Agent)
        })
    })
    describe("Get HTTP URL with no proxy", function () {
        it("should return an instance of http.Agent", async function () {
            const httpAgent = await getHttpAgent({
              url: 'https://example.com',
              sessionDriver: directSessionDriver
            })
            httpAgent.should.be.an.instanceof(http.Agent)
        })
    })
    describe("Get HTTPS URL with HTTP proxy", function () {
        it("should return an instance of ProxyAgent", async function () {
            const httpAgent = await getHttpAgent({
              url: 'https://example.com',
              sessionDriver: httpProxySessionDriver
            })
            httpAgent.should.be.an.instanceof(ProxyAgent)
        })
    })
    describe("Get HTTPS URL with HTTPS proxy", function () {
        it("should return an instance of ProxyAgent", async function () {
            const httpAgent = await getHttpAgent({
              url: 'https://example.com',
              sessionDriver: httpsProxySessionDriver
            })
            httpAgent.should.be.an.instanceof(ProxyAgent)
        })
    })
    describe("Get HTTP URL with HTTP proxy", function () {
        it("should return an instance of ProxyAgent", async function () {
            const httpAgent = await getHttpAgent({
              url: 'http://example.com',
              sessionDriver: httpProxySessionDriver
            })
            httpAgent.should.be.an.instanceof(ProxyAgent)
        })
    })
    describe("Get HTTP URL with HTTPS proxy", function () {
        it("should return an instance of ProxyAgent", async function () {
            const httpAgent = await getHttpAgent({
              url: 'http://example.com',
              sessionDriver: httpsProxySessionDriver
            })
            httpAgent.should.be.an.instanceof(ProxyAgent)
        })
    })
})
