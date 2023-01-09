class Card {

    constructor(cardData = {}) {
        if (cardData.hasOwnProperty('cardHolderName')) {
            this.cardHolderName = cardData.cardHolderName;
        }

        if (cardData.hasOwnProperty('cardNumber')) {
            this.cardNumber = cardData.cardNumber;
        }

        if (cardData.hasOwnProperty('expirationMonth')) {
            this.expirationMonth = cardData.expirationMonth;
        }

        if (cardData.hasOwnProperty('expirationYear')) {
            this.expirationYear = cardData.expirationYear;
        }

        if (cardData.hasOwnProperty('cvc')) {
            this.cvc = cardData.cvc;
        }
    }
}

module.exports = Card;