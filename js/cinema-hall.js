const seanceId = Number(localStorage.getItem("seanceId"));
const checkedDate = localStorage.getItem("checkedDate");
const fullBody = document.querySelector("body");

const filmNameElement = document.querySelector(".booking__info_title");
const timeSeansElement = document.querySelector(".booking__info-time");
const hallNameElement = document.querySelector(".booking__info_hall");
const schemeContainer = document.querySelector(".booking__scheme_places");
const priceStandardElement = document.querySelector(".price_standart");
const priceVipElement = document.querySelector(".price_vip");
const purchaseButton = document.querySelector(".booking__button");

let standardPrice = 0;
let vipPrice = 0;
let selectedTickets = [];

function handleBodyScale() {
  if (!fullBody) return;

  const currentWidth = fullBody.getBoundingClientRect().width;

  if (currentWidth < 1200) {
    if (!fullBody.classList.contains("transformed")) {
      fullBody.classList.add("transformed");
      fullBody.style.transform = "scale(1.5)";
      fullBody.style.transformOrigin = "0 0";
    }
  } else {
    if (fullBody.classList.contains("transformed")) {
      fullBody.classList.remove("transformed");
      fullBody.style.transform = "";
      fullBody.style.transformOrigin = "";
    }
  }
}

window.addEventListener("resize", handleBodyScale);
handleBodyScale();

function updateSessionInfo(data) {
  if (!data?.result) return;

  const { films, seances, halls } = data.result;

  const currentSeance = seances.find(({ id }) => id === seanceId);
  if (!currentSeance) {
    console.error(`Сеанс с ID ${seanceId} не найден.`);
    alert("Сеанс не найден. Пожалуйста, выберите снова.");
    return;
  }

  const currentFilm = films.find(({ id }) => id === currentSeance.seance_filmid);
  const currentHall = halls.find(({ id }) => id === currentSeance.seance_hallid);

  if (currentFilm) filmNameElement.textContent = currentFilm.film_name || "";
  timeSeansElement.textContent = currentSeance.seance_time || "";

  if (currentHall) {
    hallNameElement.textContent = currentHall.hall_name || "";
    standardPrice = Number(currentHall.hall_price_standart) || 0;
    vipPrice = Number(currentHall.hall_price_vip) || 0;

    priceStandardElement.textContent = standardPrice;
    priceVipElement.textContent = vipPrice;
  }
}

function renderHallScheme(hallConfig) {
  if (!schemeContainer) return;

  schemeContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  hallConfig.forEach(rowTypes => {
    const rowElement = document.createElement("div");
    rowElement.classList.add("booking__scheme_row");

    rowTypes.forEach(type => {
      const chairElement = document.createElement("span");
      chairElement.classList.add("booking__scheme_chair");
      chairElement.dataset.type = type;

      switch (type) {
        case "vip":
          chairElement.classList.add("chair_vip");
          break;
        case "standart":
          chairElement.classList.add("chair_standart");
          break;
        case "taken":
          chairElement.classList.add("chair_occupied");
          break;
        default:
          chairElement.classList.add("no-chair");
      }

      rowElement.appendChild(chairElement);
    });

    fragment.appendChild(rowElement);
  });

  schemeContainer.appendChild(fragment);
}

function setupSeatSelection() {
  if (!schemeContainer) return;

  schemeContainer.addEventListener("click", event => {
    const clickedElement = event.target;

    if (
      clickedElement.classList.contains("booking__scheme_chair") &&
      clickedElement.dataset.type !== "disabled" &&
      clickedElement.dataset.type !== "taken" &&
      clickedElement.dataset.type !== "no-chair"
    ) {
      clickedElement.classList.toggle("chair_selected");
      updatePurchaseButtonState();
    }
  });
}

function updatePurchaseButtonState() {
  if (!purchaseButton) return;

  const selectedChairs = document.querySelectorAll(".booking__scheme_chair.chair_selected");
  purchaseButton.classList.toggle("booking__button_disabled", selectedChairs.length === 0);
}

