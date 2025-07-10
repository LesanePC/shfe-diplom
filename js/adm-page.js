document.querySelectorAll(".admin-section__toggle").forEach((toggleArrow) => {
  toggleArrow.onclick = () => {
    const sectionHeader = toggleArrow.closest(".admin-section__header");
    const contentWrapper = sectionHeader?.nextElementSibling;
    toggleArrow.classList.toggle("admin__header_arrow-hide");
    contentWrapper?.classList.toggle("admin__wrapper-hide");
  };
});

document.querySelectorAll(".popup").forEach((popupElement) => {
  const closeButton = popupElement.querySelector(".popup__close");
  const cancelButton = popupElement.querySelector(".button--cancel");
  const formElement = popupElement.querySelector(".popup__form");

  closeButton?.addEventListener("click", () => {
    popupElement.classList.add("popup--hidden");
  });

  cancelButton?.addEventListener("click", () => {
    formElement?.reset();
    popupElement.classList.add("popup--hidden");
  });
});

async function fetchData(callHandlers = true) {
  try {
    const response = await fetch("https://shfe-diplom.neto-server.ru/alldata");
    const data = await response.json();

    updateHallsUI(data);
    operaciiFilmov(data);
    operaciiSeansov(data);
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    return null;
  }
}

(async () => {
  await fetchData();
})();
