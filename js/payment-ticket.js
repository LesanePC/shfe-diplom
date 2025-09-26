const ticketButton = document.querySelector(".btn--get-ticket");
const filmInfoElem = document.querySelector(".payment__info-movie");
const placesInfoElem = document.querySelector(".payment__info-places");
const hallInfoElem = document.querySelector(".payment__info-hall");
const timeInfoElem = document.querySelector(".payment__info-time");
const priceInfoElem = document.querySelector(".payment__info-price");

const seanceId = Number(localStorage.getItem("seanceId"));
const checkedDate = localStorage.getItem("checkedDate");
const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

if (isNaN(seanceId) || !checkedDate || tickets.length === 0) {
  alert("Отсутствуют данные о бронировании. Пожалуйста, выберите сеанс и места заново.");
  window.location.href = "index.html";
}

function updateTicketInfo(data) {
  if (!data || !data.result) {
    alert("Не удалось загрузить данные для билета.");
    return;
  }

  const { films = [], seances = [], halls = [] } = data.result;

  const seance = seances.find(s => s.id === seanceId);
  if (!seance) {
    alert("Сеанс не найден.");
    return;
  }

  const film = films.find(f => f.id === seance.seance_filmid);
  const hall = halls.find(h => h.id === seance.seance_hallid);

  if (!film || !hall) {
    alert("Данные фильма или зала отсутствуют.");
    return;
  }

  const places = tickets.map(t => `${t.row}/${t.place}`);
  const costs = tickets.map(t => Number(t.price) || 0);
  const totalCost = costs.reduce((acc, val) => acc + val, 0);

  filmInfoElem.textContent = film.film_name;
  hallInfoElem.textContent = hall.hall_name;
  timeInfoElem.textContent = seance.seance_time;
  placesInfoElem.textContent = places.join(", ");
  priceInfoElem.textContent = totalCost.toFixed(2);
}

fetch("https://shfe-diplom.neto-server.ru/alldata")
  .then(response => {
    if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
    return response.json();
  })
  .then(data => updateTicketInfo(data))
  .catch(error => {
    console.error("Ошибка при загрузке данных:", error);
    alert("Не удалось загрузить данные. Попробуйте позже.");
  });

ticketButton.addEventListener("click", async (e) => {
  e.preventDefault();

  ticketButton.disabled = true;
  ticketButton.textContent = "Отправка...";

  try {
    // Валидация билетов
    for (const ticket of tickets) {
      if (
        typeof ticket.row !== "number" ||
        typeof ticket.place !== "number" ||
        typeof ticket.price !== "number" ||
        typeof ticket.type !== "string"
      ) {
        throw new Error(`Неверный формат билета: ${JSON.stringify(ticket)}`);
      }
    }
    const payload = {
  seanceId: seanceId,
  ticketDate: checkedDate,
  tickets: tickets,  // просто массив объектов
};

const response = await fetch("https://shfe-diplom.neto-server.ru/ticket", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify(payload)
});


    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ошибка с сервера:", errorText);
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("ticketsInfo", JSON.stringify(result));
      window.location.href = "./ticket-information.html";
    } else {
      console.error("Ответ сервера (полный):", JSON.stringify(result, null, 2));
      alert("Места недоступны для бронирования или данные некорректны!");
    }
  } catch (error) {
    alert(error.message);
    console.error("Ошибка при бронировании:", error);
  } finally {
    ticketButton.disabled = false;
    ticketButton.textContent = "Получить билет";
  }
});

console.log("Содержимое tickets:", tickets);