function handlePurchaseButtonClick() {
  if (!purchaseButton) return;

  purchaseButton.addEventListener("click", () => {
    if (purchaseButton.classList.contains("booking__button_disabled")) return;

    selectedTickets = [];
    const rows = document.querySelectorAll(".booking__scheme_row");

    rows.forEach((row, rowIndex) => {
      Array.from(row.children).forEach((chair, seatIndex) => {
        if (chair.classList.contains("chair_selected")) {
          const seatType = chair.dataset.type;
          const price = seatType === "standart" ? standardPrice : vipPrice;

          let correctedType = seatType === "standart" ? "standard" : seatType;

          selectedTickets.push({
            row: rowIndex + 1,
            place: seatIndex + 1,
            coast: Number(price),
            type: correctedType
          });
        }
      });
    });

    if (selectedTickets.length > 0) {
      localStorage.setItem("tickets", JSON.stringify(selectedTickets));
      document.location = "./payment-ticket.html";
    } else {
      alert("Пожалуйста, выберите места.");
    }
  });
}

async function fetchData(url) {
  const seanceId = Number(localStorage.getItem("seanceId"));
const checkedDate = localStorage.getItem("checkedDate");
const fullBody = document.querySelector("body");

const filmNameElement = document.querySelector(".booking__info_title");
const timeSeansElement = document.querySelector(".booking__info-time");
const hallNameElement = document.querySelector(".booking__info_hall");
const schemeContainer = document.querySelector(".booking__scheme_places");
const priceStandardElement = document.querySelector(".price_standart");
const priceVipElement = document.querySelector(".price_vip");
const purchaseButton = document.querySelector(".booking__button");

let standardPrice = 0;
let vipPrice = 0;
let selectedTickets = [];

function handleBodyScale() {
  if (!fullBody) return;

  const currentWidth = fullBody.getBoundingClientRect().width;

  if (currentWidth < 1200) {
    if (!fullBody.classList.contains("transformed")) {
      fullBody.classList.add("transformed");
      fullBody.style.transform = "scale(1.5)";
      fullBody.style.transformOrigin = "0 0";
    }
  } else {
    if (fullBody.classList.contains("transformed")) {
      fullBody.classList.remove("transformed");
      fullBody.style.transform = "";
      fullBody.style.transformOrigin = "";
    }
  }
}

window.addEventListener("resize", handleBodyScale);
handleBodyScale();

function updateSessionInfo(data) {
  if (!data?.result) return;

  const { films, seances, halls } = data.result;

  const currentSeance = seances.find(({ id }) => id === seanceId);
  if (!currentSeance) {
    console.error(`Сеанс с ID ${seanceId} не найден.`);
    alert("Сеанс не найден. Пожалуйста, выберите снова.");
    return;
  }

  const currentFilm = films.find(({ id }) => id === currentSeance.seance_filmid);
  const currentHall = halls.find(({ id }) => id === currentSeance.seance_hallid);

  if (currentFilm) filmNameElement.textContent = currentFilm.film_name || "";
  timeSeansElement.textContent = currentSeance.seance_time || "";

  if (currentHall) {
    hallNameElement.textContent = currentHall.hall_name || "";
    standardPrice = Number(currentHall.hall_price_standart) || 0;
    vipPrice = Number(currentHall.hall_price_vip) || 0;

    priceStandardElement.textContent = standardPrice;
    priceVipElement.textContent = vipPrice;
  }
}

function renderHallScheme(hallConfig) {
  if (!schemeContainer) return;

  schemeContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  hallConfig.forEach(rowTypes => {
    const rowElement = document.createElement("div");
    rowElement.classList.add("booking__scheme_row");

    rowTypes.forEach(type => {
      const chairElement = document.createElement("span");
      chairElement.classList.add("booking__scheme_chair");
      chairElement.dataset.type = type;

      switch (type) {
        case "vip":
          chairElement.classList.add("chair_vip");
          break;
        case "standart":
          chairElement.classList.add("chair_standart");
          break;
        case "taken":
          chairElement.classList.add("chair_occupied");
          break;
        default:
          chairElement.classList.add("no-chair");
      }

      rowElement.appendChild(chairElement);
    });

    fragment.appendChild(rowElement);
  });

  schemeContainer.appendChild(fragment);
}

function setupSeatSelection() {
  if (!schemeContainer) return;

  schemeContainer.addEventListener("click", event => {
    const clickedElement = event.target;

    if (
      clickedElement.classList.contains("booking__scheme_chair") &&
      clickedElement.dataset.type !== "disabled" &&
      clickedElement.dataset.type !== "taken" &&
      clickedElement.dataset.type !== "no-chair"
    ) {
      clickedElement.classList.toggle("chair_selected");
      updatePurchaseButtonState();
    }
  });
}

function updatePurchaseButtonState() {
  if (!purchaseButton) return;

  const selectedChairs = document.querySelectorAll(".booking__scheme_chair.chair_selected");
  purchaseButton.classList.toggle("booking__button_disabled", selectedChairs.length === 0);
}

function handlePurchaseButtonClick() {
  if (!purchaseButton) return;

  purchaseButton.addEventListener("click", () => {
    if (purchaseButton.classList.contains("booking__button_disabled")) return;

    selectedTickets = [];
    const rows = document.querySelectorAll(".booking__scheme_row");

    rows.forEach((row, rowIndex) => {
      Array.from(row.children).forEach((chair, seatIndex) => {
        if (chair.classList.contains("chair_selected")) {
          const seatType = chair.dataset.type;
          const price = seatType === "standart" ? standardPrice : vipPrice;

          let correctedType = seatType === "standart" ? "standard" : seatType;

          selectedTickets.push({
            row: rowIndex + 1,
            place: seatIndex + 1,
            coast: Number(price),
            type: correctedType
          });
        }
      });
    });

    if (selectedTickets.length > 0) {
      localStorage.setItem("tickets", JSON.stringify(selectedTickets));
      document.location = "./payment-ticket.html";
    } else {
      alert("Пожалуйста, выберите места.");
    }
  });
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP-ошибка! Статус: ${response.status}`);
    }
    const data = await response.json();
    console.log("Ответ сервера:", data);
    return data;
  } catch (error) {
    console.error(`Ошибка при получении данных с ${url}:`, error);
    alert(`Ошибка при загрузке данных. Пожалуйста, попробуйте позже. (${error.message})`);
    return null;
  }
}



async function initializeBookingPage() {
  if (!seanceId || !checkedDate) {
    alert("Не выбраны сеанс или дата. Пожалуйста, вернитесь на главную страницу.");
    document.location.href = "index.html";
    return;
  }

  const allData = await fetchData("https://shfe-diplom.neto-server.ru/alldata");
  if (!allData) return;

  updateSessionInfo(allData);
  

  const hallConfigData = await fetchData(
    `https://shfe-diplom.neto-server.ru/hallconfig?seanceId=${seanceId}&date=${checkedDate}`
  );
  if (!hallConfigData) return;

  if (Array.isArray(hallConfigData.result)) {
    renderHallScheme(hallConfigData.result);
  } else {
    console.error("Неверный формат данных конфигурации зала:", hallConfigData.result);
    alert("Не удалось загрузить схему зала. Пожалуйста, попробуйте позже.");
    return;
  }

  setupSeatSelection();
  handlePurchaseButtonClick();
  updatePurchaseButtonState();
}

