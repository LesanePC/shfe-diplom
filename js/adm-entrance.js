const loginForm = document.querySelector(".login__form");
const emailInput = document.querySelector(".login__input.login__email");
const passwordInput = document.querySelector(".login__input.login__password");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  const formData = new FormData(loginForm);

  try {
    const response = await fetch("https://shfe-diplom.neto-server.ru/login", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Статус: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      redirectToAdminPage();
    } else {
      alert("Неверный логин или пароль.");
    }
  } catch (error) {
    console.error("Ошибка при отправке запроса:", error);
    alert("Произошла ошибка при входе. Попробуйте позже.");
  }
});

function redirectToAdminPage() {
  window.location.href = "./adm-page.html";
}
