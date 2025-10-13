document.querySelectorAll(".admin-section__toggle").forEach((toggleArrow, index) => {
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

    localStorage.setItem(`adminSectionHidden_${index}`, isNowHidden.toString());
  };
});

document.querySelectorAll(".popup").forEach((popupElement, index) => {
  const closeButton = popupElement.querySelector(".popup__close");
  const cancelButton = popupElement.querySelector(".button--cancel");
  const formElement = popupElement.querySelector(".popup__form");

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

window.sharedAllDataPromise = null;

function getAllDataPromise() {
  if (window.sharedAllDataPromise) return window.sharedAllDataPromise;
  window.sharedAllDataPromise = fetch("https://shfe-diplom.neto-server.ru/alldata")
    .then(response => {
      if (!response.ok) throw new Error("Ошибка сети: " + response.status);
      return response.json();
    })
    .catch(error => {
      alert("Не удалось загрузить данные. Попробуйте позже.");
      throw error;
    });
  return window.sharedAllDataPromise;
}

async function fetchData() {
  try {
    const data = await getAllDataPromise();
    updateHallsUI(data);
    return data;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    return null;
  }
}

(async () => {
  await fetchData();
})();
