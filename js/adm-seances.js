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
let draggedFilmId = null;
let sessionData = null;
let originalParent = null;
let originalNextSibling = null;
let initializedSubmitHandler = false;
let deletedSessions = new Set();
let dragAndDropHandlersInitialized = false;
let isDeletionMode = false;


function setupAddSessionForm() {
  fillSelectOptions();

  if (!initializedSubmitHandler) {
    initializedSubmitHandler = true;

    formAddSession.addEventListener("submit", e => {
      e.preventDefault();

      if (validateNewSession()) {
        if (draggedElement) {
          draggedElement.querySelector('.timeline__movie_start').textContent = inputSessionTime.value;
          const duration = selectSessionMovie.options[selectSessionMovie.selectedIndex].dataset.duration;
          draggedElement.querySelector('.timeline__movie_start').dataset.duration = duration;
          draggedElement.dataset.seanceid = `temp-${Date.now()}`;
          draggedElement = null;
        }
        popupAddSession.classList.add("popup--hidden");
        updateControlButtonsState(true);
        positionSessions();
        setSessionBackgrounds();
      }
    });
  }
}

async function fetchSessionsData() {
  try {
    const savedData = localStorage.getItem('sessionsData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData && parsedData.result && parsedData.result.halls && parsedData.result.films) {
        console.log('Данные сессий загружены из localStorage');
        return parsedData;
      }
    }
    const response = await fetch("https://shfe-diplom.neto-server.ru/alldata");
    if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
    const data = await response.json();
    localStorage.setItem('sessionsData', JSON.stringify(data));
    console.log('Данные сессий загружены с сервера и сохранены в localStorage');
    return data;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    alert("Не удалось загрузить данные. Попробуйте позже.");
    return null;
  }
}

