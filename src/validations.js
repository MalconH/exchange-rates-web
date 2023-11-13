function validateSelectedCurrencies(currency1, currency2) {
    const parseCurrency = /^[a-z]{3}$/i; // 3 letters from a-z

    if (!(currency1 && currency2)) { // If one of the currencies is empty/undefined/0
        return "Currencies cannot be empty";
    }

    if (currency1 === currency2) {
        return "Currencies cannot be the same";
    }

    if (!parseCurrency.test(currency1)) {
        return "First currency is not a valid currency";
    }

    if (!parseCurrency.test(currency2)) {
        return "Second currency is not a valid currency";
    }

    return "";
}

function validateAmount(amount) {
    const parseAmount = /^\d+(\.\d+)?$/; // only natural numbers and decimals.

    if (amount === "") {
        return "";
    }

    if (!parseAmount.test(amount)) {
        return "The amount entered is not a valid number";
    }
}
