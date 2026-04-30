// @ts-check

/** @typedef {string} SearchRequest */

// TODO: definition of the actual type instead of using any
/** @typedef {any} SearchResponse */

/**
 * @param {string} input
 * @returns {string}
 */
function escapeHTML(input) {
	let p = document.createElement("p");
	p.appendChild(document.createTextNode(input));
	return p.innerHTML;
}

/**
 * @typedef {(injectionRoot: Element, searchEngine: SearchEngine, injectionElement: Element) => void} InsertFunction
 */

/**
 * @typedef {(injectionRoot: Element, injectionElement: Element) => void} InsertOverrideFunction
 */

/**
 * @typedef {Object} LinkdingInjectorConfig
 */

/**
 * @typedef {Object} InjectionLocation
 * @property {string} name
 * @property {(config: LinkdingInjectorConfig, injectedElement: Element) => void} transformation
 * @property {(config: LinkdingInjectorConfig, bookmark: Element) => void} bookmarkTransformation
 * @property {InsertFunction} defaultInsert
 */

///** @type { { [key: string]: InjectionLocation } } */
const injectionLocations = /** @type {const} */ Object.freeze({
	/** @type {InjectionLocation} */ top: {
		name: "top",
		transformation: (_, element) => {
			element.classList.add("injection-location-top");
		},
		defaultInsert: (injectionRoot, _, injectionElement) => {
			injectionRoot.prepend(injectionElement);
		},
		bookmarkTransformation: (_1, _2) => {
		}
	},
	/** @type {InjectionLocation} */ sidebar: {
		name: "sidebar",
		transformation: (_, element) => {
			element.classList.add("injection-location-sidebar");
		},
		defaultInsert: (injectionRoot, _, injectionElement) => {
			injectionRoot.prepend(injectionElement);
		},
		bookmarkTransformation: (_1, _2) => {
		}
	}
});

/**
 * @typedef {Object} InjectionContainerQueryResult
 * @property {Element} element
 * @property {InjectionLocation} location
 * @property {InsertFunction} insert
 */

/**
 * @typedef {Object} InjectionContainerQuery
 * @property {string} name
 * @property {(insertOverride: InsertOverrideFunction | null) => Promise<InjectionContainerQueryResult | Error>} tryResolve
 * @property {InsertOverrideFunction | null} insertOverride
 */

/**
 * @typedef {Object} SearchEngine
 * @property {string} name
 * @property {(location: Location) => SearchRequest} getSearchTerm
 * @property {(location: Location) => boolean} isMatch
 * @property {(config: LinkdingInjectorConfig, injectedElement: Element) => void} transformation
 * @property {(config: LinkdingInjectorConfig, bookmark: Element) => void} bookmarkTransformation
 * @property {Array.<InjectionContainerQuery>} injectionQueries
 */

/**
 * @param {string} className
 * @returns {(insertOverride: InsertOverrideFunction | null) => Promise<InjectionContainerQueryResult | Error>}
 */
function defaultTryResolveFunction(className) {
	return (/** @type {InsertOverrideFunction | null} */ insertOverride) => new Promise((resolve, _) => {
		const injectionRoot = document.querySelector(className);
		const isVisible = injectionRoot?.checkVisibility() ?? false;
		if(injectionRoot === null) {
			return resolve(new Error("Linkding-Injector: injection root does not exist."));
		}
		if(!isVisible) {
			return resolve(new Error("Linkding-Injector: injection root is not visible."));
		}

		resolve({
			element: injectionRoot,
			location: injectionLocations.sidebar,
			insert: insertOverride !== null
				? (/** @type {Element} */ injectionRoot, /** @type {SearchEngine} */ _, /** @type {Element} */ injectionElement) =>
					insertOverride(injectionRoot, injectionElement)
				: injectionLocations.sidebar.defaultInsert
		});
	});
}

