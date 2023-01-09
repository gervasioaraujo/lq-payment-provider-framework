class BillingAddress {

    constructor(billingAddressData = {}) {

        if (billingAddressData.hasOwnProperty('zipCode')) {
            this.zipCode = billingAddressData.zipCode;
        }

        if (billingAddressData.hasOwnProperty('state')) {
            this.state = billingAddressData.state;
        }

        if (billingAddressData.hasOwnProperty('city')) {
            this.city = billingAddressData.city;
        }

        if (billingAddressData.hasOwnProperty('district')) {
            this.district = billingAddressData.district;
        }

        if (billingAddressData.hasOwnProperty('street')) {
            this.street = billingAddressData.street;
        }

        if (billingAddressData.hasOwnProperty('number')) {
            this.number = billingAddressData.number;
        }

        if (billingAddressData.hasOwnProperty('complement')) {
            this.complement = billingAddressData.complement;
        }

        if (billingAddressData.hasOwnProperty('country')) {
            this.country = billingAddressData.country;
        }

    }

}

module.exports = BillingAddress;