async function initSessionsInterface(data) {
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
    if (isNaN(hours) || isNaN(minutes)) return;

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

function setupDragAndDropDelegation() {
  const cart = document.querySelector('.cart-container');

  // Сделать фильмы draggable и передавать filmId при dragstart
  document.querySelectorAll('.movie-item').forEach(movie => {
    movie.setAttribute('draggable', 'true');
    movie.addEventListener('dragstart', e => {
      const filmId = movie.dataset.id;
      e.dataTransfer.setData('text/plain', filmId);
      draggedFilmId = filmId;
    });
  });

  // Drag and drop фильмы в таймлайн (создаем новый сеанс)
  document.querySelectorAll('.timeline__seances').forEach(timeline => {
    timeline.addEventListener('dragover', e => e.preventDefault());
    timeline.addEventListener('drop', e => {
      e.preventDefault();
      const filmId = e.dataTransfer.getData('text/plain');
      if (!filmId) return;

      const movieData = sessionData.result.films.find(f => String(f.id) === filmId);
      if (!movieData) return;

      const seanceDiv = document.createElement('div');
      seanceDiv.className = 'timeline__seances_movie';
      seanceDiv.setAttribute('draggable', 'true');
      seanceDiv.dataset.filmid = filmId;
      seanceDiv.dataset.seanceid = `temp-${Date.now()}`;
      seanceDiv.innerHTML = `
        <p class="timeline__seances_title">${movieData.film_name}</p>
        <p class="timeline__movie_start" data-duration="${movieData.film_duration}"></p>
      `;
      timeline.appendChild(seanceDiv);

      // Открываем попап с редактированием данных сеанса
      popupAddSession.classList.remove('popup--hidden');
      selectSessionMovie.value = filmId;
      selectSessionHall.value = timeline.dataset.id;
      inputSessionTime.value = '';

      draggedElement = seanceDiv;
    });
  });

  // Переменные для dragged элемента и его окружения
let draggedElement = null;
let originalParent = null;
let originalNextSibling = null;

// Обработчики dragstart и dragend на timelinesWrapper для сеансов
timelinesWrapper.addEventListener('dragstart', event => {
  const target = event.target.closest('.timeline__seances_movie');
  if (!target) return;

  draggedElement = target;
  originalParent = target.parentElement;
  originalNextSibling = target.nextElementSibling;
  const seanceId = target.dataset.seanceid;
  console.log('dragstart seanceId:', seanceId);

  const timelineSection = target.closest('.movie-seances__timeline');
  const deleteBox = timelineSection?.querySelector('.session-timeline__delete');
  if (deleteBox) {
    deleteBox.classList.add('visible');
  }

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', seanceId || '');
});

timelinesWrapper.addEventListener('dragend', () => {
  document.querySelectorAll('.session-timeline__delete.visible').forEach(deleteBox => {
    deleteBox.classList.remove('visible');
  });
  draggedElement = null;
});

// Разрешение drop на самой секции таймлайна
timelinesWrapper.addEventListener('dragover', event => {
  if (event.target.closest('.timeline__seances')) {
    event.preventDefault();
  }
});

// Drop и перемещение сеанса между залами с вызовом попапа
timelinesWrapper.addEventListener('drop', event => {
  event.preventDefault();
  const targetTimeline = event.target.closest('.timeline__seances');
  if (!targetTimeline || !draggedElement) return;

  const targetHallId = Number(targetTimeline.dataset.id);
  const draggedHallId = Number(draggedElement.parentElement.dataset.id);

  if (targetHallId !== draggedHallId) {
    draggedElement.dataset.targetHallId = targetHallId;

    popupAddSession.classList.remove('popup--hidden');
    selectSessionHall.value = targetHallId;
    selectSessionMovie.value = draggedElement.dataset.filmid;
    inputSessionTime.value = '';

  }
});

// Настройка корзины удаления сеансов
document.querySelectorAll('.session-timeline__delete').forEach(deleteBox => {
  deleteBox.addEventListener('dragenter', e => e.preventDefault());
  deleteBox.addEventListener('dragover', e => {
    e.preventDefault();
    deleteBox.classList.add('dragover');
  });
  deleteBox.addEventListener('dragleave', e => {
    deleteBox.classList.remove('dragover');
  });
  deleteBox.addEventListener('drop', e => {
    e.preventDefault();
    deleteBox.classList.remove('dragover');
    deleteBox.classList.remove('visible');

    const seanceId = e.dataTransfer.getData('text/plain');
    console.log('Drop в корзину, seanceId:', seanceId);

    if (!seanceId) {
      console.warn('SeanceId не найден в событии drop');
      return;
    }

    const elementToRemove = document.querySelector(`[data-seanceid="${seanceId}"]`);
    if (elementToRemove) {
      elementToRemove.remove();
      alert("Сеанс удалён");
      updateControlButtonsState(true);
    } else {
      console.warn('Элемент не найден для удаления');
    }

    draggedElement = null;
  });
});
}

formAddSession.addEventListener('submit', e => {
  e.preventDefault();
  if (!draggedElement) return;

  if (validateNewSession()) {
    const targetHallId = draggedElement.dataset.targetHallId;

    if (targetHallId && Number(targetHallId) !== Number(draggedElement.parentElement.dataset.id)) {
      const newParent = document.querySelector(`.timeline__seances[data-id="${targetHallId}"]`);
      if (newParent) {
        newParent.appendChild(draggedElement);
        delete draggedElement.dataset.targetHallId;
      }
    }

    draggedElement.querySelector('.timeline__movie_start').textContent = inputSessionTime.value;
    const duration = selectSessionMovie.options[selectSessionMovie.selectedIndex].dataset.duration;
    draggedElement.querySelector('.timeline__movie_start').dataset.duration = duration;
    draggedElement.dataset.seanceid = `temp-${Date.now()}`;

    draggedElement = null;
    popupAddSession.classList.add('popup--hidden');
    updateControlButtonsState(true);
    positionSessions();
    setSessionBackgrounds();
  }
});

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

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function validateNewSession() {
  const hallId = Number(selectSessionHall.value);
  const filmOption = selectSessionMovie.options[selectSessionMovie.selectedIndex];
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

  const startMinutes = timeToMinutes(time);
  const endMinutes = startMinutes + filmDuration;

  if (endMinutes > 23 * 60 + 59) {
    alert("Сеанс должен заканчиваться не позднее 23:59.");
    return false;
  }

  const timeline = document.querySelector(`.timeline__seances[data-id="${hallId}"]`);
  if (!timeline) return true;

  const existingSessions = timeline.querySelectorAll(".timeline__seances_movie");
  for (const session of existingSessions) {
    const timeElem = session.querySelector(".timeline__movie_start");
    if (!timeElem) continue;

    const timeText = timeElem.textContent.trim();
    if (!timeText) continue;

    const existingStart = timeToMinutes(timeText);
    const existingDuration = Number(timeElem.dataset.duration);
    const existingEnd = existingStart + existingDuration;

    const draggedSeanceId = draggedElement ? draggedElement.dataset.seanceid : null;
    if (session.dataset.seanceid === draggedSeanceId) continue;

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
  icon.addEventListener("click", () => {
    if (isDeletionMode) return;
    const hallId = icon.parentElement.dataset.hallid;
    const timeline = document.querySelector(`.timeline__seances[data-id="${hallId}"]`);
    if (!timeline) return;

    enterDeletionMode(timeline);
  });
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

  const cart = document.querySelector('.cart-container');
  if (cart) {
    cart.classList.remove('visible');
    cart.style.display = 'none';
  }

  const btnDelete = popupRemoveSession.querySelector(".popup__remove-seance_button_delete");
  const btnCancel = popupRemoveSession.querySelector(".popup__button_cancel");

  const onDelete = () => {
    if (cart) {
      cart.classList.remove("visible");
      cart.style.display = "none";
    }
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

function collectSessionsPositions() {
  const sessions = document.querySelectorAll(".timeline__seances_movie");
  return Array.from(sessions).map(session => ({
    seanceId: session.dataset.seanceid,
    hallId: session.parentElement.dataset.id,
    startTime: session.querySelector('.timeline__movie_start').textContent,
    duration: session.querySelector('.timeline__movie_start').dataset.duration,
  }));
}

async function saveSessions() {
  const updatedSessions = collectSessionsPositions();

  try {
    const response = await fetch('https://shfe-diplom.neto-server.ru/film', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessions: updatedSessions }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const result = await response.json();
    alert("Сеансы успешно сохранены!");
    await reloadSessions();
  } catch (error) {
    alert('Ошибка при сохранении сеансов. Попробуйте позже.');
    console.error(error);
  }
}

function setupControlButtons() {
  btnCancelSessions.addEventListener("click", () => {
    if (btnCancelSessions.disabled) return;
    reloadSessions();
  });

  btnSaveSessions.addEventListener("click", async (e) => {
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
  const data = await fetchSessionsData();
  if (data) {
    deletedSessions.clear();
    initSessionsInterface(data);
    timelinesWrapper.scrollTop = scrollTop;
    updateControlButtonsState(false);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchSessionsData();
  if (data) {
    initSessionsInterface(data);
  }
});
