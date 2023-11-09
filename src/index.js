// Global variables
const HOST = "https://api.frankfurter.app";
const currencies = {
    first: undefined,
    second: undefined,
    rate: 1
};

// Event Listeners
const $firstCurrencySelector = document.querySelector("select#currency-1");
$firstCurrencySelector.addEventListener("input", onCurrencySelected);

const $secondCurrencySelector = document.querySelector("select#currency-2");
$secondCurrencySelector.addEventListener("input", onCurrencySelected);

const $firstAmountInput = document.querySelector("input#amount-1");
$firstAmountInput.addEventListener("input", onAmountEntered);

const $secondAmountInput = document.querySelector("input#amount-2");
$secondAmountInput.addEventListener("input", onAmountEntered);

// Event Handlers
function onCurrencySelected(event) {
    const $select = event.target;
    const currencyOrder = $select.getAttribute("data-currency-order"); // Which of the 2 <select> triggered the event 
    const currencyCode = $select.value;
    let error;

    setSelectedCurrency(currencyOrder, currencyCode);
    error = validateSelectedCurrencies(currencies.first, currencies.second);

    handleErrors(error, $select);
    if (error) return;

    if (currencies.first && currencies.second) { // If the user has selected both currencies
        updateExchangeRate();
        updateRatesTable(currencies.first, currencies.second);
    }

    $firstAmountInput.value = "";
    $secondAmountInput.value = "";
}

function onAmountEntered(event) {
    const $input = event.target;
    let $output;
    let onReverseMode = false;
    let error = validateAmount($input.value);

    handleErrors(error, $input);
    if (error) return;

    if ($input.id === "amount-1") {
        $output = document.querySelector("input#amount-2");
    } else {
        $output = document.querySelector("input#amount-1");
        onReverseMode = true;
    }

    $output.value = getConvertedAmount($input, onReverseMode) || "";
}

// Other functions
function setSelectedCurrency(order, code) { // Order can be "first" or "second" only
    currencies[order] = code;
}

function getSelectedCurrency(order) {
    return currencies[order];
}

async function updateExchangeRate() {
    currencies.rate = await getExchangeRate(currencies.first, currencies.second);
}

function updateRatesTable(from, to) {
    document.querySelectorAll(".main-currency").forEach((element) => {
        element.textContent = from;
    });

    document.querySelectorAll(".secondary-currency").forEach((element) => {
        element.textContent = to;
    });
    generateRows(from, to);
}

function getConvertedAmount(input, onReverseMode = false) {
    const exchangeRate = currencies.rate;

    // With a USD/EUR (e.g.) exchange rate, to convert 1 USD to EUR you MULTIPLY 1 USD by exchangeRate
    // to go from 1 EUR to USD, you DIVIDE 1 EUR by exchangeRate 
    // This is done this way to avoid fetching the API twice, to get USD/EUR and EUR/USD.   

    if (!onReverseMode) {
        return roundTo(input.value * exchangeRate, 2);
    }

    return roundTo(input.value / exchangeRate, 2);
}

function generateRows(fromCurrency, toCurrency) {
    const NUMBER_OF_DAYS = 30;
    const startDate = dateToString(substractDaysFromDate(new Date(), NUMBER_OF_DAYS)); // Format: YYYY-MM-DD

    document.querySelectorAll(".table tr").forEach((row => {
        row.remove();
    }));

    getHistoricalRates(startDate, fromCurrency, toCurrency)
        .then(historicalRates => {
            Object.keys(historicalRates)
                .forEach(historicalRate => {
                    const date = historicalRate;
                    const rate = historicalRates[date][toCurrency];
                    generateRow(formatDate(date), rate);
                });
        });



}

function generateRow(date, rate) {
    const $tableBody = document.querySelector(".table tbody");

    const $tr = document.createElement("tr");
    const $th = document.createElement("th");
    const $td = document.createElement("td");

    $th.className = "date";
    $th.textContent = date;

    $td.className = "rate";
    $td.textContent = roundTo(rate, 4);

    $tr.appendChild($th);
    $tr.appendChild($td);
    $tableBody.appendChild($tr);
}

