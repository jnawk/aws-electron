require('chai').should();

const path = require('path');

const getAWSConfig = require('../AWSConfigReader');

describe('AWS Config Reader', function () {
  describe('Get Config', function () {
    it('should return an object with the default profile', function () {
      const configFile = path.join(__dirname, 'awsConfig');
      const config = getAWSConfig(configFile);
      config.should.have.property('default');
      config.default.should.have.property('region', 'ap-southeast-2');
    });
    it('should return an object with the notdefault profile', function () {
      const configFile = path.join(__dirname, 'awsConfig');
      const config = getAWSConfig(configFile);
      config.should.have.property('notdefault');
      config.notdefault.should.have.property('role_arn');
      config.notdefault.should.have.property('source_profile', 'default');
    });
    it('should return an object which does not contain commented out profiles', function () {
      const configFile = path.join(__dirname, 'awsConfig');
      const config = getAWSConfig(configFile);
      config.should.not.have.property('ghostprofile');
    });
  });
});
