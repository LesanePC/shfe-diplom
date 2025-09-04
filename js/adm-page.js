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
    const savedData = localStorage.getItem("allDataCache");
    if (!savedData) {
      console.warn("Данные в localStorage отсутствуют");
      return null;
    }
    const parsedData = JSON.parse(savedData);
    console.log("Данные получены из localStorage");
    if (callHandlers) updateHallsUI(parsedData);
    return parsedData;
  } catch (error) {
    console.error("Ошибка при работе с localStorage:", error);
    return null;
  }
}


(async () => {
  await fetchData();
})();

function clearCache() {
  localStorage.removeItem("allDataCache");
  console.log("Кэш localStorage очищен");
}
