require("chai").should()

const timeRemainingMessage = require("../timeRemaining")

describe("Time Remaining display", function () {
    describe("With hours, minutes, and seconds left", function () {
        it("should return a string with hours and minutes and seconds", function () {
            const message = timeRemainingMessage(3661000) // 1h 1m 1s
            message.should.equal("Time remaining: 1 hours, 1 minutes, 1 seconds")
        })
    })
    describe("With hours, minutes, but no seconds left", function () {
        it("should return a string with hours and minutes", function () {
            const message = timeRemainingMessage(3660000) // 1h 1m 0s
            message.should.equal("Time remaining: 1 hours, 1 minutes, 0 seconds")
        })
    })
    describe("With hours, no minutes, and some seconds left", function () {
        it("should return a string with hours and seconds", function () {
            const message = timeRemainingMessage(3601000) // 1h 0m 1s
            message.should.equal("Time remaining: 1 hours, 1 seconds")
        })
    })
    describe("With exactly an hour left", function () {
        it("should return a string with hours only", function () {
            const message = timeRemainingMessage(3600000) // 1h 0m 0s
            message.should.equal("Time remaining: 1 hours, 0 seconds")
        })
    })
    describe("With less than an hour, but more than a minute left", function () {
        it("should return a string with minutes and seconds", function () {
            const message = timeRemainingMessage(61000) // 0h 1m 1s
            message.should.equal("Time remaining: 1 minutes, 1 seconds")
        })
    })
    describe("With exactly a minute left", function () {
        it("should return a string with minutes only", function () {
            const message = timeRemainingMessage(60000) // 0h 1m 0s
            message.should.equal("Time remaining: 1 minutes, 0 seconds")
        })
    })
    describe("With less than a minute left", function () {
        it("should return a string with seconds only", function () {
            const message = timeRemainingMessage(1000) // 0h 0m 1s
            message.should.equal("Time remaining: 1 seconds")
        })
    })
})
