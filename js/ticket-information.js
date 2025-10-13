const qrCodeDisplay = document.querySelector(".payment__info-qr");
const filmInfoElement = document.querySelector(".payment__info-movie");
const placesInfoElement = document.querySelector(".payment__info-places");
const hallInfoElement = document.querySelector(".payment__info-hall");
const timeInfoElement = document.querySelector(".payment__info-time");

const checkedDate = localStorage.getItem("checkedDate");
const seanceId = Number(localStorage.getItem("seanceId"));
const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("Не удалось загрузить данные. Пожалуйста, попробуйте позже.");
    return null;
  }
}

function findById(collection, id) {
  return collection.find(item => item.id === id);
}

function parseTicketDetails(tickets) {
  const places = [];
  const costs = [];
  tickets.forEach(ticket => {
    places.push(`${ticket.row}/${ticket.place}`);
    const rawCost = ticket.coast ?? ticket.price;
    const normalizedCost = typeof rawCost === 'string' ? rawCost.replace(',', '.') : rawCost;
    const priceValue = parseFloat(normalizedCost) || 0;
    costs.push(priceValue);
  });
  return { places, costs };
}


function updateUI(film, hall, seance, places) {
  if (!filmInfoElement || !hallInfoElement || !timeInfoElement || !placesInfoElement) {
    console.error("Некоторые DOM-элементы не найдены.");
    return;
  }

  filmInfoElement.textContent = film.film_name || "";
  hallInfoElement.textContent = hall.hall_name || "";
  timeInfoElement.textContent = seance.seance_time || "";
  placesInfoElement.textContent = places.join(", ");
}

function generateQRCode(date, time, filmName, hallName, places, totalCost) {
  if (!qrCodeDisplay) {
    console.error("Элемент для отображения QR-кода не найден.");
    return;
  }

  const totalCostFormatted = totalCost.toFixed(2);

  const qrText = [
    `Дата: ${date}`,
    `Время: ${time}`,
    `Название фильма: ${filmName}`,
    `Зал: ${hallName}`,
    `Ряд/Место: ${places.join(", ")}`,
    `Стоимость: ${totalCostFormatted} руб.`,
    `Билет действителен строго на свой сеанс`
  ].join('\n');

  if (typeof QRCreator === 'undefined') {
    console.error("Библиотека QRCreator не загружена.");
    return;
  }

  const qr = QRCreator(qrText, {
    mode: -1,
    eccl: 0,
    version: -1,
    mask: -1,
    image: "PNG",
    modsize: 3,
    margin: 3
  });

  qrCodeDisplay.innerHTML = "";
  qrCodeDisplay.append(qr.result);
}

async function initializePaymentPage() {
  if (!checkedDate || isNaN(seanceId) || tickets.length === 0) {
    console.error("Отсутствуют необходимые данные в localStorage. Перенаправление на главную.");
    alert("Отсутствуют данные о билете. Пожалуйста, начните сначала.");
    window.location.href = "index.html";
    return;
  }

  const allData = await fetchData("https://shfe-diplom.neto-server.ru/alldata");
  if (!allData) return;

  const { films, seances, halls } = allData.result;
  const currentSeance = findById(seances, seanceId);
  const currentFilm = findById(films, currentSeance?.seance_filmid);
  const currentHall = findById(halls, currentSeance?.seance_hallid);

  if (!currentSeance || !currentFilm || !currentHall) {
    console.error("Не удалось найти полную информацию о сеансе, фильме или зале.");
    alert("Не удалось найти полную информацию о сеансе. Пожалуйста, попробуйте снова.");
    return;
  }

  const { places, costs } = parseTicketDetails(tickets);

  const totalCost = costs.reduce((acc, price) => acc + price, 0);

  updateUI(currentFilm, currentHall, currentSeance, places);
  generateQRCode(
    checkedDate,
    currentSeance.seance_time,
    currentFilm.film_name,
    currentHall.hall_name,
    places,
    totalCost
  );

  localStorage.removeItem("checkedDate");
  localStorage.removeItem("seanceId");
  localStorage.removeItem("tickets");
}

document.addEventListener("DOMContentLoaded", initializePaymentPage);