///** @type { { [key: string]: SearchEngine } } */
const searchEngines = /** @type {const} */ Object.freeze({
	/** @type {SearchEngine} */ duckduckgo: {
		name: "duckduckgo",
		getSearchTerm: (loc) => {
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/duckduckgo\.com/) !== null;
		},
		transformation: (config, element) => {
			const theme = config?.themeDuckduckgo;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-duckduckgo");
		},
		bookmarkTransformation: (config, element) => {
			const theme = config?.themeDuckduckgo;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "duckduckgo-sidebar",
			tryResolve: defaultTryResolveFunction("section[data-area=sidebar]"),
			insertOverride: null
		}, {
			name: "duckduckgo-top",
			tryResolve: defaultTryResolveFunction("section[data-area=mainline]"),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ google: {
		name: "google",
		getSearchTerm: (loc) => {
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/google/) !== null;
		},
		transformation: (config, element) => {
			const theme = config?.themeGoogle;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-google");
		},
		bookmarkTransformation: (config, element) => {
			const theme = config?.themeGoogle;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "google-sidebar",
			tryResolve: (/** @type {InsertOverrideFunction | null} */ insertOverride) => {
				return new Promise((resolve, _) => {
					// TODO: handle #rhs element not existing
					const injectionRoot = document.querySelector("#rhs");
					const isVisible = injectionRoot?.checkVisibility() ?? false;
					if(injectionRoot === null) {
						return resolve(new Error("Linkding-Injector: injection root does not exist."));
					}
					if(!isVisible) {
						return resolve(new Error("Linkding-Injector: injection root is not visible."));
					}

					resolve({
						element: injectionRoot,
						location: injectionLocations.sidebar,
						insert: insertOverride !== null
							? (/** @type {Element} */ injectionRoot, /** @type {SearchEngine} */ _, /** @type {Element} */ injectionElement) =>
								insertOverride(injectionRoot, injectionElement)
							: injectionLocations.sidebar.defaultInsert
					});
				});
			},
			insertOverride: null
		}, {
			name: "google-top",
			tryResolve: defaultTryResolveFunction("#topstuff"),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ brave: {
		name: "brave",
		getSearchTerm: (loc) => {
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/search\.brave\.com/) !== null;
		},
		transformation: (config, element) => {
			const theme = config?.themeBrave;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-brave");
		},
		bookmarkTransformation: (config, element) => {
			const theme = config?.themeBrave;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "brave-sidebar",
			tryResolve: defaultTryResolveFunction("aside.sidebar"),
			insertOverride: (injectionRoot, injectionElement) => {
				// Brave search seems to remove the injection box if it is injected too soon.
				// Wait a bit before injecting.
				window.setTimeout(() => {
					injectionRoot.prepend(injectionElement);
				}, 1600);
			}
		}]
	},
	/** @type {SearchEngine} */ kagi: {
		name: "kagi",
		getSearchTerm: (loc) => {
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/kagi\.com/) !== null;
		},
		transformation: (config, element) => {
			const theme = config?.themeKagi;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-kagi");
		},
		bookmarkTransformation: (config, element) => {
			const theme = config?.themeKagi;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "kagi-sidebar",
			tryResolve: defaultTryResolveFunction(".right-content-box > ._0_right_sidebar"),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ searx: {
		name: "searx",
		getSearchTerm: (_) => {
			/** @type {HTMLInputElement | null} */
			const searchInput = document.querySelector("input#q");
			if(searchInput === null) {
				throw new Error("Linkding-Injector: search input not found.");
			}
			const searchTerm = escapeHTML(searchInput.value);
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.href.match(/http.?:\/\/.+\/search/) !== null;
		},
		transformation: (config, element) => {
			const theme = config?.themeSearx;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-searx");
		},
		bookmarkTransformation: (config, element) => {
			const theme = config?.themeSearx;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "searx-sidebar",
			tryResolve: defaultTryResolveFunction("#sidebar"),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ qwant: {
		name: "qwant",
		getSearchTerm: (loc) => {
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/qwant\.com/) !== null;
		},
		transformation: (config, element) => {
			const theme = config?.themeQwant;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-qwant");
		},
		bookmarkTransformation: (config, element) => {
			const theme = config?.themeQwant;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "qwant-sidebar",
			tryResolve: (/** @type {InsertOverrideFunction | null} */ insertOverride) => {
				return new Promise((resolve, _) => {
					// Qwant asynchronously loads the sidebar. We need to watch for when the
					// sidebar is loaded and only then start the injection
					// TODO: Add a timeout for the observer?
					const qwantObserver = new MutationObserver((_, observer) => {
						const injectionRoot = document.querySelector(".is-sidebar");
						const isVisible = injectionRoot?.checkVisibility() ?? false;

						if(injectionRoot !== null && !isVisible) {
							return resolve(new Error("Linkding-Injector: injection root is not visible."));
						} else if(injectionRoot !== null){
							observer.disconnect();
							resolve({
								element: injectionRoot,
								location: injectionLocations.sidebar,
								insert: insertOverride !== null
									? (/** @type {Element} */ injectionRoot, /** @type {SearchEngine} */ _, /** @type {Element} */ injectionElement) =>
										insertOverride(injectionRoot, injectionElement)
									: injectionLocations.sidebar.defaultInsert
									});
						}
					});

					qwantObserver.observe(document.body, {
						childList: true,
						subtree: true
					});

				});
			},
			insertOverride: null
		}]
	}
});

/**
 * @param {Location} location
 * @returns {SearchEngine}
 */
function getSearchEngine(location) {
	for(const searchEngine of Object.values(searchEngines)) {
		if(searchEngine.isMatch(location)) {
			return searchEngine;
		}
	}

	throw new Error("Linkding-Injector: unknown search engine.");
}

/**
 * @param {SearchRequest} searchTerm
 * @returns {Promise<SearchResponse>}
 */
function executeSearch(searchTerm) {
	return new Promise((resolve, reject) => {
		if (typeof browser !== "undefined") {
			const port = browser.runtime.connect({ name: "port-from-cs" });
			try {
				port.onMessage.addListener((message) => {
					if("message" in message) {
						reject(message);
					} else {
						resolve(message);
					}
				});
				port.postMessage({ searchTerm: searchTerm });
			} catch(err) {
				reject(err);
			}
		} else if(typeof chrome !== "undefined") {
			const port = chrome.runtime.connect({ name: "port-from-cs" });
			try {
				port.onMessage.addListener((message) => {
					if("message" in message) {
						reject(message);
					} else {
						resolve(message);
					}
				});
				port.postMessage({ searchTerm: searchTerm });
			} catch(err) {
				reject(err);
			}
		} else {
			reject(new Error("Linkding-Injector: neither `browser` nor `chrome` namespace was found."));
		}
	});
}

/**
 * @param {string} path
 * @returns {string}
 */
function getResourceUri(path) {
	if (typeof browser !== "undefined") {
		return browser.runtime.getURL(path);
	} else if(typeof chrome !== "undefined") {
		return chrome.runtime.getURL(path);
	} else {
		throw new Error("Linkding-Injector: neither `browser` nor `chrome` namespace was found.");
	}
}

/**
 * @param {Event} _
 */
async function injectResults(_) {
	const injectionQueryResult = await searchEngine.injectionQueries.reduce(async (/** @type {Promise<InjectionContainerQueryResult | Error | null>} */ previousResult, current) => {
		return previousResult
			.then(async (val) => {
				if(val !== null && !(val instanceof Error)) {
					return val;
				}

				return await current.tryResolve(current.insertOverride);
			})
	}, Promise.resolve(null));

	if(injectionQueryResult instanceof Error) {
		throw injectionQueryResult;
	}

	if(injectionQueryResult === null) {
		throw new Error("Linkding-Injector: no valid injection location found.");
	}

	const injectionRoot = injectionQueryResult.element;
	const injectionLocation = injectionQueryResult.location;
	const insertFunction = injectionQueryResult.insert;

	const parser = new DOMParser();
	const logoUri = getResourceUri("icons/logo.svg");
	const settingsIconUri = getResourceUri("icons/cog.svg");

	try {
		const searchResult = await search;
		const config = searchResult.config;
		const showLogo = config?.showLogo ?? true;
		const baseUrl = config?.baseUrl;

		const results = searchResult.results;
		const resultCount = results?.length;

		if(typeof resultCount !== "number" || resultCount <= 0) {
			throw new Error("Linkding-Injector: neither message nor result list found in search result");
		}

		let htmlString = `
		<div id="bookmark-list-container" class="${searchEngine}">
			<div id="navbar">
				<a id="ld-logo" href="${baseUrl + (searchTerm.length > 0 ? `/bookmarks?q=${encodeURIComponent(searchTerm)}` : "/")}">
					${showLogo ? `<img src="${logoUri}" class="setup" />` : ""}
					<h1>linkding injector</h1>
				</a>
				<a id="ld-options" class="openOptions">
					<img class="ld-settings" src=${settingsIconUri} />
				</a>
			</div>
			<div id="results_amount">
				Found <span>${resultCount}</span> ${resultCount == 1 ? "result" : "results"}.
			</div>
			<ul id="bookmark-list">
			</ul>
		</div>`;

		const injectionDoc = parser.parseFromString(htmlString, "text/html");
		const injectionElement = injectionDoc.body.querySelector("div#bookmark-list-container");
		if(injectionElement === null) {
			throw new Error("Linkding-Injector: invalid injection element (null)");
		}

		const bookmarkList = injectionElement.querySelector("#bookmark-list");
		if(bookmarkList === null) {
			throw new Error("Linkding-Injector: invalid bookmark list element (null)");
		}

		// It might seem kinda weird to use slots without WebComponents/shadow DOM.
		// However they're used as markers for replaceWith here
		const bookmarkHtmlString = `
		<template>
			<li>
				<div class="title">
					<a
						target=${searchResult.config.openLinkType == "sameTab" ? "_self" : "_blank"}
						rel="noopener"
					><slot name="title"></slot></a>
				</div>
				<div class="description">
					<span class="tags">
						<slot name="tags"></slot>
					<span>

					<slot name="divider"></slot>

					<span>
						<slot></slot>
					</span>
				</div>
			</li>
		</template>`;
		const bookmarkDoc = parser.parseFromString(bookmarkHtmlString, "text/html");
		const bookmarkTemplateElement = bookmarkDoc.querySelector("template");
		if(bookmarkTemplateElement === null) {
			throw new Error("Linkding-Injector: invalid bookmark template element (null)");
		}
		injectionElement.appendChild(bookmarkTemplateElement);

		for(const bookmark of results) {
			const bookmarkFragment = document.importNode(bookmarkTemplateElement.content, true);
			const bookmarkElement = bookmarkFragment.firstElementChild;
			if(bookmarkElement === null) {
				throw new Error("Linkding-Injector: invalid bookmark element (null)");
			}

			/** @type {HTMLSlotElement | null} */ const titleSlot = bookmarkElement.querySelector("slot[name=\"title\"]");
			const bookmarkTitle = new Text(escapeHTML(bookmark.title));
			titleSlot?.replaceWith(bookmarkTitle);

			/** @type {HTMLSlotElement | null} */ const tagsSlot = bookmarkElement.querySelector("slot[name=\"tags\"]");
			const tagElements = bookmark.tags.flatMap((/** @type {string} */tag, /** @type {number} */ index) => {
				const tagLink = document.createElement("a");
				const tagName = escapeHTML(tag);
				tagLink.href = baseUrl + `/bookmarks?q=${encodeURIComponent("#" + tagName)}`;
				tagLink.innerText = "#" + tagName;

				return (index == 0) ? [tagLink] : [new Text(" "), tagLink];
			});
			tagsSlot?.replaceWith(...tagElements);

			/** @type {HTMLSlotElement | null} */ const dividerSlot = bookmarkElement.querySelector("slot[name=\"divider\"]");
			if(bookmark.tags.length > 0) {
				const divider = new Text("|");
				dividerSlot?.replaceWith(divider);
			}

			/** @type {HTMLSlotElement | null} */ const descriptionSlot = bookmarkElement.querySelector("slot:not([name])");
			const description = new Text(escapeHTML(bookmark.description));
			descriptionSlot?.replaceWith(description);

			const bookmarkLink = bookmarkElement.querySelector("a");
			if(bookmarkLink !== null) {
				bookmarkLink.href = bookmark.url;
			}

			searchEngine.bookmarkTransformation(config, bookmarkElement);
			injectionLocation.bookmarkTransformation(config, bookmarkElement);
			bookmarkList.appendChild(bookmarkElement);
		}

		searchEngine.transformation(config, injectionElement);
		injectionLocation.transformation(config, injectionElement);

		insertFunction(injectionRoot, searchEngine, injectionElement);
	} catch(error) {
		const config = error.config;
		const showLogo = config?.showLogo ?? true;
		const errorMessage = error["message"];

		const htmlString = `
		<div id="bookmark-list-container" class="${searchEngine}">
			<div id="navbar">
				<a id="ld-logo">
					${showLogo ? `<img src="${logoUri}" class="setup" />` : ""}
					<h1>linkding injector</h1>
				</a>
				<a id="ld-options" class="openOptions">
					<img class="ld-settings" src=${settingsIconUri} />
				</a>
			</div>
			<div id="error-message">
				${errorMessage}
			</div>
		</div>`;

		const injectionDoc = parser.parseFromString(htmlString, "text/html");
		const injectionElement = injectionDoc.body.querySelector("div#bookmark-list-container");
		if(injectionElement === null) {
			throw new Error("Linkding-Injector: invalid injection element (null)");
		}

		searchEngine.transformation(config, injectionElement);
		injectionLocation.transformation(config, injectionElement);

		insertFunction(injectionRoot, searchEngine, injectionElement);
		throw new Error("Linkding-Injector: " + errorMessage);
	}
}

const searchEngine = getSearchEngine(window.location);
const searchTerm = searchEngine.getSearchTerm(window.location);
const search = executeSearch(searchTerm);
window.addEventListener("DOMContentLoaded", injectResults);
