// Восстановление состояния раскрытия секций из localStorage
document.querySelectorAll(".admin-section__toggle").forEach((toggleArrow, index) => {
  // Восстанавливаем состояние из localStorage
  const isHidden = localStorage.getItem(`adminSectionHidden_${index}`) === "true";
  const sectionHeader = toggleArrow.closest(".admin-section__header");
  const contentWrapper = sectionHeader?.nextElementSibling;

  if (isHidden) {
    toggleArrow.classList.add("admin__header_arrow-hide");
    contentWrapper?.classList.add("admin__wrapper-hide");
  }

  toggleArrow.onclick = () => {
    toggleArrow.classList.toggle("admin__header_arrow-hide");
    const isNowHidden = toggleArrow.classList.contains("admin__header_arrow-hide");
    contentWrapper?.classList.toggle("admin__wrapper-hide");

    // Запоминаем состояние при клике
    localStorage.setItem(`adminSectionHidden_${index}`, isNowHidden.toString());
  };
});

// Обработка попапов с сохранением состояния не показан
document.querySelectorAll(".popup").forEach((popupElement, index) => {
  const closeButton = popupElement.querySelector(".popup__close");
  const cancelButton = popupElement.querySelector(".button--cancel");
  const formElement = popupElement.querySelector(".popup__form");

  // Восстановить состояние видимости попапа
  const isHidden = localStorage.getItem(`popupHidden_${index}`) === "true";
  if (isHidden) {
    popupElement.classList.add("popup--hidden");
  }

  closeButton?.addEventListener("click", () => {
    popupElement.classList.add("popup--hidden");
    localStorage.setItem(`popupHidden_${index}`, "true");
  });

  cancelButton?.addEventListener("click", () => {
    formElement?.reset();
    popupElement.classList.add("popup--hidden");
    localStorage.setItem(`popupHidden_${index}`, "true");
  });
});

async function fetchData(callHandlers = true) {
  try {
    const response = await fetch("https://shfe-diplom.neto-server.ru/alldata");
    const data = await response.json();

    updateHallsUI(data);

  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    return null;
  }
}

(async () => {
  await fetchData();
})();
