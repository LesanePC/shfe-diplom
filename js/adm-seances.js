const popupAddSession = document.querySelector(".popup--add-session");
const selectSessionMovie = document.querySelector(".select__add-seance_movie");
const formAddSession = document.querySelector(".popup__form_add-seance");
const selectSessionHall = document.querySelector(".select__add-seance_hall");
const inputSessionTime = document.querySelector(".add-seans__input_time");
const popupRemoveSession = document.querySelector(".popup--remove-session");
const timelinesWrapper = document.querySelector(".sessions-timeline");
const btnCancelSessions = document.getElementById("btn-sessions-cancel");
const btnSaveSessions = document.getElementById("btn-sessions-save");

let draggedElement = null;
let deletedSessions = new Set();
let sessionData = null;
let initializedSubmitHandler = false;

async function initSessionsInterface(data) {
  sessionData = data;
  renderTimelines(data.result.halls);
  loadSessions(data);
  setupDragAndDrop();
  setupAddSessionForm();
  setupDeleteSessionPopup();
  setupControlButtons();
  updateControlButtonsState();
}

function renderTimelines(halls) {
  timelinesWrapper.innerHTML = "";
  halls.forEach(hall => {
    const section = document.createElement("section");
    section.classList.add("movie-seances__timeline");
    section.innerHTML = `
      <div class="session-timeline__delete" data-hallid="${hall.id}">
        <img src="./img/trash.png" alt="Удалить сеанс">
      </div>
      <h3 class="timeline__hall_title">${hall.hall_name}</h3>
      <div class="timeline__seances" data-id="${hall.id}"></div>
    `;
    timelinesWrapper.appendChild(section);
  });
}

function loadSessions(data) {
  const timelines = timelinesWrapper.querySelectorAll(".timeline__seances");
  timelines.forEach(timeline => {
    timeline.innerHTML = "";
    const hallId = Number(timeline.dataset.id);
    const sessionsForHall = data.result.seances.filter(s => Number(s.seance_hallid) === hallId);
    sessionsForHall.forEach(session => {
      const film = data.result.films.find(f => f.id === Number(session.seance_filmid));
      if (film) {
        const sessionHTML = createSessionHTML(session, film);
        timeline.insertAdjacentHTML("beforeend", sessionHTML);
      }
    });
  });
  setSessionBackgrounds();
  positionSessions();
  bindDeleteSessionHandlers();
}

function createSessionHTML(session, film) {
  return `
    <div class="timeline__seances_movie" data-filmid="${film.id}" data-seanceid="${session.id}" draggable="true">
      <p class="timeline__seances_title">${film.film_name}</p>
      <p class="timeline__movie_start" data-duration="${film.film_duration}">${session.seance_time}</p>
    </div>
  `;
}

function setSessionBackgrounds() {
  const sessions = document.querySelectorAll(".timeline__seances_movie");
  sessions.forEach(session => {
    const filmId = Number(session.dataset.filmid);
    const filmElement = document.querySelector(`.movie-item[data-id="${filmId}"]`);
    if (filmElement) {
      const backgroundClass = Array.from(filmElement.classList).find(cls => cls.startsWith("background-"));
      if (backgroundClass) {
        session.classList.add(backgroundClass);
      }
    }
  });
}

function positionSessions() {
  const sessions = document.querySelectorAll(".timeline__seances_movie");
  const dayMinutes = 24 * 60;

  sessions.forEach(session => {
    const timeElem = session.querySelector(".timeline__movie_start");
    if (!timeElem) return;

    const [hours, minutes] = timeElem.textContent.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const duration = Number(timeElem.dataset.duration);

    const leftPercent = (startMinutes / dayMinutes) * 100;
    const widthPercent = (duration / dayMinutes) * 100;

    Object.assign(session.style, {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    });

    const sessionWidthPx = session.getBoundingClientRect().width;
    if (sessionWidthPx < 40) {
      session.firstElementChild.style.fontSize = "8px";
      session.style.padding = "5px";
    } else {
      session.firstElementChild.style.fontSize = "";
      session.style.padding = "";
    }
  });
}

