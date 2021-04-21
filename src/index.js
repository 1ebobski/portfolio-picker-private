// for matrix convertation from wrong json (got from csv to json converter) to right one

// import { RAW_RUB } from "./js/constants/raw-matrixes/raw_rub.js";
// import { RAW_CUR } from "./js/constants/raw-matrixes/raw_cur.js";

// import { matrixConverter } from "./js/utils/matrixConverter.js";

// const matrixNamesArray = ["MATRIX_RUB", "MATRIX_CUR"];

// [RAW_RUB, RAW_CUR].forEach((matrix, index) =>
//   console.log(
//     `export const ${matrixNamesArray[index]} =`,
//     JSON.stringify(matrixConverter(matrix))
//   )
// );

//import logo and qr code images
import openBrokerLogo from "./images/open-logo.svg";
import humanIcon from "./images/human-icon.svg";
import medalIcon from "./images/medal-icon.svg";
import presentIcon from "./images/present-icon.svg";
import cardIcon from "./images/card-icon.svg";

// import styles, components and modules
import "./index.css";
import Header from "./js/components/Header.js";
import LoginForm from "./js/components/LoginForm.js";
import Form from "./js/components/Form.js";
import Portfolio from "./js/modules/Portfolio.js";
import ExchangeRatesApi from "./js/modules/ExchangeRatesApi.js";
import Report from "./js/components/Report.js";
import Recommendation from "./js/components/Recommendation.js";
import Terminal from "./js/components/Terminal.js";
import Footer from "./js/components/Footer.js";

// import various scales, matrixes and dicts for correct portfolio selection
import { MATRIX_CUR } from "./js/constants/matrixes/matrix_cur.js";
import { MATRIX_RUB } from "./js/constants/matrixes/matrix_rub.js";

import { MONEY_SCALE, RISK_MATRIX } from "./js/constants/scales.js";
import { RECS_LIST } from "./js/constants/recs-list.js";
import { FILTER_DICT } from "./js/constants/filter-dict.js";
import { RECOMMENDATION_MATRIX } from "./js/constants/recommendation-matrix.js";
import { CATALOGUE } from "./js/constants/catalogue.js";

// import constants required for exchange rates api
import {
  BASE_URL,
  METHOD,
  APP_ID,
} from "./js/constants/exchange-rates-api-url.js";
import { TERMINAL_CONTENT } from "./js/constants/terminal-content.js";

const rootElement = document.querySelector(".root");

const mainElement = document.createElement("main");
mainElement.classList.add("main");

const loginForm = new LoginForm({
  container: rootElement,
});

const header = new Header({
  container: rootElement,
  openBrokerLogo,
});

// create components instances passing required props regardless user question responses
const form = new Form({
  container: mainElement,
  moneyScale: MONEY_SCALE,
  riskMatrix: RISK_MATRIX,
  // openBrokerLogo: openBrokerLogo,
});

const report = new Report({
  container: mainElement,
  openBrokerLogo,
});

const recommendation = new Recommendation({
  container: mainElement,
  recsCatalogue: RECS_LIST,
  recommendationMatrix: RECOMMENDATION_MATRIX,
  openBrokerLogo,
  cardIcon,
  humanIcon,
  medalIcon,
  presentIcon,
});

const terminal = new Terminal({
  container: mainElement,
  terminalContent: TERMINAL_CONTENT,
  openBrokerLogo,
});

const footer = new Footer({
  container: rootElement,
  openBrokerLogo,
});

// create api instance and passing props
const exchangeRatesApi = new ExchangeRatesApi({
  baseUrl: BASE_URL,
  method: METHOD,
  appId: APP_ID,
});

// create portfolio instance, used in portfolio selection process
const portfolio = new Portfolio({
  catalogue: CATALOGUE,
  filterDict: FILTER_DICT,
  recsCatalogue: RECS_LIST,

  matrixCur: MATRIX_CUR,
  matrixRub: MATRIX_RUB,
});

// creates filter element in form component
// form.insertLogo();
// form.createFilter();

