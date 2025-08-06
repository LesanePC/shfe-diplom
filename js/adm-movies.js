document.addEventListener("DOMContentLoaded", () => {
  const addMovieBtn = document.querySelector(".button--add-movie");
  const moviesContainer = document.querySelector(".movies-grid");
  const popup = document.querySelector(".popup--add-movie");
  const cart = document.querySelector('.cart-container'); 
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

      formElements.addMovieForm.reset();
      posterFile = null;
      popup.classList.add("popup--hidden");

      if (data && data.id) {
        addMovieToList(data);
      } else {
        const updatedData = await fetchData();
        if (updatedData) renderMovies(updatedData);
      }
    } catch (error) {
      console.error("Ошибка при добавлении фильма:", error);
      alert("Не удалось добавить фильм. Попробуйте позже.");
    }
  };

  function addMovieToList(film) {
    const safeName = film.film_name.replace(/"/g, "&quot;");
    const movieCounter = (moviesContainer.children.length % 5) + 1;
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

    const newMovie = moviesContainer.querySelector(`.movie-item[data-id="${film.id}"]`);
    if (newMovie) {
      newMovie.addEventListener("dragstart", onMovieDragStart);
      newMovie.addEventListener("dragend", onMovieDragEnd);
    }
  }

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

      const movieElem = moviesContainer.querySelector(`.movie-item[data-id="${movieId}"]`);
      if (movieElem) movieElem.remove();

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

  function onMovieDragStart(e) {
    e.dataTransfer.setData("text/plain", e.currentTarget.dataset.id);
    if (cart) {
      setTimeout(() => cart.classList.add("visible"), 0);
    }
  }

  function onMovieDragEnd() {
    if (cart) {
      cart.classList.remove("visible");
    }
  }

  function attachDragHandlers() {
    const draggableMovies = moviesContainer.querySelectorAll(".movie-item[draggable='true']");
    draggableMovies.forEach(movie => {
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

    attachDragHandlers();
  };

  async function fetchData() {
    try {
      const response = await fetch("https://shfe-diplom.neto-server.ru/alldata");
      if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      alert("Не удалось загрузить данные. Попробуйте позже.");
      return null;
    }
  }

  (async () => {
    const initialData = await fetchData();
    if (initialData) renderMovies(initialData);
  })();

  if (cart) {
    cart.addEventListener('dragover', e => {
      e.preventDefault();
      cart.classList.add('cart--highlight');
    });
    cart.addEventListener('dragleave', () => {
      cart.classList.remove('cart--highlight');
    });
    cart.addEventListener('drop', e => {
      e.preventDefault();
      cart.classList.remove('cart--highlight');
      cart.classList.remove('visible');

      const movieId = e.dataTransfer.getData('text/plain');
      if (movieId) {
        console.log(`Добавляем фильм с id ${movieId} в корзину.`);
      }
    });
  }
});
