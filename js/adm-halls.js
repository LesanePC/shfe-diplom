const addHallButton = document.querySelector(".button--hall");
let hallRemoveButtons;
const hallsList = document.querySelector(".halls-list");
const adminInfoSection = document.querySelector(".admin-section__info");

let hallConfigArray = [];
let hallConfigElements;
const hallConfigWrapper = document.querySelector(".hall-config");
const hallConfigList = document.querySelector(".hall-config__list");
const hallConfigSection = document.querySelector(".admin-section--hall-config");

let currentHallConfigId;
let currentHallConfigIndex;
let updatedHallConfigArray;

let hallConfigForm;
let hallRowsInput;
let hallSeatsInput;
let hallSeatsScheme;
let hallRowsElements;
let hallSeatsElements;
let hallSeatsSpans;
let hallConfigCancelButton;
let hallConfigSaveButton;

let currentPriceConfigId;
const priceConfigList = document.querySelector(".price-config__list");
let priceConfigElements;
const priceConfigWrapper = document.querySelector(".price-config");
const priceConfigSection = document.querySelector(".admin-section--prices");
let priceConfigForm = document.querySelector(".price-config__form");
const priceInputs = document.querySelectorAll(".price-config__input");
let priceStandardInput = priceInputs[0];
let priceVipInput = priceInputs[1];
let priceConfigCancelButton = document.querySelector(".price-config__button_cancel");
let priceConfigSaveButton = document.querySelector(".price-config__button_save");

const salesSection = document.querySelector(".admin-section--sales");
const salesList = document.querySelector(".sales__list");
const salesControlWrapper = document.querySelector(".sales-control");
let salesInfoText;
let salesToggleButton;
let currentSalesHallId;

let currentHallStatus;
let newHallStatus;

const sessionsTimeline = document.querySelector(".sessions-timeline");
let sessionDeleteButtons;

function updateVisibleSections() {
	const sectionsToToggle = [
		adminInfoSection,
		hallsList,
		hallConfigSection,
		sessionsTimeline,
		salesSection,
	];

	const action = hallsList.innerText.trim() ? "remove" : "add";

	sectionsToToggle.forEach((el) => el.classList[action]("hidden"));
}

addHallButton.addEventListener("click", () => {
	addHallPopup.classList.remove("popup--hidden");
});

const addHallPopup = document.querySelector(".popup--add-hall");
const addHallForm = document.querySelector(".popup__form");
const addHallInput = document.querySelector(".popup__input");
const addHallConfirmButton = document.querySelector(".button--confirm");

addHallForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	submitAddHallForm(addHallInput);
	const updatedData = await fetchData(false);
	if (updatedData) updateHallsUI(updatedData);
	location.reload();
});

function submitAddHallForm(inputField) {
	const hallName = inputField.value.trim();
	if (hallName) {
		sendHallData(hallName).then((data) => {
			if (data && data.result && data.result.halls) {
				appendHallToList(data.result.halls.id, hallName);
				clearInput(inputField);
			}
		});
	}
}

async function sendHallData(hallName) {
	const formData = new FormData();
	formData.set("hallName", hallName);
	try {
		const response = await fetch("https://shfe-diplom.neto-server.ru/hall", {
			method: "POST",
			body: formData,
		});
		return response.json();
	} catch (error) {
		console.error("Ошибка при отправке данных:", error);
	}
}

function appendHallToList(hallId, hallName) {
	hallsList.insertAdjacentHTML(
		"beforeend",
		`
    <li class="halls-list__item">
      <span class="halls-list__name" data-id="${hallId}">${hallName}</span>
      <span class="button--remove hall_remove"></span>
    </li>
  `
	);
}

function clearInput(inputField) {
	inputField.value = "";
}

function deleteHall(hallId) {
	fetch(`https://shfe-diplom.neto-server.ru/hall/${hallId}`, {
		method: "DELETE",
	})
		.then((response) => response.json())
		.then((data) => {
			console.log(data);
		})
		.then(async () => {
			const updatedData = await fetchData(false);
			if (updatedData) updateHallsUI(updatedData);
		});
}