header.createHeader();

// loginForm.createLoginForm();
rootElement.insertBefore(mainElement, footer.footerElement);

// rootElement.appendChild(mainElement);
footer.createFooter();

// form.createFormSection();
report.createReportSection();
recommendation.createRecommendationsSection();

// requests exchange rates from https://api.exchangeratesapi.io/, returns promise
// and then updates rates in form and report component instances
// and afterwards executes the function that handles all the process in portfolio selection
exchangeRatesApi
  .getRates()
  .then((response) => {
    // console.log(response.rates);
    const usdPrice = 1 / response.rates.RUB;
    const euPrice = response.rates.EUR * usdPrice;
    const rates = { EUR: euPrice, USD: usdPrice };

    // console.log(rates);
    // const tempRates = { EUR: 0.0125875781, USD: 0.0142063406 };
    // report.updatePrices(tempRates);
    form.updatePrices(rates);
    report.updatePrices(rates);
    // handleChanges();
  })
  .catch((error) => {
    console.log(error);
  });

// function that handles any changes in form responses and
const handleChanges = () => {
  // form methods that get answers, investment amount and filter selections
  // and assign risk profiles, portfolio keys and due date for portfolio selection
  form.getAnswers();
  form.getInvestmentAmount();
  // form.getFilter();
  form.assignRiskProfile();
  form.assignPortfolioKeys();
  form.assignDueDate();

  // update portfolio with required data from form component
  portfolio.updatePortfolio({
    portfolioKeys: form.portfolioKeys,
    dueDate: form.dueDate,
    investmentAmount: form.investmentAmount,
    investmentAmountRubbles: form.investmentAmountRubbles,
    isCurrency: form.isCurrency,
    currency: form.currency,
    // filterList: form.filterList,
    helpRequestString: form.helpRequestString,
    helpRequestTicked: form.helpRequestTicked,
  });

  // console.log(portfolio.portfolio);

  // update report with required data from form and portfolio components
  report.updateReportData({
    portfolio: portfolio.portfolio,
    currency: portfolio.currency,
  });

  // update recommendation with required data from form and portfolio components
  recommendation.updateRecommendation(
    portfolio.investmentAmountRubbles,
    portfolio.currency,
    form.helpRequestString
  );

  // render report, recommendation and terminal sections
  report.renderReport();
  recommendation.renderRecommendation();
  terminal.renderTerminal();
};

// add eventlisteneer to refresh button to get new portfolio rendered
form.refreshButton.addEventListener("click", () => {
  handleChanges();
});

form.printButton.addEventListener("click", (event) => {
  event.preventDefault();
  // form.getClientId();

  // if (report.reportIsRendered && form.clientId) {
  window.print();
  // } else {
  //   alert("Нет сгенерированного портфеля или id клиента!");
  // }
});

// add eventlistener to form element, handles changes only if input was via checkbox dropdown or text input
// AND investment amount in rubles is more than 10000 (Portfolio can find portfolio for lower sums of money,
// but either will get and error or it's not feasible in terms of investing)
// form.formElement.addEventListener("input", (event) => {
//   if (
//     (event.target.classList.contains("question__dropdown") ||
//       event.target.classList.contains("question__input-text") ||
//       event.target.classList.contains("question__checkbox")) &&
//     form.investmentAmountRubbles >= 10000
//   ) {
//     handleChanges();
//   }
// });

// add eventlistener to support level element (5th question) and implements a logic that autoselects corresponding filters
// form.supportLevelElement.addEventListener("input", () => {
//   form.manageFilterState();
// });

// add click event listener to form element that works only when clicked on filter buttons and updates filters' state
// loginForm.loginFormElement.addEventListener("submit", (event) => {
//   event.preventDefault();
//   rootElement.removeChild(loginForm.loginFormElement);
//   rootElement.insertBefore(mainElement, footer.footerElement);
// });

form.formElement.addEventListener("click", (event) => {
  if (event.target.classList.contains("question__label")) {
    form.updateFilter(event);
  }
});
