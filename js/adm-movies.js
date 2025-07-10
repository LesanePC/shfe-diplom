document.addEventListener("DOMContentLoaded", () => {
	const addMovieBtn = document.querySelector(".button--add-movie");
	const moviesContainer = document.querySelector(".movies-grid");

	const showPopup = () => {
		const popup = document.querySelector(".popup--add-movie");
		popup?.classList.remove("popup--hidden");
	};

	addMovieBtn?.addEventListener("click", showPopup);

	const formElements = {
		addMovieForm: document.querySelector(".popup--add-movie .popup__form"),
		movieNameInput: document.querySelector(
			".popup--add-movie input[type='text']"
		),
		movieTimeInput: document.querySelector(
			".popup--add-movie input[type='number']"
		),
		movieSynopsisInput: document.querySelector(".popup--add-movie textarea"),
		movieCountryInput: document.querySelectorAll(
			".popup--add-movie input[type='text']"
		)[1],
		uploadPosterBtn: document.querySelector(".popup__file-input"),
	};

	let posterFile;

	const createFormData = () => {
		const formData = new FormData();
		const duration = Math.max(1, Number(formElements.movieTimeInput.value));

		formData.set("filmName", formElements.movieNameInput.value);
		formData.set("filmDuration", duration);
		formData.set("filmDescription", formElements.movieSynopsisInput.value);
		formData.set("filmOrigin", formElements.movieCountryInput.value);
		if (posterFile) formData.set("filePoster", posterFile);
		return formData;
	};

	const addMovie = (posterFile) => {
		const formData = createFormData();
		fetch("https://shfe-diplom.neto-server.ru/film", {
				method: "POST",
				body: formData,
			})
			.then((response) => response.json())
			.then(() => {
				alert(`Фильм ${formElements.movieNameInput.value} добавлен!`);
			})
			.then(async () => {
				const updatedData = await fetchData(false);
				if (updatedData) renderMovies(updatedData);
			})
			.then(() => location.reload())
			.catch(console.error);
	};

	const deleteMovie = (movieId) => {
		fetch(`https://shfe-diplom.neto-server.ru/film/${movieId}`, {
				method: "DELETE",
			})
			.then((response) => response.json())
			.then(() => {
				alert("Фильм удален!");
			})
			.then(async () => {
				const updatedData = await fetchData(false);
				if (updatedData) renderMovies(updatedData);
			})
			.catch(console.error);
	};

	const validatePoster = (event) => {
		const file = event.target.files?.[0];
		if (file) {
			const fileSize = file.size;
			if (fileSize > 3000000) {
				alert("Размер файла должен быть не более 3 Mb!");
			} else {
				posterFile = file;
			}
		}
	};

	const handleAddMovieFormSubmit = (e) => {
		e.preventDefault();
		if (!posterFile) {
			alert("Загрузите постер!");
			return;
		}
		addMovie(posterFile);
	};

	const handleMovieDelete = (e) => {
		if (e.target.classList.contains("movie-item__delete")) {
			const movieItem = e.target.closest(".movie-item");
			const movieId = movieItem?.dataset.id;
			if (movieId && confirm("Вы действительно хотите удалить этот фильм?")) {
				deleteMovie(movieId);
			}
		}
	};

	const renderMovies = (data) => {
		if (!moviesContainer) return;

		moviesContainer.innerHTML = "";
		let movieCounter = 1;

		data.result.films.forEach((film) => {
			const movieItemHTML = `
        <div class="movie-item background-${movieCounter}" data-id="${film.id}" draggable="true">
          <img src="${film.film_poster}" alt="постер" class="movie-item__poster">
          <div class="movie-item__info">
            <p class="movie-item__title">${film.film_name}</p>
            <p class="movie-item__length"><span class="movie-item__time">${film.film_duration}</span> минут</p>
          </div>
          <span class="button--remove movie-item__delete"></span>
        </div>
      `;
			moviesContainer.insertAdjacentHTML("beforeend", movieItemHTML);
			movieCounter = movieCounter > 5 ? 1 : movieCounter + 1;
		});
	};

	window.operaciiFilmov = (data) => renderMovies(data);

	formElements.uploadPosterBtn?.addEventListener("change", validatePoster);
	formElements.addMovieForm?.addEventListener(
		"submit",
		handleAddMovieFormSubmit
	);

	moviesContainer?.addEventListener("click", handleMovieDelete);

	formElements.movieTimeInput.addEventListener("input", () => {
		if (Number(formElements.movieTimeInput.value) < 0) {
			formElements.movieTimeInput.value = 1;
		}
	});
});