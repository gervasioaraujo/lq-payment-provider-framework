class PayInStatus {
    static INITIAL_STATUS = "INITIAL_STATUS";
    static SETTLED = "SETTLED";
    static IN_PROGRESS = "IN_PROGRESS";
    static FAILED = "FAILED";
    static CHARGED_BACK = "CHARGED_BACK";
    static REFUNDING = "REFUNDING";
    static REFUNDED = "REFUNDED";
    static EXPIRED = "EXPIRED";
    static CANCELLED = "CANCELLED";
}

module.exports = PayInStatus;