function setupDragAndDrop() {
  const sessions = document.querySelectorAll(".timeline__seances_movie");
  const timelines = document.querySelectorAll(".timeline__seances");

  sessions.forEach(session => {
    session.addEventListener("dragstart", e => {
      draggedElement = e.currentTarget;
      e.dataTransfer.effectAllowed = "move";
    });
    session.addEventListener("dragend", () => {
      draggedElement = null;
    });
  });

  timelines.forEach(timeline => {
    timeline.addEventListener("dragover", e => e.preventDefault());
    timeline.addEventListener("drop", e => {
      e.preventDefault();
      if (!draggedElement) return;

      const targetHallId = Number(timeline.dataset.id);
      const draggedHallId = Number(draggedElement.parentElement.dataset.id);

      if (targetHallId !== draggedHallId) {
        timeline.appendChild(draggedElement);
        updateControlButtonsState(true);
      }
    });
  });
}

function setupAddSessionForm() {
  fillSelectOptions();

  if (!initializedSubmitHandler) {
    initializedSubmitHandler = true;
    formAddSession.addEventListener("submit", e => {
      e.preventDefault();
      if (validateNewSession()) {
        addNewSession();
        popupAddSession.classList.add("popup--hidden");
        updateControlButtonsState(true);
      }
    });
  }
}

function fillSelectOptions() {
  selectSessionHall.innerHTML = "";
  selectSessionMovie.innerHTML = "";

  sessionData.result.halls.forEach(hall => {
    const option = document.createElement("option");
    option.value = hall.id;
    option.textContent = hall.hall_name;
    selectSessionHall.appendChild(option);
  });

  sessionData.result.films.forEach(film => {
    const option = document.createElement("option");
    option.value = film.id;
    option.textContent = film.film_name;
    option.dataset.duration = film.film_duration;
    selectSessionMovie.appendChild(option);
  });
}

function validateNewSession() {
  const hallId = Number(selectSessionHall.value);
  const filmOption = selectSessionMovie.options[selectSessionMovie.selectedIndex];
  const filmId = Number(filmOption.value);
  const filmDuration = Number(filmOption.dataset.duration);
  const time = inputSessionTime.value;

  if (!time) {
    alert("Пожалуйста, выберите время сеанса.");
    return false;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + filmDuration;

  if (endMinutes > 23 * 60 + 59) {
    alert("Сеанс должен заканчиваться не позднее 23:59.");
    return false;
  }

  const timeline = document.querySelector(`.timeline__seances[data-id="${hallId}"]`);
  const existingSessions = timeline ? timeline.querySelectorAll(".timeline__seances_movie") : [];

  for (const session of existingSessions) {
    const timeElem = session.querySelector(".timeline__movie_start");
    const [sh, sm] = timeElem.textContent.split(":").map(Number);
    const existingStart = sh * 60 + sm;
    const existingDuration = Number(timeElem.dataset.duration);
    const existingEnd = existingStart + existingDuration;

    if (startMinutes < existingEnd && endMinutes > existingStart) {
      alert("Новый сеанс пересекается с существующим.");
      return false;
    }
  }
  return true;
}

function addNewSession() {
  const hallId = selectSessionHall.value;
  const filmOption = selectSessionMovie.options[selectSessionMovie.selectedIndex];
  const filmId = filmOption.value;
  const filmName = filmOption.textContent;
  const filmDuration = filmOption.dataset.duration;
  const time = inputSessionTime.value;

  const timeline = document.querySelector(`.timeline__seances[data-id="${hallId}"]`);
  if (!timeline) return;

  const newSessionHTML = `
    <div class="timeline__seances_movie" data-filmid="${filmId}" data-seanceid="" draggable="true">
      <p class="timeline__seances_title">${filmName}</p>
      <p class="timeline__movie_start" data-duration="${filmDuration}">${time}</p>
    </div>
  `;

  timeline.insertAdjacentHTML("beforeend", newSessionHTML);
  positionSessions();
  setSessionBackgrounds();
  setupDragAndDrop();
}

function setupDeleteSessionPopup() {
  popupRemoveSession.querySelector(".popup__button_cancel").addEventListener("click", () => {
    popupRemoveSession.classList.add("popup--hidden");
  });
}

function bindDeleteSessionHandlers() {
  const deleteIcons = timelinesWrapper.querySelectorAll(".session-timeline__delete img");
  deleteIcons.forEach(icon => {
    icon.onclick = () => {
      const hallId = icon.parentElement.dataset.hallid;
      const timeline = document.querySelector(`.timeline__seances[data-id="${hallId}"]`);
      if (!timeline) return;

      timeline.classList.add("deletion-mode");
      timeline.onclick = event => {
        const target = event.target.closest(".timeline__seances_movie");
        if (target) {
          confirmDeleteSession(target);
        }
      };
    };
  });
}

function confirmDeleteSession(sessionElement) {
  const filmName = sessionElement.querySelector(".timeline__seances_title").textContent;
  const popupTitle = popupRemoveSession.querySelector(".popup__movie-title");
  popupTitle.textContent = filmName;

  popupRemoveSession.classList.remove("popup--hidden");

  const btnDelete = popupRemoveSession.querySelector(".popup__remove-seance_button_delete");
  const btnCancel = popupRemoveSession.querySelector(".popup__button_cancel");

  const onDelete = () => {
    const seanceId = sessionElement.dataset.seanceid;
    if (seanceId) deletedSessions.add(seanceId);
    sessionElement.remove();
    updateControlButtonsState(true);
    cleanup();
  };

  const onCancel = () => {
    cleanup();
  };

  function cleanup() {
    popupRemoveSession.classList.add("popup--hidden");
    btnDelete.removeEventListener("click", onDelete);
    btnCancel.removeEventListener("click", onCancel);
    const timelines = document.querySelectorAll(".timeline__seances");
    timelines.forEach(tl => {
      tl.classList.remove("deletion-mode");
      tl.onclick = null;
    });
  }

  btnDelete.addEventListener("click", onDelete);
  btnCancel.addEventListener("click", onCancel);
}

function setupControlButtons() {
  btnCancelSessions.addEventListener("click", () => {
    if (btnCancelSessions.classList.contains("button--disabled")) return;
    reloadSessions();
  });

  btnSaveSessions.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btnSaveSessions.classList.contains("button--disabled")) return;
    await saveSessions();
  });
}