function displayHallConfig(data, hallIndex) {
	if (
		!data ||
		!data.result ||
		!data.result.halls ||
		!Array.isArray(data.result.halls[hallIndex].hall_config)
	) {
		console.error(
			"Ошибка: halls или hall_config отсутствуют или имеют неверный формат"
		);
		return;
	}

	const hall = data.result.halls[hallIndex];

	hallRowsInput.value = hall.hall_rows;
	hallSeatsInput.value = hall.hall_places;

	hallSeatsScheme.innerHTML = "";
	hallConfigArray = [];

	if (Array.isArray(hall.hall_config)) {
		hall.hall_config.forEach(() => {
			hallSeatsScheme.insertAdjacentHTML(
				"beforeend",
				`<div class="hall-config__row"></div>`
			);
		});
	}

	hallRowsElements = document.querySelectorAll(".hall-config__row");

	for (let i = 0; i < hallRowsElements.length; i++) {
		for (let j = 0; j < hall.hall_config[0].length; j++) {
			hallRowsElements[i].insertAdjacentHTML(
				"beforeend",
				`<span class="seat" data-type="${hall.hall_config[i][j]}"></span>`
			);
		}
	}

	hallSeatsSpans = document.querySelectorAll(".hall-config__row .seat");

	hallSeatsSpans.forEach((seat) => {
		if (seat.dataset.type === "vip") {
			seat.classList.add("seat--vip");
		} else if (seat.dataset.type === "standart") {
			seat.classList.add("seat--standard");
		} else {
			seat.classList.add("seat--blocked");
		}
	});

	hallConfigArray = JSON.parse(JSON.stringify(hall.hall_config));
	updatedHallConfigArray = JSON.parse(JSON.stringify(hallConfigArray));
}

function enableSeatEditing(rowsElements, data) {
	const rowsArray = Array.from(rowsElements);

	rowsArray.forEach((row, rowIndex) => {
		Array.from(row.children).forEach((seat, seatIndex) => {
			seat.style.cursor = "pointer";

			seat.addEventListener("click", () => {
				if (seat.classList.contains("seat--standard")) {
					seat.classList.replace("seat--standard", "seat--vip");
					seat.dataset.type = "vip";
					updatedHallConfigArray[rowIndex][seatIndex] = "vip";
				} else if (seat.classList.contains("seat--vip")) {
					seat.classList.replace("seat--vip", "seat--blocked");
					seat.dataset.type = "disabled";
					updatedHallConfigArray[rowIndex][seatIndex] = "disabled";
				} else {
					seat.classList.replace("seat--blocked", "seat--standard");
					seat.dataset.type = "standart";
					updatedHallConfigArray[rowIndex][seatIndex] = "standart";
				}

				const hasChanges =
					JSON.stringify(updatedHallConfigArray) !==
					JSON.stringify(data.result.halls[currentHallConfigIndex].hall_config);
				if (hasChanges) {
					hallConfigCancelButton.classList.remove("button--disabled");
					hallConfigSaveButton.classList.remove("button--disabled");
				} else {
					hallConfigCancelButton.classList.add("button--disabled");
					hallConfigSaveButton.classList.add("button--disabled");
				}
			});
		});
	});
}

function enableHallSizeEditing(updatedConfigArray, data) {
	const onInputChange = () => {
		updatedConfigArray.length = 0;
		hallSeatsScheme.innerHTML = "";

		const rowsCount = Math.max(1, Number(hallRowsInput.value));
		const seatsCount = Math.max(1, Number(hallSeatsInput.value));
		for (let i = 0; i < rowsCount; i++) {
			hallSeatsScheme.insertAdjacentHTML(
				"beforeend",
				`<div class="hall-config__row"></div>`
			);
			updatedConfigArray.push([]);
		}

		const rowsElements = Array.from(document.querySelectorAll(".hall-config__row"));

		for (let i = 0; i < rowsCount; i++) {
			for (let j = 0; j < seatsCount; j++) {
				rowsElements[i].insertAdjacentHTML(
					"beforeend",
					`<span class="seat seat--standard" data-type="standart"></span>`
				);
				updatedConfigArray[i].push("standart");
			}
		}

		const hasChanges =
			JSON.stringify(updatedConfigArray) !==
			JSON.stringify(data.result.halls[currentHallConfigIndex].hall_config);

		hallConfigCancelButton.classList.toggle("button--disabled", !hasChanges);
		hallConfigSaveButton.classList.toggle("button--disabled", !hasChanges);

		enableSeatEditing(rowsElements, data);
	};

	hallConfigForm.addEventListener("input", onInputChange);
}

