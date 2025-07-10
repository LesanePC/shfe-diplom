const loginForm = document.querySelector(".login__form");
const emailInput = document.querySelector(".login__input.login__email");
const passwordInput = document.querySelector(".login__input.login__password");

function handleFormSubmit(event) {
	event.preventDefault();
	const isFormValid = emailInput.value.trim() && passwordInput.value.trim();
	if (isFormValid) {
		const formData = new FormData(loginForm);
		sendLoginRequest(formData);
	}
}

function sendLoginRequest(formData) {
	fetch("https://shfe-diplom.neto-server.ru/login", {
			method: "POST",
			body: formData,
		})
		.then(handleLoginResponse)
		.catch(handleError);
}

function handleLoginResponse(response) {
	response.json()
		.then(data => {
			if (data.success) {
				redirectToAdminPage();
			} else {
				alert("Неверный логин/пароль!");
			}
		});
}

function redirectToAdminPage() {
	document.location = "./adm-page.html";
}

function handleError(error) {
	console.error("Произошла ошибка при отправке запроса:", error);
}

loginForm.addEventListener("submit", handleFormSubmit);