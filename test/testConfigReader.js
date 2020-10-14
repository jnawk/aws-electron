require("chai").should()

const path = require("path")

const { getAWSConfig, isLikelyVaultV4Config } = require("../AWSConfigReader")

describe("AWS Config Reader", function () {
    describe("Get Config", function () {
        it("should return an object with the default profile", function () {
            const configFile = path.join(__dirname, "awsConfig")
            const config = getAWSConfig(configFile)
            config.should.have.property("default")
            config.default.should.have.property("region", "ap-southeast-2")
        })
        it("should return an object with the notdefault profile", function () {
            const configFile = path.join(__dirname, "awsConfig")
            const config = getAWSConfig(configFile)
            config.should.have.property("notdefault")
            config.notdefault.should.have.property("role_arn")
            config.notdefault.should.have.property("source_profile", "default")
        })
        it("should return an object which does not contain commented out profiles", function () {
            const configFile = path.join(__dirname, "awsConfig")
            const config = getAWSConfig(configFile)
            config.should.not.have.property("ghostprofile")
        })
        it("should indicate the config is not likely to be a v4 vault config", function() {
            const configFile = path.join(__dirname, "awsConfig")
            const config = getAWSConfig(configFile, {vault: true})
            isLikelyVaultV4Config(config).should.equal(false)
        })
    })

    describe("Get Vault-style Config", function () {
        it("should return an object with the notdefault profile,\n\t  which inherits new properties from its source_profile", function () {
            const configFile = path.join(__dirname, "vaultConfig")
            const config = getAWSConfig(configFile, {vault: true})
            config.should.have.property("notdefault")
            config.notdefault.should.have.property("role_arn")
            config.notdefault.should.have.property("source_profile", "default")
            config.notdefault.should.have.property("mfa_serial", "arn:aws:iam::123456789012:mfa/defaultUsername")
        })
        it("should return an object with the leavemymfaalone profile,\n\t  which does not inherit existing properties from its source_profile", function () {
            const configFile = path.join(__dirname, "vaultConfig")
            const config = getAWSConfig(configFile, {vault: true})
            config.should.have.property("leavemymfaalone")
            config.leavemymfaalone.should.have.property("role_arn")
            config.leavemymfaalone.should.have.property("source_profile", "default")
            config.leavemymfaalone.should.have.property("mfa_serial", "arn:aws:iam::123456789012:mfa/notDefaultUsername")
        })
        it("should indicate the config is likely to be a v4 vault config", function() {
            const configFile = path.join(__dirname, "vaultConfig")
            const config = getAWSConfig(configFile, {vault: true})
            isLikelyVaultV4Config(config).should.equal(true)
        })
    })
})