async function saveHallConfig(hallId, configArray) {
	try {
		const params = new FormData();
		params.append("rowCount", hallRowsInput.value);
		params.append("placeCount", hallSeatsInput.value);
		params.append("config", JSON.stringify(configArray));

		const response = await fetch(
			`https://shfe-diplom.neto-server.ru/hall/${hallId}`, {
				method: "POST",
				body: params,
			}
		);

		if (!response.ok) {
			throw new Error(`Ошибка: ${response.statusText}`);
		}

		const data = await response.json();
		console.log(data);

		alert("Конфигурация зала сохранена!");
		const updatedData = await fetchData(false);
		if (updatedData) updateHallsUI(updatedData);
	} catch (error) {
		console.error("Ошибка при сохранении конфигурации: ", error);
		alert("Произошла ошибка при сохранении конфигурации.");
	}
}

function displayPrices(apiData, configId) {
	const initPriceControls = () => {
		const controls = {
			form: document.querySelector(".price-config__form"),
			inputs: [...document.querySelectorAll(".price-config__input")],
			cancelBtn: document.querySelector(".price-config__controls .button--cancel"),
			saveBtn: document.querySelector(".price-config__controls .button--save"),
		};

		if (!controls.form || controls.inputs.length < 2) {
			console.warn("Элементы управления ценами не найдены");
			return null;
		}
		return controls;
	};

	const findHallConfig = (hallId) => {
		return apiData?.result?.halls?.find((hall) => hall.id === Number(hallId));
	};

	const refreshPriceForm = (formElement) => {
		const newForm = formElement.cloneNode(true);
		formElement.parentNode.replaceChild(newForm, formElement);
		return {
			form: newForm,
			inputs: newForm.querySelectorAll(".price-config__input"),
		};
	};

	const setupChangeHandler = (form, inputs, originalPrices) => {
		form.addEventListener("input", () => {
			inputs.forEach((input) => {
				const value = Number(input.value);
				if (value < 0) input.value = 0;
			});
			const hasChanges =
				inputs[0].value != originalPrices.standart ||
				inputs[1].value != originalPrices.vip;

			controls.cancelBtn?.classList.toggle("button--disabled", !hasChanges);
			controls.saveBtn?.classList.toggle("button--disabled", !hasChanges);
		});
	};

	const controls = initPriceControls();
	if (!controls) return;

	const hallConfig = findHallConfig(configId);
	if (!hallConfig) return;

	controls.inputs[0].value = hallConfig.hall_price_standart || "";
	controls.inputs[1].value = hallConfig.hall_price_vip || "";

	const {
		form,
		inputs
	} = refreshPriceForm(controls.form);

	priceStandardInput = inputs[0];
	priceVipInput = inputs[1];
	priceConfigForm = form;
	priceConfigCancelButton = controls.cancelBtn;
	priceConfigSaveButton = controls.saveBtn;

	setupChangeHandler(form, inputs, {
		standart: hallConfig.hall_price_standart,
		vip: hallConfig.hall_price_vip,
	});
}

function createPriceFormData() {
	const formData = new FormData();
	formData.set("priceStandart", `${priceStandardInput.value}`);
	formData.set("priceVip", `${priceVipInput.value}`);
	return formData;
}

function handlePriceSaveResponse(response) {
	return response
		.json()
		.then((data) => {
			console.log(data);
			alert("Конфигурация цен сохранена!");
		})
		.then(async () => {
			const updatedData = await fetchData(false);
			if (updatedData) updateHallsUI(updatedData);
		});
}

function handlePriceSaveError(error) {
	console.error("Ошибка при сохранении цен:", error);
	alert("Ошибка при сохранении конфигурации цен. Попробуйте позже.");
}

function savePrices(priceConfigId) {
	const params = createPriceFormData();
	fetch(
			`https://shfe-diplom.neto-server.ru/price/${priceConfigId}`, {
				method: "POST",
				body: params,
			}
		)
		.then(handlePriceSaveResponse)
		.catch(handlePriceSaveError);
}

function getHallOpenStatus(data, hallId) {
	const hall = data.result.halls.find((hall) => hall.id === Number(hallId));
	return hall ? hall.hall_open : null;
}

function countHallSeances(data, hallId) {
	return data.result.seances.filter(
		(seance) => seance.seance_hallid === Number(hallId)
	).length;
}