function updateControlButtonsState(enabled = false) {
  [btnCancelSessions, btnSaveSessions].forEach(btn => {
    btn.classList.toggle("button--disabled", !enabled);
  });
}

async function reloadSessions() {
  const data = await fetchSessionsData();
  if (data) {
    deletedSessions.clear();
    initSessionsInterface(data);
  }
}

async function saveSessions() {
  const newSessions = getNewSessions();
  await Promise.all(newSessions.map(s => addSessionToServer(s)));

  await Promise.all(Array.from(deletedSessions).map(id => deleteSessionFromServer(id)));

  alert("Сеансы успешно сохранены!");
  deletedSessions.clear();
  updateControlButtonsState(false);
  await reloadSessions();
}

function getNewSessions() {
  const sessions = document.querySelectorAll(".timeline__seances_movie");
  return Array.from(sessions)
    .filter(s => s.dataset.seanceid === "")
    .map(s => {
      return {
        hallId: s.parentElement.dataset.id,
        filmId: s.dataset.filmid,
        time: s.querySelector(".timeline__movie_start").textContent
      };
    });
}

async function addSessionToServer(session) {
  const params = new FormData();
  params.set("seanceHallid", session.hallId);
  params.set("seanceFilmid", session.filmId);
  params.set("seanceTime", session.time);

  try {
    const response = await fetch("https://shfe-diplom.neto-server.ru/seance", {
      method: "POST",
      body: params,
    });
    const data = await response.json();
    console.log("Добавлен сеанс:", data);
  } catch (error) {
    console.error("Ошибка при добавлении сеанса:", error);
  }
}

async function deleteSessionFromServer(seanceId) {
  try {
    const response = await fetch(`https://shfe-diplom.neto-server.ru/seance/${seanceId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    console.log("Удалён сеанс:", data);
  } catch (error) {
    console.error("Ошибка при удалении сеанса:", error);
  }
}

async function fetchSessionsData() {
  try {
    const response = await fetch("https://shfe-diplom.neto-server.ru/alldata");
    if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    alert("Не удалось загрузить данные. Попробуйте позже.");
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchSessionsData();
  if (data) {
    initSessionsInterface(data);
  }
});