document.addEventListener("DOMContentLoaded", initializeBookingPage);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP-ошибка! Статус: ${response.status}`);
    }
    const data = await response.json();
    console.log("Ответ сервера:", data);
    return data;
  } catch (error) {
    console.error(`Ошибка при получении данных с ${url}:`, error);
    alert(`Ошибка при загрузке данных. Пожалуйста, попробуйте позже. (${error.message})`);
    return null;
  }
}


async function initializeBookingPage() {
  if (!seanceId || !checkedDate) {
    alert("Не выбраны сеанс или дата. Пожалуйста, вернитесь на главную страницу.");
    document.location.href = "index.html";
    return;
  }

  const allData = await fetchData("https://shfe-diplom.neto-server.ru/alldata");
  if (!allData) return;

  updateSessionInfo(allData);
  

  const hallConfigData = await fetchData(
    `https://shfe-diplom.neto-server.ru/hallconfig?seanceId=${seanceId}&date=${checkedDate}`
  );
  if (!hallConfigData) return;

  if (Array.isArray(hallConfigData.result)) {
    renderHallScheme(hallConfigData.result);
  } else {
    console.error("Неверный формат данных конфигурации зала:", hallConfigData.result);
    alert("Не удалось загрузить схему зала. Пожалуйста, попробуйте позже.");
    return;
  }

  setupSeatSelection();
  handlePurchaseButtonClick();
  updatePurchaseButtonState();
}

document.addEventListener("DOMContentLoaded", initializeBookingPage);