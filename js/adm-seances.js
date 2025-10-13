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
let isInterfaceInitialized = false;
let isDeletionMode = false;
let dragAndDropHandlersInitialized = false;

const localStorageSessionsKey = "sessionsData";

window.sharedAllDataPromise = null;

function fetchSessionsData(forceUpdate = false) {
  if (!forceUpdate && window.sharedAllDataPromise) {
    return window.sharedAllDataPromise;
  }

  if (!forceUpdate) {
    const cachedDataStr = localStorage.getItem(localStorageSessionsKey);
    if (cachedDataStr) {
      try {
        const cachedData = JSON.parse(cachedDataStr);
        console.log("Данные сеансов загружены из localStorage");
        window.sharedAllDataPromise = Promise.resolve(cachedData);
        return window.sharedAllDataPromise;
      } catch (e) {
        console.warn("Ошибка парсинга sessionsData из localStorage", e);
        localStorage.removeItem(localStorageSessionsKey);
      }
    }
  }

  window.sharedAllDataPromise = fetch("https://shfe-diplom.neto-server.ru/alldata")
    .then(response => {
      if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
      return response.json();
    })
    .then(data => {
      localStorage.setItem(localStorageSessionsKey, JSON.stringify(data));
      console.log("Данные сеансов загружены с сервера и сохранены в localStorage");
      return data;
    })
    .catch(error => {
      console.error("Ошибка при загрузке данных:", error);
      alert("Не удалось загрузить данные. Попробуйте позже.");
      throw error;
    });

  return window.sharedAllDataPromise;
}

async function initSessionsInterface(forceFetch = false) {
  if (isInterfaceInitialized && !forceFetch) {
    console.log("Интерфейс уже инициализирован, повторный вызов пропущен");
    return;
  }
  isInterfaceInitialized = true;

  const data = await fetchSessionsData(forceFetch);
  if (!data) return;

  sessionData = data;

  renderTimelines(data.result.halls);
  loadSessions(data);
  setSessionBackgrounds();
  positionSessions();
  bindDeleteSessionHandlers();

  if (!dragAndDropHandlersInitialized) {
    setupDragAndDropDelegation();
    dragAndDropHandlersInitialized = true;
  }

  setupAddSessionForm();
  setupDeleteSessionPopup();
  setupControlButtons();
  updateControlButtonsState(false);
}

function renderTimelines(halls) {
  console.log("renderTimelines старт. Очистка контейнера timelinesWrapper");
  timelinesWrapper.innerHTML = "";
  halls.forEach(hall => {
    const section = document.createElement("section");
    section.classList.add("movie-seances__timeline");
    section.innerHTML = `
      <div class="session-timeline__delete" data-hallid="${hall.id}" title="Удалить сеанс">
        <img src="./img/trash.png" alt="Удалить сеанс">
      </div>
      <h3 class="timeline__hall_title">${hall.hall_name}</h3>
      <div class="timeline__seances" data-id="${hall.id}"></div>
    `;
    timelinesWrapper.appendChild(section);
  });
  console.log("renderTimelines завершено. Таймлайн отрисован");
}

