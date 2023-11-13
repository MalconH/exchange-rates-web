const URL = "127.0.0.1:8080";
const API = "https://api.frankfurter.app";

context("Testing exchange rates web app", () => {
    describe("Testing page loads and initializes correctly", () => {
        beforeEach(() => {
            cy.visit(URL);
        });

        it("Loads amount inputs correctly", () => {
            // There are 2 amount inputs
            cy.get("#amount-1")
                .should("be.visible")
                .and("not.be.disabled");

            cy.get("#amount-2")
                .should("be.visible")
                .and("not.be.disabled");

            // User can type on them
            cy.get("#amount-1")
                .type("123")
                .clear();

            cy.get("#amount-2")
                .type("123")
                .clear();
        });

        it("Loads currency selectors correctly", () => {
            // There are 2 <select>
            cy.get(".form-select")
                .should("be.visible")
                .and("not.be.disabled");

            // Each start with the default option, w/ value = "0"
            cy.get(".form-select")
                .find("option")
                .should("have.length", 2)
                .should("have.value", "0");
        });

        it("Loads all available currencies correctly", () => {
            const CURRENCIES_TOTAL = 31;
            const CURRENCIES_LIST = {
                "AUD": "Australian Dollar",
                "BGN": "Bulgarian Lev",
                "BRL": "Brazilian Real",
                "CAD": "Canadian Dollar",
                "CHF": "Swiss Franc",
                "CNY": "Chinese Renminbi Yuan",
                "CZK": "Czech Koruna",
                "DKK": "Danish Krone",
                "EUR": "Euro",
                "GBP": "British Pound",
                "HKD": "Hong Kong Dollar",
                "HUF": "Hungarian Forint",
                "IDR": "Indonesian Rupiah",
                "ILS": "Israeli New Sheqel",
                "INR": "Indian Rupee",
                "ISK": "Icelandic Króna",
                "JPY": "Japanese Yen",
                "KRW": "South Korean Won",
                "MXN": "Mexican Peso",
                "MYR": "Malaysian Ringgit",
                "NOK": "Norwegian Krone",
                "NZD": "New Zealand Dollar",
                "PHP": "Philippine Peso",
                "PLN": "Polish Złoty",
                "RON": "Romanian Leu",
                "SEK": "Swedish Krona",
                "SGD": "Singapore Dollar",
                "THB": "Thai Baht",
                "TRY": "Turkish Lira",
                "USD": "United States Dollar",
                "ZAR": "South African Rand"
            };

            // It loads all 32 currencies correctly as options w/ their corresponding value
            cy.get("#currency-1").find("option")
                .should("have.length", CURRENCIES_TOTAL + 1) // plus the default option
                // Checking loaded currencies are correct
                .each(($option) => {
                    cy.wrap($option).invoke("val").then((optionValue) => {
                        if (optionValue === "0") return; // Don't run any test if the $option is the default one.
                        cy.wrap($option).invoke("text").then((optionText) => {
                            cy.wrap(CURRENCIES_LIST)
                                // optionText contains a string similar to: "USD: United States Dollar"
                                // As the value of the property I don't want to pass the currency code together w/ the currency name,
                                // so I remove that part from the string
                                .should("have.property", optionValue, removeFromString(optionText, `${optionValue}:`));
                        });
                    });
                });
        });

        it("Default currencies are USD and EUR", () => {
            const FIRST_CURRENCY_CODE = "USD";
            const SECOND_CURRENCY_CODE = "EUR";

            cy.get("#currency-1")
                .should("have.value", FIRST_CURRENCY_CODE);
            cy.get("#currency-2")
                .should("have.value", SECOND_CURRENCY_CODE);
        });

        it("Loads the table", () => {
            // There's a table, with a corresponding caption, header, and body, initially w/ 0 <tr>
            cy.get("table")
                .should("be.visible");
            cy.get("table thead")
                .should("be.visible");
            cy.get("table tbody")
                .should("be.visible")
                .find("tr")
                .should("have.length", 0);
        });

        it("Shows entries in the table correctly", () => {
            const WEEKDAYS_IN_MONTH = 20;
            const MINIMUM_ENTRIES = WEEKDAYS_IN_MONTH;
            const MAX_DECIMALS = 4;
            const parseDate = /^\d{2}-\d{2}-\d{4}$/; // DD-MM-YYYY

            // The tbody loads at least 20 <tr> with rates
            cy.get("table").find("tbody").find("tr")
                .its("length")
                .should("be.at.least", MINIMUM_ENTRIES);

            // Dates are in correct format
            cy.get("th.date").each(($date) => {
                cy.wrap($date).invoke("text").then((dateText => {
                    expect(dateText).to.match(parseDate);
                }));
            });

            // Rates are limited to 4 decimals max.
            cy.get("td.rate").each(($rate) => {
                cy.wrap($rate).invoke("text").then((rateText) => {
                    const decimals = rateText.split(".")[1];
                    expect(decimals).to.not.have.lengthOf.gt(MAX_DECIMALS);

                });
            });
        });
    });

    describe.only("Testing functionality", () => {
        const RATE_1 = 0.93;

        beforeEach(() => {
            cy.intercept(
                "GET",
                `${API}/latest?from=USD&to=EUR`,
                { fixture: "../fixtures/exchange-rate_default.json" }
            ).as("getDefaultExchangeRate");
            cy.visit(URL);
            cy.wait("@getDefaultExchangeRate");
        });


        it("Converts amounts typing on either input", () => {
            cy.get("#amount-1")
                .type("1");
            cy.get("#amount-2")
                .should("have.value", roundToDecimalPlaces(1 * RATE_1, 2)) // = 0.93
                .clear();


            // Checking the app rounds up to 2 decimals
            cy.get("#amount-1")
                .type("3.6");
            cy.get("#amount-2")
                .should("have.value", roundToDecimalPlaces(3.6 * RATE_1, 2)) // = 3.35
                .clear();

            // Typing in "reverse-mode" and then switching to "right-mode" 
            cy.get("#amount-2")
                .type("0.93");
            cy.get("#amount-1")
                .should("have.value", roundToDecimalPlaces(0.93 / RATE_1, 2)); // = 1
            cy.get("#amount-1")
                .type("2");
            cy.get("#amount-2")
                .should("have.value", roundToDecimalPlaces(12 * RATE_1, 2))
                .clear();

            cy.get("#amount-2")
                .type("0.93");
            cy.get("#amount-1")
                .should("have.value", roundToDecimalPlaces(0.93 / RATE_1, 2)) // = 1
                .type("{selectall}{backspace}356");
            cy.get("#amount-2")
                .should("have.value", roundToDecimalPlaces(356 * RATE_1, 2)); //
        });

        it("Clears the values of inputs when selecting a new currency", () => {
            cy.get("#amount-1").type("120");
            cy.get("#currency-1").select(2);

            cy.get("#amount-1").should("have.value", "");
            cy.get("#amount-2").should("have.value", "");
        });

        it("Can change selected currencies and convert correctly", () => {
            const RATE_2 = 0.11;

            cy.intercept(
                `${API}/latest?from=JPY&to=MXN`, {
                fixture: "../fixtures/exchange-rate_2.json"
            }).as("getExchangeRate2");

            cy.get("#currency-1").select("JPY");
            cy.get("#currency-2").select("MXN");

            cy.wait("@getExchangeRate2");

            // Testing in "normal-mode"
            cy.get("#amount-1").type("1");
            cy.get("#amount-2").should("have.value", roundToDecimalPlaces(1 * RATE_2, 2));
            cy.get("#amount-1").clear();

            // Testing in "reverse-mode"
            cy.get("#amount-2").type("0.11");
            cy.get("#amount-1").should("have.value", roundToDecimalPlaces(0.11 / RATE_2, 2));
        });

        it("Updates the table when changing currencies", () => {
            const TO_CURRENCY = "MXN";
            cy.intercept(
                `${API}/*..?from=JPY&to=MXN`,
                { fixture: "../fixtures/historical-rates.json" }
            ).as("getHistoricalRates");

            cy.get("#currency-1").select("JPY");
            cy.get("#currency-2").select("MXN");

            cy.wait("@getHistoricalRates");

            // Iterates trough an historical rates object, which is composed several keys of: date: { to_currency: rate }
            // Extracts date and rate from every key, and compares it to the corresponding entry in the historical rates table 
            cy.fixture("historical-rates.json").its("rates").then((historicalRates) => {
                Object.keys(historicalRates).forEach((date, index) => {
                    const rate = historicalRates[date][TO_CURRENCY];

                    cy.get("table .rate").eq(index).should("have.text", roundToDecimalPlaces(rate, 4));
                    cy.get("table .date").eq(index).should("have.text", formatDate(date));
                });
            });
        });

        it("Shows and hides an error feedback on both inputs", () => {
            // Input 1:
            // Should show an error feedback
            cy.get("#amount-1").type("asd");
            cy.get("#amount-1").should("have.class", "is-invalid");
            cy.get("#error-amount-1").should("contain.text", "The amount entered is not a valid number");

            // Should remove error feedback
            cy.get("#amount-1").clear();
            cy.get("#amount-1").should("not.have.class", "is-invalid");
            cy.get("#error-amount-1").should("be.empty");

            // Input 2:
            // Should show an error feedback
            cy.get("#amount-2").type("*/2");
            cy.get("#amount-2").should("have.class", "is-invalid");
            cy.get("#error-amount-2").should("contain.text", "The amount entered is not a valid number");

            // Should remove error feedback
            cy.get("#amount-2").clear();
            cy.get("#amount-2").should("not.have.class", "is-invalid");
            cy.get("#error-amount-2").should("be.empty");
        });

        it("Handles correctly breaking cases when entering amounts", () => {
            cy.get("#amount-1").type("0");
            cy.get("#amount-1").should("not.have.class", "is-invalid");
            cy.get("#amount-2").should("have.value", "");

            cy.get("#amount-1").type("{selectall}{backspace}-1");
            cy.get("#amount-1").should("have.class", "is-invalid");
            cy.get("#amount-2").should("have.value", "");

            cy.get("#amount-1").type("{selectall}{backspace}0.1");
            cy.get("#amount-1").should("not.have.class", "is-invalid");
            cy.get("#amount-2").should("not.have.value", "");


            cy.get("#amount-1").type("{selectall}{backspace}0.1.1");
            cy.get("#amount-1").should("have.class", "is-invalid");
            cy.get("#amount-2").should("not.have.value", "");

            // It doesn't break when entering an invalid amount
            cy.get("#amount-1").type("{selectall}{backspace}1");
            cy.get("#amount-1").should("not.have.class", "is-invalid");
            cy.get("#amount-2").should("have.value", RATE_1);
        });

        it("Shows an error when selecting the same currencies", () => {
            const CURRENCY = "USD";

            cy.get("#currency-1").select(CURRENCY);
            cy.get("#currency-2").select(CURRENCY);

            cy.get("#currency-2").should("have.class", "is-invalid");
            cy.get("#error-currency-2").should("Currencies cannot be the same");
        });
    });
});

function formatDate(YYYY_MM_DD) { // from YYYY-MM-DD to DD-MM-YYYY
    const [year, month, day] = YYYY_MM_DD.split("-");

    return `${day}-${month}-${year}`;
}

function removeFromString(string, remove) {
    return string.replace(remove, "").trim();
}

function roundToDecimalPlaces(number, places) {
    const multiplier = 10 ** places;
    return Math.round(number * multiplier) / multiplier;
}

/* 
cy.intercept(
    "GET",
    "https://api.frankfurter.app/currencies",
    { fixture: "../fixtures/currencies.json" }
);
*/
