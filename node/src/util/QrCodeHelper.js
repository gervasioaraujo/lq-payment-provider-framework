const axios = require("axios");
const qrcode = require("qrcode");

class QrCodeHelper {

    static async getGoogleQRCodeImageFromPixCode(pixCode = "") {

        try {
            const response = await axios
                .get(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${pixCode}&choe=UTF-8`);
            return response.data
        } catch (error) {
            console.error("Error when getting google qr code image.");
            console.error(error);
        }

    }

    static async generateQrCodeBase64ImageFromPixCode(pixCode = "") {
        const base64 = await qrcode.toDataURL(pixCode);
        return base64;
    }

}

module.exports = QrCodeHelper;