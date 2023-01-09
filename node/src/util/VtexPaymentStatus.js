class VtexPaymentStatus {

    /**
     * approved e denied são valores de status final.
     */
    static APPROVED = "approved";
    static DENIED = "denied";

    /**
     * O status undefined representa o estado em que o provedor não pôde terminar de processar o pagamento.
     * Isso pode ser devido a uma longa execução de processamento ou a algum processamento assíncrono.
     */
    static UNDEFINED = "undefined";
}

module.exports = VtexPaymentStatus;