require("chai").should()


const {
    getAWSConfig,
    getCachableProfiles
} = require("../AWSConfigReader")


describe("MFA Cache", function () {
    describe("Listing profiles that could have MFA attached", function () {
        it("should return profiles that have an MFA device and long term credentials", function () {
            const config = getCachableProfiles({config: getAWSConfig(`${__dirname}/aws2faConfig`, `${__dirname}/aws2faCredentials`)})
            config.awsConfig.should.have.property("identity")
        })
        it("should not return profiles that are assuming a role, have an MFA device, and long term credentials", function () {
            const config = getCachableProfiles({config: getAWSConfig(`${__dirname}/aws2faConfig`, `${__dirname}/aws2faCredentials`)})
            config.awsConfig.should.not.have.property("nomfacache")
        })
    })
})