function updateSalesButtonAndInfo(status, seanceCount) {
	if (status === 0 && seanceCount === 0) {
		salesToggleButton.textContent = "Открыть продажу билетов";
		salesInfoText.textContent = "Добавьте сеансы в зал для открытия";
		salesToggleButton.classList.add("button--disabled");
	} else if (status === 0 && seanceCount > 0) {
		salesToggleButton.textContent = "Открыть продажу билетов";
		newHallStatus = 1;
		salesInfoText.textContent = "Всё готово к открытию";
		salesToggleButton.classList.remove("button--disabled");
	} else {
		salesToggleButton.textContent = "Приостановить продажу билетов";
		newHallStatus = 0;
		salesInfoText.textContent = "Зал открыт";
		salesToggleButton.classList.remove("button--disabled");
	}
}

function checkHallSaleStatus(data, hallId) {
	salesInfoText = document.querySelector(".sales__status");
	salesToggleButton = document.querySelector(".button--open");

	currentHallStatus = getHallOpenStatus(data, hallId);
	const hasSeances = countHallSeances(data, hallId);

	updateSalesButtonAndInfo(currentHallStatus, hasSeances);
}

function toggleHallSaleStatus(hallId, newStatus) {
	const params = new FormData();
	params.set("hallOpen", `${newStatus}`);

	fetch(`https://shfe-diplom.neto-server.ru/open/${hallId}`, {
			method: "POST",
			body: params,
		})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Ошибка HTTP: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			console.log(data);
			alert("Статус зала изменен!");
		})
		.catch((error) => {
			console.error("Ошибка при изменении статуса зала:", error);
			alert("Не удалось изменить статус зала. Попробуйте позже.");
		});
}

function reinitializeElement(selector) {
	const oldElement = document.querySelector(selector);
	if (oldElement && oldElement.parentNode) {
		const newElement = oldElement.cloneNode(true);
		oldElement.parentNode.replaceChild(newElement, oldElement);
		return newElement;
	}
	return oldElement;
}

function clearUIBeforeRender() {
	hallsList.innerHTML = "";
	hallConfigList.innerHTML = "";
	priceConfigList.innerHTML = "";
	salesList.innerHTML = "";
	sessionsTimeline.innerHTML = "";

	hallSeatsScheme?.replaceChildren();

	reinitializeElement(".hall-config__form");
	reinitializeElement(".hall-config__rows");
	reinitializeElement(".hall-config__places");
	reinitializeElement(".hall-config__controls .button--cancel");
	reinitializeElement(".hall-config__controls .button--save");
	reinitializeElement(".price-config__controls .button--cancel");
	reinitializeElement(".price-config__controls .button--save");

	reinitializeElement(".button--open");

	currentHallConfigId = null;
	currentHallConfigIndex = -1;
	currentPriceConfigId = null;
	currentSalesHallId = null;
	newHallStatus = 1;
	currentHallStatus = 0;
	updatedHallConfigArray = [];

	hallConfigElements = [];
	priceConfigElements = [];
	salesListElements = [];
	hallRemoveButtons = [];

	const hallCancelBtn = document.querySelector(".hall-config__controls .button--cancel");
	const hallSaveBtn = document.querySelector(".hall-config__controls .button--save");
	const priceCancelBtn = document.querySelector(".price-config__controls .button--cancel");
	const priceSaveBtn = document.querySelector(".price-config__controls .button--save");

	hallCancelBtn?.classList.add("button--disabled");
	hallSaveBtn?.classList.add("button--disabled");
	priceCancelBtn?.classList.add("button--disabled");
	priceSaveBtn?.classList.add("button--disabled");
}

