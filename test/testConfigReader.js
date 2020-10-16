require("chai").should()
const path = require("path")

const { getAWSConfig } = require("../AWSConfigReader")
const awsConfigFile1 = path.join(__dirname, "awsConfig1")
const awsConfigFile2 = path.join(__dirname, "awsConfig2")
const vaultConfigFile = path.join(__dirname, "vaultConfig")

describe("AWS Config Reader", function () {
    describe("Get Config - reading a canonical AWS config", function () {
        it("should return an object with an awsConfig", function () {
            const config = getAWSConfig(awsConfigFile1)
            config.should.have.property("awsConfig")
        })

        it("should return an object with the default profile", function () {
            const config = getAWSConfig(awsConfigFile1)
            config.awsConfig.should.have.property("default")
            config.awsConfig.default.should.have.property("region", "ap-southeast-2")
        })

        it("should return an object with the notdefault profile", function () {
            const config = getAWSConfig(awsConfigFile1)
            config.awsConfig.should.have.property("notdefault")
            config.awsConfig.notdefault.should.have.property("role_arn")
            config.awsConfig.notdefault.should.have.property("source_profile", "default")
        })

        it("should return an object which does not contain commented out profiles", function () {
            const config = getAWSConfig(awsConfigFile1)
            config.awsConfig.should.not.have.property("ghostprofile")
        })

        it("should not have a vaultConfig property", function() {
            const config1 = getAWSConfig(awsConfigFile1)
            config1.should.not.have.property("vaultConfig")

            const config2 = getAWSConfig(awsConfigFile2)
            config2.should.not.have.property("vaultConfig")
        })
    })

    describe("Get Config, reading a Vault(v4)-style config", function () {
        it("should return an object with a vaultConfig property", function() {
            const config = getAWSConfig(vaultConfigFile)
            config.should.have.property("vaultConfig")
        })

        it("should return an object with the notdefault profile,\n\t  which inherits new properties from its source_profile", function () {
            const config = getAWSConfig(vaultConfigFile)
            config.vaultConfig.should.have.property("notdefault")
            config.vaultConfig.notdefault.should.have.property("role_arn")
            config.vaultConfig.notdefault.should.have.property("source_profile", "default")
            config.vaultConfig.notdefault.should.have.property("mfa_serial", "arn:aws:iam::123456789012:mfa/defaultUsername")
        })

        it("should return an object with the leavemymfaalone profile,\n\t  which does not inherit existing properties from its source_profile", function () {
            const config = getAWSConfig(vaultConfigFile)
            config.vaultConfig.should.have.property("leavemymfaalone")
            config.vaultConfig.leavemymfaalone.should.have.property("role_arn")
            config.vaultConfig.leavemymfaalone.should.have.property("source_profile", "default")
            config.vaultConfig.leavemymfaalone.should.have.property("mfa_serial", "arn:aws:iam::123456789012:mfa/notDefaultUsername")
        })

        it("should return an awsConfig without enriched profiles", function(){
            const config = getAWSConfig(vaultConfigFile)
            config.awsConfig.notdefault.should.not.have.property("mfa_serial")
        })
    })
})
