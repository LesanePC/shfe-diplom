const loginButton = document.querySelector(".btn--login");
const dateNavItems = Array.from(document.querySelectorAll(".date-nav__item"));
const currentDateNavItem = document.querySelector(".date-nav__item--current");
const rightArrowNavItem = document.querySelector(".date-nav__item--arrow");
const mainContent = document.querySelector(".main-content");

const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const today = new Date();

let dayOffset = 0;
let selectedDate = today;

function setToday(date) {
  const weekdayElem = currentDateNavItem.querySelector(".date-nav__weekday");
  const dayElem = currentDateNavItem.querySelector(".date-nav__day");

  const dayName = weekDays[date.getDay()];
  weekdayElem.textContent = `${dayName}, `;
  dayElem.textContent = ` ${date.getDate()}`;

  const isWeekend = dayName === "Сб" || dayName === "Вс";
  weekdayElem.classList.toggle("date-nav__item--weekend", isWeekend);
  dayElem.classList.toggle("date-nav__item--weekend", isWeekend);

  currentDateNavItem.dataset.date = date.toISOString().split("T")[0];
  currentDateNavItem.classList.add("date-nav__item--checked");
  currentDateNavItem.style.cursor = "default";

  selectedDate = date;
  localStorage.setItem("checkedDate", currentDateNavItem.dataset.date);
}

function updateDateNavItems(baseDate, offset = 0) {
  dateNavItems.forEach((item, index) => {
    if (
      !item.classList.contains("date-nav__item--current") &&
      !item.classList.contains("date-nav__item--arrow")
    ) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + index + offset);
      const dayName = weekDays[date.getDay()];

      item.dataset.date = date.toISOString().split("T")[0];
      item.firstElementChild.textContent = `${dayName},`;
      item.lastElementChild.textContent = date.getDate();
      item.classList.toggle("date-nav__item--weekend", date.getDay() === 0 || date.getDay() === 6);
      item.classList.remove("date-nav__item--checked");
      item.style.cursor = "pointer";
    }
  });
}

function setupDateNavigation() {
  const navContainer = currentDateNavItem.parentElement;

  navContainer.addEventListener("click", (event) => {
    const target = event.target.closest(".date-nav__item");
    if (!target) return;

    if (target === currentDateNavItem && target.classList.contains("date-nav__item--arrow")) {
      if (dayOffset > 0) {
        dayOffset--;
        updateDateNavItems(today, dayOffset);
        toggleCurrentDateNavItem(false);
      }
    } else if (target === rightArrowNavItem) {
      dayOffset++;
      updateDateNavItems(today, dayOffset);
      toggleCurrentDateNavItem(true);
    } else if (!target.classList.contains("date-nav__item--arrow")) {
      selectDateItem(target);
    }
  });
}

function toggleCurrentDateNavItem(showArrow) {
  if (showArrow) {
    currentDateNavItem.classList.remove("date-nav__item--checked");
    currentDateNavItem.classList.add("date-nav__item--arrow", "date-nav__item--left");
    currentDateNavItem.style.cursor = "pointer";
    currentDateNavItem.style.display = "flex";
    currentDateNavItem.innerHTML = `<span class="date-nav__arrow">&lt;</span>`;
  } else {
    currentDateNavItem.classList.remove("date-nav__item--arrow", "date-nav__item--left");
    currentDateNavItem.style.display = "block";
    currentDateNavItem.innerHTML = `
      <span class="date-nav__today">Сегодня</span><br>
      <span class="date-nav__weekday"></span> <span class="date-nav__day"></span>
    `;
    setToday(today);
  }
}

function selectDateItem(item) {
  dateNavItems.forEach(el => {
    el.classList.remove("date-nav__item--checked");
    el.style.cursor = "pointer";
  });
  item.classList.add("date-nav__item--checked");
  item.style.cursor = "default";

  selectedDate = new Date(item.dataset.date);
  localStorage.setItem("checkedDate", item.dataset.date);

  markPastSeances();
  setupSeanceClicks();
}

function markPastSeances() {
  const currentTime = new Date();
  const seanceTimes = document.querySelectorAll(".movie-seances__time");

  seanceTimes.forEach(seance => {
    const [hour, minute] = seance.textContent.trim().split(":").map(Number);
    const seanceDate = new Date(selectedDate);
    seanceDate.setHours(hour, minute, 0, 0);

    if (seanceDate < currentTime) {
      seance.classList.add("movie-seances__time--disabled");
    } else {
      seance.classList.remove("movie-seances__time--disabled");
    }
  });
}

function setupSeanceClicks() {
  const seanceTimes = document.querySelectorAll(".movie-seances__time");
  seanceTimes.forEach(seance => {
    if (!seance.classList.contains("movie-seances__time--disabled")) {
      seance.onclick = () => {
        localStorage.setItem("seanceId", seance.dataset.seanceid);
        location.href = "./cinema-hall.html";
      };
    } else {
      seance.onclick = null;
    }
  });
}

function renderFilms(data) {
  const { films, seances, halls } = data.result;
  const openHalls = halls.filter(hall => hall.hall_open);

  mainContent.innerHTML = "";

  films.forEach(film => {
    let seancesHtml = "";

    openHalls.forEach(hall => {
      const hallSeances = seances
        .filter(s => +s.seance_hallid === +hall.id && +s.seance_filmid === +film.id)
        .sort((a, b) => a.seance_time.localeCompare(b.seance_time));

      if (hallSeances.length > 0) {
        seancesHtml += `<h3 class="movie-seances__hall" data-hallid="${hall.id}">${hall.hall_name}</h3><ul class="movie-seances__list">`;
        hallSeances.forEach(s => {
          seancesHtml += `<li class="movie-seances__time" data-seanceid="${s.id}" data-hallid="${hall.id}" data-filmid="${film.id}">${s.seance_time}</li>`;
        });
        seancesHtml += `</ul>`;
      }
    });

    if (seancesHtml) {
      mainContent.insertAdjacentHTML(
        "beforeend",
        `
        <section class="movie" data-filmid="${film.id}">
          <div class="movie__info">
            <div class="movie__poster">
              <img src="${film.film_poster}" alt="Постер фильма ${film.film_name}" class="movie__poster_image">
            </div>
            <div class="movie__description">
              <h2 class="movie__title">${film.film_name}</h2>
              <p class="movie__synopsis">${film.film_description}</p>
              <p class="movie__data">
                <span class="movie__data-length">${film.film_duration} минут</span>
                <span class="movie__data-country">${film.film_origin}</span>
              </p>
            </div>
          </div>
          <div class="movie-seances">${seancesHtml}</div>
        </section>
      `
      );
    }
  });

  markPastSeances();
  setupSeanceClicks();
}

loginButton.addEventListener("click", e => {
  e.preventDefault();
  location.href = "adm-entrance.html";
});

setToday(today);
updateDateNavItems(today);
setupDateNavigation();

fetch("https://shfe-diplom.neto-server.ru/alldata")
  .then(response => response.json())
  .then(data => {
    console.log('Данные с сервера:', data);
    renderFilms(data);
  })
  .catch(error => console.error('Ошибка загрузки:', error));