// Takes an error and where it happened, and shows it.
function handleErrors(error, input) {
    removeErrors();
    if (!error) {
        return;
    }

    // The id of the elements that will show the errorMessage contains the id of its
    // related input, i.e, the one which the error corresponds to.
    const $errorContainer = document.querySelector(`#error-${input.id}`);

    // Removes invalid classes

    input.classList.add("is-invalid"); // is-invalid is a form validation class from bootstrap
    $errorContainer.textContent = error;

}

function removeErrors() {
    document.querySelectorAll(".is-invalid").forEach(element => {
        element.classList.remove("is-invalid");
    });

    document.querySelectorAll("invalid-feedback").forEach(element => {
        element.textContent = "";
    });
}

// Utilities
function roundTo(number, decimals) {
    const multipleOfTen = 10 ** decimals;

    return Math.round(number * multipleOfTen) / multipleOfTen;
}

function substractDaysFromDate(date, days) {
    const MILLISECONDS_IN_A_DAY = 8.64e+7;
    const millisecondsSinceEpoch = Number(date);

    const newDate = new Date(
        Math.abs(
            millisecondsSinceEpoch - MILLISECONDS_IN_A_DAY * days
        )
    );

    return newDate;
}

function formatDate(YYYY_MM_DD) { // from YYYY-MM-DD to DD-MM-YYYY
    const [year, month, day] = YYYY_MM_DD.split("-");

    return `${day}-${month}-${year}`;
}

function dateToString(date) { // Takes a Date Object and return a String: DD-MM-YYYY   
    const jsonDate = date.toJSON(); // toJSON() -> YYYY-MM-DDThh:mm:ss.000Z
    return jsonDate.slice(0, jsonDate.indexOf("T")); // Exclude everything after "T"
}

function initialize() {
    initializeCurrenciesSelectors();
    initializeCurrencies("USD", "EUR");
    updateRatesTable(currencies.first, currencies.second);
}





async function initializeCurrenciesSelectors() {
    const $select1 = document.querySelector("#currency-1");
    const $select2 = document.querySelector("#currency-2");
    const availableCurrencies = await getCurrencies();

    // Loads into DOM retrieved currencies from the API
    Object.keys(availableCurrencies).forEach((currencyCode) => {
        const $newOption = document.createElement("option");
        const currencyName = availableCurrencies[currencyCode];
        $newOption.className = "currency";
        $newOption.value = currencyCode;
        $newOption.textContent = `${currencyCode}: ${currencyName}`;

        $select1.appendChild($newOption);

        // Clones the node because passing it directly will remove the option from $selector1 to append it in $selector2
        $select2.appendChild($newOption.cloneNode(true));
    });

    // Selects EUR and USD to show as default
    document.querySelector("#currency-1 .currency[value='USD']").setAttribute("selected", "");
    document.querySelector("#currency-2 .currency[value='EUR']").setAttribute("selected", "");
}

function initializeCurrencies(firstCurrency, secondCurrency) {
    currencies.first = firstCurrency;
    currencies.second = secondCurrency;
    updateExchangeRate();
}

// Fetching Frankfurter API Functions
function getCurrencies() {
    return fetch(`${HOST}/currencies`)
        .then(response => response.json())
        .then(currencies => currencies);
}

function getExchangeRate(from, to) {
    return fetch(`${HOST}/latest?from=${from}&to=${to}`)
        .then(response => response.json())
        .then(response => {
            return response.rates[to];
        });
}

function getHistoricalRates(dateStart, fromCurrency, toCurrency) {
    // dateStart should have this date format: "YYYY-MM-DD"
    return fetch(`${HOST}/${dateStart}..?from=${fromCurrency}&to=${toCurrency}`)
        .then(response => response.json())
        .then(response => response.rates);
}

initialize();
