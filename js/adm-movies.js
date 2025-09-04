document.addEventListener("DOMContentLoaded", () => {
  const addMovieBtn = document.querySelector(".button--add-movie");
  const moviesContainer = document.querySelector(".movies-grid");
  const popup = document.querySelector(".popup--add-movie");
  const cart = document.querySelector('.cart-container');
  const seanceTimeline = document.querySelector(".seance-timeline");
  if (cart) cart.style.display = 'none';

  const showPopup = () => popup?.classList.remove("popup--hidden");
  addMovieBtn?.addEventListener("click", showPopup);

  const formElements = {
    addMovieForm: popup?.querySelector(".popup__form"),
    movieNameInput: popup?.querySelector("input[type='text']"),
    movieTimeInput: popup?.querySelector("input[type='number']"),
    movieSynopsisInput: popup?.querySelector("textarea"),
    movieCountryInput: popup ? popup.querySelectorAll("input[type='text']")[1] : null,
    uploadPosterBtn: popup?.querySelector(".popup__file-input"),
  };

  let posterFile = null;

  const validatePoster = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 3_000_000) {
        alert("Размер файла должен быть не более 3 Mb!");
        posterFile = null;
        event.target.value = "";
      } else {
        posterFile = file;
      }
    }
  };
  formElements.uploadPosterBtn?.addEventListener("change", validatePoster);

  const createFormData = () => {
    const formData = new FormData();
    const duration = Math.max(1, Number(formElements.movieTimeInput.value || 1));
    formData.set("filmName", formElements.movieNameInput.value.trim());
    formData.set("filmDuration", duration);
    formData.set("filmDescription", formElements.movieSynopsisInput.value.trim());
    formData.set("filmOrigin", formElements.movieCountryInput.value.trim());
    if (posterFile) formData.set("filePoster", posterFile);
    return formData;
  };

  const updateLocalStorageAndRender = (data) => {
    localStorage.setItem('moviesData', JSON.stringify(data));
    renderMovies(data);
  };

  const addMovie = async () => {
    try {
      const formData = createFormData();
      const response = await fetch("https://shfe-diplom.neto-server.ru/film", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();

      alert(`Фильм "${formElements.movieNameInput.value}" добавлен!`);

      let savedData = JSON.parse(localStorage.getItem('moviesData')) || { result: { films: [] } };
      if (!savedData.result.films.some(film => film.id === data.id)) {
        savedData.result.films.push(data);
      }

      updateLocalStorageAndRender(savedData);

      formElements.addMovieForm.reset();
      posterFile = null;
      popup.classList.add("popup--hidden");

    } catch (error) {
      console.error("Ошибка при добавлении фильма:", error);
      alert("Не удалось добавить фильм. Попробуйте позже.");
    }
  };

  const deleteMovie = async (movieId) => {
    try {
      const response = await fetch(`https://shfe-diplom.neto-server.ru/film/${movieId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      await response.json();
      alert("Фильм удален!");

      let savedData = JSON.parse(localStorage.getItem('moviesData')) || { result: { films: [] } };
      savedData.result.films = savedData.result.films.filter(film => film.id !== movieId);

      updateLocalStorageAndRender(savedData);

    } catch (error) {
      console.error("Ошибка при удалении фильма:", error);
      alert("Не удалось удалить фильм. Попробуйте позже.");
    }
  };

  const handleAddMovieFormSubmit = (e) => {
    e.preventDefault();

    if (!posterFile) {
      alert("Загрузите постер!");
      return;
    }

    addMovie();
  };

  formElements.addMovieForm?.addEventListener("submit", handleAddMovieFormSubmit);

  moviesContainer?.addEventListener("click", (e) => {
    if (e.target.classList.contains("movie-item__delete")) {
      const movieItem = e.target.closest(".movie-item");
      const movieId = movieItem?.dataset.id;
      if (movieId && confirm("Вы действительно хотите удалить этот фильм?")) {
        deleteMovie(movieId);
      }
    }
  });

  // Drag & Drop для фильмов на таймлайн зала

  let draggedMovieId = null;

  moviesContainer?.addEventListener("dragstart", (e) => {
    const movieItem = e.target.closest(".movie-item");
    if (!movieItem) return;
    draggedMovieId = movieItem.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedMovieId);
  });

  moviesContainer?.addEventListener("dragend", () => {
    draggedMovieId = null;
  });

  if (seanceTimeline) {
    seanceTimeline.addEventListener("dragover", e => {
      e.preventDefault();
      seanceTimeline.classList.add("drop-active");
    });
    seanceTimeline.addEventListener("dragleave", () => {
      seanceTimeline.classList.remove("drop-active");
    });
    seanceTimeline.addEventListener("drop", e => {
      e.preventDefault();
      seanceTimeline.classList.remove("drop-active");
      const movieId = e.dataTransfer.getData("text/plain") || draggedMovieId;
      if (movieId) {
        openSeancePopupWithMovie(movieId);
      }
    });
  }

  // Функция проверки пересечения интервалов времени
function intervalsOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function canAddSession(newStart, newEnd, existingSessions) {
  return !existingSessions.some(session => 
    intervalsOverlap(newStart, newEnd, session.start, session.end)
  );
}

function openSeancePopupWithMovie(movieId) {
  const savedData = JSON.parse(localStorage.getItem("moviesData"));
  if (!savedData) return;
  const film = savedData.result.films.find(f => f.id === movieId);
  if (!film) return;

  const seancePopup = document.querySelector(".popup--add-seance");
  if (!seancePopup) return;
  seancePopup.classList.remove("popup--hidden");

  const movieNameInput = seancePopup.querySelector(".seance-movie-name");
  const movieDurationInput = seancePopup.querySelector(".seance-movie-duration");
  if (movieNameInput) movieNameInput.value = film.film_name;
  if (movieDurationInput) movieDurationInput.value = film.film_duration;

  const seanceForm = seancePopup.querySelector("form");
  seanceForm.onsubmit = (e) => {
    e.preventDefault();

    const startTimeStr = seanceForm.querySelector(".seance-start-time").value;
    const startTime = new Date(startTimeStr).getTime();
    const duration = Number(movieDurationInput.value) || 0;
    const endTime = startTime + duration * 60 * 1000;

    const existingSessions = getExistingSessions();

    if (!canAddSession(startTime, endTime, existingSessions)) {
      alert("Новый сеанс пересекается с существующим!");
      return;
    }

    addNewSession({
      filmId: movieId,
      start: startTime,
      end: endTime
    });

    seancePopup.classList.add("popup--hidden");
    loadSessionsAndRender();
  };
}


  let draggedElement = null;

  function onMovieDragStart(event) {
    draggedElement = event.currentTarget;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", event.currentTarget.dataset.id);
    if (cart) cart.classList.add("visible");
    setTimeout(() => { draggedElement.style.visibility = "hidden"; }, 0);
  }

  function onMovieDragEnd() {
    if (draggedElement) draggedElement.style.visibility = "visible";
    draggedElement = null;
    if (cart) cart.classList.remove("visible");
  }

  function attachDragHandlers() {
    const movies = document.querySelectorAll(".timeline__seances_movie[draggable='true']");
    movies.forEach(movie => {
      movie.addEventListener("dragstart", onMovieDragStart);
      movie.addEventListener("dragend", onMovieDragEnd);
    });
  }

  const renderMovies = (data) => {
  if (!moviesContainer) return;

  moviesContainer.innerHTML = "";
  let movieCounter = 1;

  data.result.films.forEach((film) => {
    const safeName = film.film_name.replace(/"/g, "&quot;");
    const movieItemHTML = `
      <div class="movie-item background-${movieCounter}" data-id="${film.id}" draggable="true">
        <img src="${film.film_poster}" alt="Постер фильма ${safeName}" class="movie-item__poster" />
        <div class="movie-item__info">
          <p class="movie-item__title">${safeName}</p>
          <p class="movie-item__length"><span class="movie-item__time">${film.film_duration}</span> минут</p>
        </div>
        <span class="button--remove movie-item__delete" title="Удалить фильм"></span>
      </div>
    `;
    moviesContainer.insertAdjacentHTML("beforeend", movieItemHTML);
    movieCounter = movieCounter >= 5 ? 1 : movieCounter + 1;
  });

  const movieItems = moviesContainer.querySelectorAll('.movie-item');
  if (movieItems.length > 0) {
    attachDragHandlers();
    console.log(`Навешано обработчиков на ${movieItems.length} фильмов`);
  } else {
    console.log('Фильмы не найдены в контейнере после рендера');
  }
};


  async function fetchData() {
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

  (async () => {
    const initialData = await fetchData();
if (initialData) {
  renderMovies(initialData);

  const firstMovie = document.querySelector('.movie-item');
  if (firstMovie) {
    firstMovie.classList.add('background-3');
  } else {
    console.log('Фильмов нет в DOM');
  }
}

    
  })();

  if (cart) {
    cart.addEventListener('dragover', event => {
      event.preventDefault();
      cart.classList.add('cart--highlight');
    });
    cart.addEventListener('dragleave', () => {
      cart.classList.remove('cart--highlight');
    });
    cart.addEventListener('drop', async event => {
      event.preventDefault();
      cart.classList.remove('cart--highlight');
      cart.classList.remove('visible');
      const movieId = event.dataTransfer.getData('text/plain');
      if (movieId) {
        try {
          const response = await fetch('https://shfe-diplom.neto-server.ru/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filmId: movieId }),
          });
          if (!response.ok) throw new Error(`Ошибка при добавлении в корзину: ${response.status}`);
          await response.json();
          alert(`Фильм успешно добавлен в корзину!`);
        } catch (error) {
          console.error(error);
          alert('Не удалось добавить фильм в корзину. Попробуйте позже.');
        }
      }
    });
  }
});
