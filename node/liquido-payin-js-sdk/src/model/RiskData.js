class RiskData {

    constructor(riskData = {}) {
        if (riskData.hasOwnProperty('ipAddress')) {
            this.ipAddress = riskData.ipAddress;
        }

        if (riskData.hasOwnProperty('customProperties')) {
            this.customProperties = riskData.customProperties;
        }
    }
}

module.exports = RiskData;