function updateHallsUI(data) {
	clearUIBeforeRender();
	hallConfigForm = document.querySelector(".hall-config__form");

	const configSelectors = [
		".hall-config__rows",
		".hall-config__places",
		".hall-config__seats",
		".hall-config__controls .button--cancel",
		".hall-config__controls .button--save",
	];

	const [rowsElem, seatsElem, seatsSchemeElem, cancelBtn, saveBtn] =
		configSelectors.map((selector) => document.querySelector(selector));

	if (rowsElem && seatsElem && seatsSchemeElem) {
		hallRowsInput = rowsElem;
		hallSeatsInput = seatsElem;
		hallSeatsScheme = seatsSchemeElem;
		hallConfigCancelButton = cancelBtn;
		hallConfigSaveButton = saveBtn;
	} else {
		console.error("Не удалось найти элементы конфигурации зала");
		return;
	}

	data.result.halls.forEach((hall) => {
		if (hallsList) {
			const listItem = document.createElement("li");
			listItem.className = "halls-list__item";

			const hallNameSpan = document.createElement("span");
			hallNameSpan.className = "halls-list__name";
			hallNameSpan.dataset.id = hall.id;
			hallNameSpan.textContent = hall.hall_name;

			const removeBtn = document.createElement("span");
			removeBtn.className = "button--remove hall_remove";

			listItem.appendChild(hallNameSpan);
			listItem.appendChild(removeBtn);

			hallsList.appendChild(listItem);
		}

		updateVisibleSections();

		if (hallConfigList) {
			hallConfigList.insertAdjacentHTML(
				"beforeend",
				`<li class="hall__item hall-config__item" data-id="${hall.id}">${hall.hall_name}</li>`
			);
		}

		if (priceConfigList) {
			priceConfigList.insertAdjacentHTML(
				"beforeend",
				`<li class="hall__item price-config__item" data-id="${hall.id}">${hall.hall_name}</li>`
			);
		}

		if (salesList) {
			salesList.insertAdjacentHTML(
				"beforeend",
				`<li class="hall__item open__item" data-id="${hall.id}">${hall.hall_name}</li>`
			);
		}

		sessionsTimeline.insertAdjacentHTML(
			"beforeend",
			`
      <section class="movie-seances__timeline">
        <div class="session-timeline__delete">
          <img src="./img/trash.png" alt="Удалить сеанс">
        </div>
        <h3 class="timeline__hall_title">${hall.hall_name}</h3>
        <div class="timeline__seances" data-id="${hall.id}">
        </div>
      </section>
      `
		);

		const deleteSessionButtons = document.querySelectorAll(".session-timeline__delete");
		deleteSessionButtons.forEach((btn) => btn.classList.add("hidden"));
	});

	if (hallConfigList?.firstElementChild) {
		const firstHallItem = hallConfigList.firstElementChild;

		firstHallItem.classList.add("hall_item-selected");

		currentHallConfigId = firstHallItem.getAttribute("data-id");

		currentHallConfigIndex = data.result.halls.findIndex(
			(hall) => hall.id === Number(currentHallConfigId)
		);

		if (currentHallConfigIndex !== -1) {
			const currentHall = data.result.halls[currentHallConfigIndex];

			hallRowsInput.value = currentHall.hall_rows;
			hallSeatsInput.value = currentHall.hall_places;

			displayHallConfig(data, currentHallConfigIndex);
			enableSeatEditing(hallRowsElements, data);
			enableHallSizeEditing(updatedHallConfigArray, data);
		}
	}

	if (hallConfigCancelButton) {
		hallConfigCancelButton.addEventListener("click", (event) => {
			event.preventDefault();
			if (hallConfigCancelButton.classList.contains("button--disabled")) return;

			hallConfigCancelButton.classList.add("button--disabled");
			hallConfigSaveButton.classList.add("button--disabled");

			displayHallConfig(data, currentHallConfigIndex);
			enableSeatEditing(hallRowsElements, data);
		});
	}

	if (hallConfigSaveButton) {
		hallConfigSaveButton.addEventListener("click", (event) => {
			event.preventDefault();
			if (hallConfigSaveButton.classList.contains("button--disabled")) return;

			saveHallConfig(currentHallConfigId, updatedHallConfigArray);
		});
	}

	const firstPriceItem = priceConfigList.firstElementChild;
	if (firstPriceItem) {
		firstPriceItem.classList.add("hall_item-selected");

		currentPriceConfigId = firstPriceItem.dataset.id;

		priceConfigSection.classList.remove("hidden");

		displayPrices(data, currentPriceConfigId);
	}

	if (priceConfigCancelButton) {
		priceConfigCancelButton.addEventListener("click", (event) => {
			event.preventDefault();
			if (priceConfigCancelButton.classList.contains("button--disabled")) return;

			priceConfigCancelButton.classList.add("button--disabled");
			priceConfigSaveButton.classList.add("button--disabled");

			displayPrices(data, currentPriceConfigId);
		});
	}

	if (priceConfigSaveButton) {
		priceConfigSaveButton.addEventListener("click", (event) => {
			event.preventDefault();
			if (priceConfigSaveButton.classList.contains("button--disabled")) return;

			savePrices(currentPriceConfigId);
		});
	}

	const firstSalesItem = salesList.firstElementChild;
	if (firstSalesItem) {
		firstSalesItem.classList.add("hall_item-selected");

		currentSalesHallId = firstSalesItem.getAttribute("data-id");

		checkHallSaleStatus(data, currentSalesHallId);
	}

	hallConfigElements = document.querySelectorAll(".hall-config__item");

	hallConfigElements.forEach((item) => {
		item.addEventListener("click", () => {
			hallConfigElements.forEach((el) => el.classList.remove("hall_item-selected"));

			item.classList.add("hall_item-selected");

			currentHallConfigId = item.getAttribute("data-id");

			if (hallConfigCancelButton) {
				hallConfigCancelButton.classList.add("button--disabled");
				hallConfigSaveButton.classList.add("button--disabled");
			}

			currentHallConfigIndex = data.result.halls.findIndex(
				(hall) => hall.id === Number(currentHallConfigId)
			);

			if (currentHallConfigIndex !== -1) {
				const selectedHall = data.result.halls[currentHallConfigIndex];
				hallRowsInput.value = selectedHall.hall_rows;
				hallSeatsInput.value = selectedHall.hall_places;

				displayHallConfig(data, currentHallConfigIndex);
				enableSeatEditing(hallRowsElements, data);
				enableHallSizeEditing(updatedHallConfigArray, data);
			}
		});
	});

	priceConfigElements = document.querySelectorAll(".price-config__item");

	const setupPriceConfigSelection = () => {
		if (!priceConfigElements || !priceConfigElements.length) return;
		const onPriceItemClick = (clickedItem) => {
			priceConfigElements.forEach((el) =>
				el.classList.remove("hall_item-selected")
			);

			clickedItem.classList.add("hall_item-selected");

			currentPriceConfigId = clickedItem.dataset.id;

			if (priceConfigCancelButton && priceConfigSaveButton) {
				priceConfigCancelButton.classList.add("button--disabled");
				priceConfigSaveButton.classList.add("button--disabled");
			}

			displayPrices(data, currentPriceConfigId);
		};

		priceConfigElements.forEach((item) => {
			item.addEventListener("click", () => onPriceItemClick(item));

			item.onpointerdown = (e) => {
				if (e.button === 0) {
					onPriceItemClick(item);
				}
			};
		});
	};

	const initPriceConfig = () => {
		priceConfigElements =
			document.querySelectorAll(".price-config__item") || [];
		setupPriceConfigSelection();

		if (priceConfigElements[0]) {
			priceConfigElements[0].click();
		}
	};

	initPriceConfig();

	salesListElements = document.querySelectorAll(".open__item");

	salesListElements.forEach((item) => {
		item.addEventListener("click", () => {
			salesListElements.forEach((el) => {
				el.classList.remove("hall_item-selected");
			});
			item.classList.add("hall_item-selected");

			currentSalesHallId = item.getAttribute("data-id");

			checkHallSaleStatus(data, currentSalesHallId);
		});
	});

	if (salesToggleButton) {
		salesToggleButton.addEventListener("click", (event) => {
			event.preventDefault();

			if (salesToggleButton.classList.contains("button--disabled")) return;

			toggleHallSaleStatus(currentSalesHallId, newHallStatus);

			const currentHall = data.result.halls.find(
				(hall) => hall.id === Number(currentSalesHallId)
			);

			if (currentHall) {
				currentHallStatus = currentHall.hall_open;
			}

			if (newHallStatus === 0) {
				salesToggleButton.textContent = "Открыть продажу билетов";
				salesInfoText.textContent = "Всё готово к открытию";
				newHallStatus = 1;
			} else {
				salesToggleButton.textContent = "Приостановить продажу билетов";
				salesInfoText.textContent = "Зал открыт";
				newHallStatus = 0;
			}
		});
	}

	hallRemoveButtons = document.querySelectorAll(".hall_remove");

	hallRemoveButtons.forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const hallId = e.target.previousElementSibling.dataset.id;
			deleteHall(hallId);
		});
	});

	[hallRowsInput, hallSeatsInput].forEach((input) => {
		input.addEventListener("input", () => {
			if (Number(input.value) < 1) {
				input.value = 1;
			}
			if (Number(input.value) > 10) {
				input.value = 10;
			}
		});
	});
}