function loadSessions(data) {
  const timelines = timelinesWrapper.querySelectorAll(".timeline__seances");
  console.log("loadSessions: найдено таймлайнов:", timelines.length);

  timelines.forEach(timeline => {
    const hallId = timeline.dataset.id;
    const sessionsForHall = data.result.seances.filter(s => String(s.seance_hallid) === String(hallId));

    let html = sessionsForHall
      .map(session => {
        const film = data.result.films.find(f => f.id === Number(session.seance_filmid));
        return film ? createSessionHTML(session, film) : "";
      })
      .join("");

    timeline.innerHTML = html;

    console.log(`loadSessions: hallId ${hallId}, сессий: ${sessionsForHall.length}`);
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
    if (isNaN(hours) || isNaN(minutes)) return;

    const startMinutes = hours * 60 + minutes;
    const duration = Number(timeElem.dataset.duration);

    const leftPercent = (startMinutes / dayMinutes) * 100;
    const widthPercent = (duration / dayMinutes) * 100;

    Object.assign(session.style, {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
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

function setupDragAndDropDelegation() {
  timelinesWrapper.addEventListener("dragstart", event => {
    const target = event.target.closest(".timeline__seances_movie");
    if (!target) return;
    draggedElement = target;
    document.querySelectorAll(".session-timeline__delete").forEach(deleteIcon => {
      deleteIcon.style.opacity = "1";
      deleteIcon.style.pointerEvents = "auto";
    });

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", target.dataset.seanceid || "");
  });

  timelinesWrapper.addEventListener("dragend", () => {
    draggedElement = null;
    document.querySelectorAll(".session-timeline__delete").forEach(deleteIcon => {
      deleteIcon.style.opacity = "0";
      deleteIcon.style.pointerEvents = "none";
    });
  });

  timelinesWrapper.addEventListener("dragover", event => {
    if (!event.target.closest(".timeline__seances")) return;
    event.preventDefault();
  });

  timelinesWrapper.addEventListener("dragover", event => {
  if (!event.target.closest(".timeline__seances") && !event.target.closest(".session-timeline__delete")) return;
  event.preventDefault();
});

timelinesWrapper.addEventListener("drop", event => {
  event.preventDefault();
  if (!draggedElement) return;

  const deleteBin = event.target.closest(".session-timeline__delete");

  if (deleteBin) {
    confirmDeleteSession(draggedElement);
    draggedElement = null;
    return;
  }

  const timeline = event.target.closest(".timeline__seances");
  if (!timeline) return;
  const targetHallId = Number(timeline.dataset.id);
  const draggedHallId = Number(draggedElement.parentElement.dataset.id);

  if (targetHallId !== draggedHallId) {
    timeline.appendChild(draggedElement);
    updateControlButtonsState(true);
    positionSessions();
    setSessionBackgrounds();
  }
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

  const timeParts = time.split(":").map(Number);
  if (timeParts.length !== 2 || timeParts.some(isNaN)) {
    alert("Некорректный формат времени. Используйте HH:mm.");
    return false;
  }

  const [hours, minutes] = timeParts;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    alert("Некорректное время. Используйте часы 00-23 и минуты 00-59.");
    return false;
  }

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
      if (isDeletionMode) return;
      const hallId = icon.parentElement.dataset.hallid;
      const timeline = document.querySelector(`.timeline__seances[data-id="${hallId}"]`);
      if (!timeline) return;

      enterDeletionMode(timeline);
    };
  });
}

function enterDeletionMode(timeline) {
  isDeletionMode = true;
  timeline.classList.add("deletion-mode");
  timeline.addEventListener("click", onTimelineClickDelete);
}

function exitDeletionMode() {
  isDeletionMode = false;
  const timelines = document.querySelectorAll(".timeline__seances");
  timelines.forEach(tl => {
    tl.classList.remove("deletion-mode");
    tl.removeEventListener("click", onTimelineClickDelete);
  });
}

function onTimelineClickDelete(event) {
  const target = event.target.closest(".timeline__seances_movie");
  if (target) {
    confirmDeleteSession(target);
  }
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
    exitDeletionMode();
  }

  btnDelete.addEventListener("click", onDelete);
  btnCancel.addEventListener("click", onCancel);
}

function setupControlButtons() {
  btnCancelSessions.addEventListener("click", () => {
    if (btnCancelSessions.disabled) return;
    reloadSessions();
  });

  btnSaveSessions.addEventListener("click", async e => {
    e.preventDefault();
    if (btnSaveSessions.disabled) return;
    await saveSessions();
  });
}

function updateControlButtonsState(enabled = false) {
  [btnCancelSessions, btnSaveSessions].forEach(btn => {
    btn.disabled = !enabled;
    btn.classList.toggle("button--disabled", !enabled);
  });
}

async function reloadSessions() {
  const scrollTop = timelinesWrapper.scrollTop;
  deletedSessions.clear();
  isInterfaceInitialized = false;
  await initSessionsInterface(true);
  timelinesWrapper.scrollTop = scrollTop;
  updateControlButtonsState(false);
}

async function saveSessions() {
  const newSessions = getNewSessions();

  try {
    await Promise.all(newSessions.map(s => addSessionToServer(s)));
    await Promise.all(Array.from(deletedSessions).map(id => deleteSessionFromServer(id)));

    alert("Сеансы успешно сохранены!");
    deletedSessions.clear();
    updateControlButtonsState(false);

    const freshData = await fetchSessionsData(true);
    if (freshData) {
      updateSessionsInLocalStorage(freshData);
      await initSessionsInterface(true);
    }
  } catch (error) {
    alert("Ошибка при сохранении сеансов. Попробуйте позже.");
    console.error(error);
  }
}

function getNewSessions() {
  const sessions = document.querySelectorAll(".timeline__seances_movie");
  return Array.from(sessions)
    .filter(s => s.dataset.seanceid === "")
    .map(s => ({
      hallId: s.parentElement.dataset.id,
      filmId: s.dataset.filmid,
      time: s.querySelector(".timeline__movie_start").textContent,
    }));
}

async function addSessionToServer(session) {
  const params = new FormData();
  params.set("seanceHallid", session.hallId);
  params.set("seanceFilmid", session.filmId);
  params.set("seanceTime", session.time);

  const response = await fetch("https://shfe-diplom.neto-server.ru/seance", {
    method: "POST",
    body: params,
  });

  if (!response.ok)
    throw new Error(`Ошибка при добавлении сеанса: ${response.status}`);
  const data = await response.json();
  console.log("Добавлен сеанс:", data);
}

async function deleteSessionFromServer(seanceId) {
  const response = await fetch(
    `https://shfe-diplom.neto-server.ru/seance/${seanceId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok)
    throw new Error(`Ошибка при удалении сеанса: ${response.status}`);
  const data = await response.json();
  console.log("Удалён сеанс:", data);
}

function updateSessionsInLocalStorage(updatedData) {
  try {
    localStorage.setItem(localStorageSessionsKey, JSON.stringify(updatedData));
    console.log("LocalStorage успешно обновлён");
  } catch (e) {
    console.error("Ошибка обновления localStorage:", e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initSessionsInterface();
});

async function refreshSessionsData() {
  isInterfaceInitialized = false;
  window.sharedAllDataPromise = null;
  await initSessionsInterface(true);
}