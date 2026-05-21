// @ts-check
// TODO: Check if there is some other way to fix redeclaration of constants than wrapping in this if
if("__LINKDING_INJECTOR_EXTENSION_LOADED__" in window) {

} else {
window["__LINKDING_INJECTOR_EXTENSION_LOADED__"] = true;

/**
 * @typedef {string} SearchRequest type of the request we send to fetch our linkding bookmarks
 */

/**
 * @typedef {Object} LinkdingInjectorConfig configuration for the linkding injector
 * @property {string} baseUrl
 * @property {string} token
 * @property {number} resultNum
 * @property {boolean} showLogo
 * @property {"newTab" | "sameTab"} openLinkType
 * @property {string} themeGoogle
 * @property {string} themeDuckduckgo
 * @property {string} themeBrave
 * @property {string} themeSearx
 * @property {string} themeKagi
 * @property {string} themeQwant
 */

/**
 * @typedef {Object} BookmarkSuggestion single bookmark suggestion returned from the search
 * @property {string} url
 * @property {string} title
 * @property {string} description
 * @property {Array.<string>} tags
 * @property {string} date
 */

/**
 * @typedef {Object} SuccessSearchResponse search response in the success case
 * @property {Array.<BookmarkSuggestion>} results
 * @property {LinkdingInjectorConfig} config
 */

/**
 * @typedef {Object} FailureSearchResponse search response in the failure case (no bookmarks)
 * @property {string} message
 */

/**
 * @typedef {SuccessSearchResponse | FailureSearchResponse} SearchResponse response with our linkding bookmarks (or an error)
 */

/**
 * @param {string} input string with unescaped HTML
 * @returns {string} that same string with the HTML tags escaped
 */
function escapeHTML(input) {
	let p = document.createElement("p");
	p.appendChild(document.createTextNode(input));
	return p.innerHTML;
}

/**
 * @typedef {(injectionRoot: Element, searchEngine: SearchEngine, injectionElement: Element) => void} InsertFunction function for inserting the injection root into the DOM
 */

/**
 * @typedef {(injectionRoot: Element, injectionElement: Element) => void} InsertOverrideFunction function to override the default insertion for a search engine and location pair
 */

/**
 * @typedef {Object} InjectionLocation definition of a location the injection root can be inserted into and
 * @property {string} name name of the injection location
 * @property {(config: LinkdingInjectorConfig, injectedElement: Element) => void} transformation allows to transform the injection root element before it is actually injected
 * @property {(config: LinkdingInjectorConfig, bookmark: Element) => void} bookmarkTransformation allows to transform a bookmark element before it is actually inserted into the injection root
 * @property {InsertFunction} defaultInsert default function for inserting the injection root element into the DOM
 */

///** @type { { [key: string]: InjectionLocation } } */
const injectionLocations = /** @type {const} */ Object.freeze({
	/** @type {InjectionLocation} */ top: {
		name: "top",
		transformation: (_, element) => {
			// add class to injection root element to allow styling based on the location
			element.classList.add("injection-location-top");
		},
		defaultInsert: (injectionRoot, _, injectionElement) => {
			// actually insert the injection root
			injectionRoot.prepend(injectionElement);
		},
		bookmarkTransformation: (_1, _2) => {
			// no transformation for bookmark elements
		}
	},
	/** @type {InjectionLocation} */ sidebar: {
		name: "sidebar",
		transformation: (_, element) => {
			// add class to injection root element to allow styling based on the location
			element.classList.add("injection-location-sidebar");
		},
		defaultInsert: (injectionRoot, _, injectionElement) => {
			// actually insert the injection root
			injectionRoot.prepend(injectionElement);
		},
		bookmarkTransformation: (_1, _2) => {
			// no transformation for bookmark elements
		}
	}
});

/**
 * @typedef {Object} InjectionContainerQueryResult result of a query for a container we can inject into
 * @property {Element} element element which we want the injection root inserted into
 * @property {InjectionLocation} location definition of the injection location
 * @property {InsertFunction} insert function used to insert the injection root into the DOM element from `element` property
 */

/**
 * @typedef {Object} InjectionContainerQuery query that can be run to find a container we can inject into. One search engine can have multiple queries
 * @property {string} name name of the query
 * @property {(insertOverride: InsertOverrideFunction | null) => Promise<InjectionContainerQueryResult | Error>} tryResolve actual query function to find the injection container
 * @property {InsertOverrideFunction | null} insertOverride function to allow overriding the insert behavior into this specific location for the search engine
 */

/**
 * @typedef {Object} SearchEngine definition for the injection into a search engine
 * @property {"DOMContentLoaded" | "load"} injectionStartEvent event at which we start the actual injection
 * @property {string} name name of the search engine
 * @property {(location: Location) => SearchRequest} getSearchTerm function to convert the current window location into a search term
 * @property {(location: Location) => boolean} isMatch check if a window location is on a page of this search engine
 * @property {(config: LinkdingInjectorConfig, injectedElement: Element) => void} transformation search engine specific transformation of the injection root (to allow adding classes or such)
 * @property {(config: LinkdingInjectorConfig, bookmark: Element) => void} bookmarkTransformation search engine specific transformation of a bookmark element (to allow adding classes or such)
 * @property {Array.<InjectionContainerQuery>} injectionQueries list of queries for injection locations this search engine supports
 */

/**
 * @description creates a function with the default behavior for finding the element we want to inject into.
 * Just looks for the class and sees if it is visible.
 * If it is, the element is returned, else we resolve the promise with an error (we don't reject it, as it is expected this might happen)
 * @param {string} className class name of the container we want to inject into
 * @param {InjectionLocation} location definition of the location this query is for
 * @returns {(insertOverride: InsertOverrideFunction | null) => Promise<InjectionContainerQueryResult | Error>} the function with default query behavior
 * that returns a promise of either a `InjectionContainerQueryResult` or an expected `Error`
 */
function defaultTryResolveFunction(className, location) {
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
			location: location,
			insert: insertOverride !== null
				? (/** @type {Element} */ injectionRoot, /** @type {SearchEngine} */ _, /** @type {Element} */ injectionElement) =>
					insertOverride(injectionRoot, injectionElement)
				: location.defaultInsert
		});
	});
}

///** @type { { [key: string]: SearchEngine } } */
const searchEngines = /** @type {const} */ Object.freeze({
	/** @type {SearchEngine} */ duckduckgo: {
		name: "duckduckgo",
		injectionStartEvent: "load",
		getSearchTerm: (loc) => {
			// just return the `q` query parameter as a search term
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/duckduckgo\.com/) !== null;
		},
		transformation: (config, element) => {
			// add theme class to injection root and a class allowing for duckduckgo specific styling
			const theme = config?.themeDuckduckgo;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-duckduckgo");
		},
		bookmarkTransformation: (config, element) => {
			// add theme class to bookmark
			const theme = config?.themeDuckduckgo;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "duckduckgo-sidebar",
			// query for duckduckgo sidebar just needs the correct css selector
			tryResolve: defaultTryResolveFunction("section[data-area=sidebar]", injectionLocations.sidebar),
			insertOverride: null
		}, {
			name: "duckduckgo-top",
			// query for duckduckgo top just needs the correct css selector
			tryResolve: defaultTryResolveFunction("section[data-area=mainline]", injectionLocations.top),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ google: {
		name: "google",
		injectionStartEvent: "DOMContentLoaded",
		getSearchTerm: (loc) => {
			// just return the `q` query parameter as a search term
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/google/) !== null;
		},
		transformation: (config, element) => {
			// add theme class to injection root and a class allowing for google specific styling
			const theme = config?.themeGoogle;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-google");
		},
		bookmarkTransformation: (config, element) => {
			// add theme class to bookmark
			const theme = config?.themeGoogle;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "google-sidebar",
			// query for google sidebar needs to make sure #rhs element exists
			tryResolve: (/** @type {InsertOverrideFunction | null} */ insertOverride) => {
				return new Promise((resolve, _) => {
					// Google completely omits the sidebar container if there is no content.
					// We need to add it manually before the actual query
					if(document.querySelector("#rhs") === null) {
						const sidebarContainerString = `
						<div id="rhs" class="TQc1id hSOk2e rhstc4"></div>`;
						const parser = new DOMParser();
						const sidebarContainer = parser.parseFromString(sidebarContainerString, "text/html");

						const outerContainer = document.querySelector("#rcnt");
						const sidebarContainerElement = sidebarContainer.body.querySelector("div");
						if(outerContainer !== null && sidebarContainerElement !== null) {
							outerContainer.appendChild(sidebarContainerElement);
						}
					}

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
			// query for google top just needs the correct css selector
			tryResolve: defaultTryResolveFunction("#topstuff", injectionLocations.top),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ brave: {
		name: "brave",
		injectionStartEvent: "load",
		getSearchTerm: (loc) => {
			// just return the `q` query parameter as a search term
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/search\.brave\.com/) !== null;
		},
		transformation: (config, element) => {
			// add theme class to injection root and a class allowing for brave specific styling
			const theme = config?.themeBrave;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-brave");
		},
		bookmarkTransformation: (config, element) => {
			// add theme class to bookmark
			const theme = config?.themeBrave;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "brave-sidebar",
			// query for brave sidebar can't to the visibility check
			tryResolve: (/** @type {InsertOverrideFunction | null} */ insertOverride) => new Promise((resolve, _) => {
				const injectionRoot = document.querySelector("aside.sidebar > .sidebar-content");
				if(injectionRoot === null) {
					return resolve(new Error("Linkding-Injector: injection root does not exist."));
				}

				// root isn't visible right away for brave search
				/*const isVisible = injectionRoot?.checkVisibility() ?? false;
				if(!isVisible) {
					return resolve(new Error("Linkding-Injector: injection root is not visible."));
				}*/

				resolve({
					element: injectionRoot,
					location: injectionLocations.sidebar,
					insert: insertOverride !== null
						? (/** @type {Element} */ injectionRoot, /** @type {SearchEngine} */ _, /** @type {Element} */ injectionElement) =>
							insertOverride(injectionRoot, injectionElement)
						: injectionLocations.sidebar.defaultInsert
				});
			}),
			// Brave search detects changes to server-hydrated state and overwrites them one hydration is finished.
			// So we have to wait for the whole page to load and then for the (hopefully correct) end of hydration before injecting.
			insertOverride: async (injectionRoot, injectionElement) => {
				const awaitHydration = (/** @type {Element} */ root, /** @type {number} */ cooldown, /** @type {number} */ timeout) => new Promise((resolve, _) => {
					/** @type {number | null} */ let activeTimeout = null;
					const braveObserver = new MutationObserver((_1, _2) => {
						if(activeTimeout !== null) {
							window.clearTimeout(activeTimeout);
						}

						activeTimeout = window.setTimeout(() => {
							braveObserver.disconnect();
							resolve(true);
						}, cooldown);
					});

					braveObserver.observe(root, {
						childList: true,
						subtree: true
					});

					window.setTimeout(() => {
						braveObserver.disconnect();
						resolve(false);
					}, timeout);
				});

				const success = await awaitHydration(document.documentElement, 350, 5000);
				if(!success) {
					console.debug(`Linkding-Injector: No hydration mutation happened during given timeout`);
				}
				console.debug(`Linkding-Injector: injection root inserted`);
				injectionRoot.prepend(injectionElement);
			}
		}]
	},
	/** @type {SearchEngine} */ kagi: {
		name: "kagi",
		injectionStartEvent: "DOMContentLoaded",
		getSearchTerm: (loc) => {
			// just return the `q` query parameter as a search term
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/kagi\.com/) !== null;
		},
		transformation: (config, element) => {
			// add theme class to injection root and a class allowing for kagi specific styling
			const theme = config?.themeKagi;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-kagi");
		},
		bookmarkTransformation: (config, element) => {
			// add theme class to bookmark
			const theme = config?.themeKagi;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "kagi-sidebar",
			// query for kagi sidebar just needs the correct css selector
			tryResolve: defaultTryResolveFunction(".right-content-box > ._0_right_sidebar", injectionLocations.sidebar),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ searx: {
		name: "searx",
		injectionStartEvent: "DOMContentLoaded",
		getSearchTerm: (_) => {
			// read the query from the search input element and return it as a search term
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
			// add theme class to injection root and a class allowing for searx specific styling
			const theme = config?.themeSearx;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-searx");
		},
		bookmarkTransformation: (config, element) => {
			// add theme class to bookmark
			const theme = config?.themeSearx;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "searx-sidebar",
			// query for searx sidebar just needs the correct css selector
			tryResolve: defaultTryResolveFunction("#sidebar", injectionLocations.sidebar),
			insertOverride: null
		}]
	},
	/** @type {SearchEngine} */ qwant: {
		name: "qwant",
		injectionStartEvent: "DOMContentLoaded",
		getSearchTerm: (loc) => {
			// just return the `q` query parameter as a search term
			const queryString = loc.search;
			const urlParams = new URLSearchParams(queryString);
			const searchTerm = escapeHTML(urlParams.get("q") ?? "");
			return searchTerm;
		},
		isMatch: (loc) => {
			return loc.hostname.match(/qwant\.com/) !== null;
		},
		transformation: (config, element) => {
			// add theme class to injection root and a class allowing for qwant specific styling
			const theme = config?.themeQwant;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
			element.classList.add("search-engine-qwant");
		},
		bookmarkTransformation: (config, element) => {
			// add theme class to bookmark
			const theme = config?.themeQwant;
			if(theme !== null && theme !== "auto") {
				element.classList.add(theme);
			}
		},
		injectionQueries: [{
			name: "qwant-sidebar",
			// Qwant asynchronously loads the sidebar. We need to watch for when the
			// sidebar is loaded and only then start the injection
			tryResolve: (/** @type {InsertOverrideFunction | null} */ insertOverride) => {
				return new Promise((resolve, _) => {
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

					window.setTimeout(() => {
						qwantObserver.disconnect();
					}, 3000);
				});
			},
			insertOverride: null
		}]
	}
});

/**
 * @description get the current search engine of this page
 * @param {Location} location current window location
 * @returns {SearchEngine} the search engine we're currently on
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
 * @description execute the query for linkding bookmarks
 * @param {SearchRequest} searchTerm search term for the query
 * @returns {Promise<SuccessSearchResponse>} queried results (linkding bookmarks)
 */
function executeSearch(searchTerm) {
	return new Promise((resolve, reject) => {
		if (typeof browser !== "undefined") {
			const port = browser.runtime.connect({ name: "port-from-cs" });
			try {
				port.onMessage.addListener((message) => {
					if("message" in message) {
						console.debug("error", message);
						reject(message);
					} else {
						const successResult = /** @type {SuccessSearchResponse} */ (message);
						resolve(successResult);
					}
				});
				port.postMessage({ searchTerm: searchTerm });
			} catch(err) {
				console.debug("exception", err);
				reject(err);
			}
		} else if(typeof chrome !== "undefined") {
			const port = chrome.runtime.connect({ name: "port-from-cs" });
			try {
				port.onMessage.addListener((message) => {
					if("message" in message) {
						reject(message);
					} else {
						const successResult = /** @type {SuccessSearchResponse} */ (message);
						resolve(successResult);
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
 * @description get the URI for one of our resources (like images)
 * @param {string} path path to the resource
 * @returns {string} URI of the resource
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
 * @description open the options page
 */
function openOptionsPage() {
	if (typeof browser !== "undefined") {
		const port = browser.runtime.connect({ name: "port-from-cs" });
		port.postMessage({ action: "openOptions" });
	} else if(typeof chrome !== "undefined") {
		const port = chrome.runtime.connect({ name: "port-from-cs" });
		port.postMessage({ action: "openOptions" });
	} else {
		throw new Error("Linkding-Injector: neither `browser` nor `chrome` namespace was found.");
	}
}

/**
 * @descirption event handler for actually injecting our query results (basically our main function)
 * @param {Event} _
 */
async function injectResults(_) {
	// find the first successful query result (injection location, element and insert function) for our search engine
	const injectionQueryResult = await searchEngine.injectionQueries.reduce(async (/** @type {Promise<InjectionContainerQueryResult | Error | null>} */ previousResult, current) => {
		return previousResult
			.then(async (val) => {
				// if we already got a valid value (not an error), just return the existing result
				// because we want to inject into the first possible location
				if(val !== null && !(val instanceof Error)) {
					return val;
				}

				// else try the next one
				return await current.tryResolve(current.insertOverride);
			})
	}, Promise.resolve(null));

	// we only got errors, so no valid location
	if(injectionQueryResult instanceof Error) {
		throw injectionQueryResult;
	}

	// we didn't get any result (not even an error)
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
		// wait for the search we already started before the DOM was fully loaded
		const searchResult = await search;
		const config = searchResult.config;
		const showLogo = config?.showLogo ?? true;
		const baseUrl = config?.baseUrl;

		const results = searchResult.results;
		const resultCount = results?.length;

		if(typeof resultCount !== "number" || resultCount <= 0) {
			throw new Error("Linkding-Injector: neither message nor result list found in search result");
		}

		// base structure of our injection root, including template of a single bookmark element.
		// It might seem kinda weird to use slots without WebComponents/shadow DOM.
		// However they're used as markers for replaceWith here
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
			</template>
		</div>`;

		// parse said injection root base structure HTML as DOM and find the root of our injection element
		const injectionDoc = parser.parseFromString(htmlString, "text/html");
		const injectionElement = injectionDoc.body.querySelector("div#bookmark-list-container");
		if(injectionElement === null) {
			throw new Error("Linkding-Injector: invalid injection element (null)");
		}
		injectionElement.querySelectorAll(".openOptions").forEach((el) => {
			el.addEventListener("click", openOptionsPage);
		});

		const bookmarkList = injectionElement.querySelector("#bookmark-list");
		if(bookmarkList === null) {
			throw new Error("Linkding-Injector: invalid bookmark list element (null)");
		}

		const bookmarkTemplateElement = injectionElement.querySelector("template");
		if(bookmarkTemplateElement === null) {
			throw new Error("Linkding-Injector: invalid bookmark template element (null)");
		}
		// insert the bookmark template into our main injection element
		injectionElement.appendChild(bookmarkTemplateElement);

		for(const bookmark of results) {
			// create element from our template
			const bookmarkFragment = document.importNode(bookmarkTemplateElement.content, true);
			const bookmarkElement = bookmarkFragment.firstElementChild;
			if(bookmarkElement === null) {
				throw new Error("Linkding-Injector: invalid bookmark element (null)");
			}

			// insert title into the title slot
			/** @type {HTMLSlotElement | null} */ const titleSlot = bookmarkElement.querySelector("slot[name=\"title\"]");
			const bookmarkTitle = new Text(escapeHTML(bookmark.title));
			titleSlot?.replaceWith(bookmarkTitle);

			// insert tags into the tags slot
			/** @type {HTMLSlotElement | null} */ const tagsSlot = bookmarkElement.querySelector("slot[name=\"tags\"]");
			const tagElements = bookmark.tags.flatMap((/** @type {string} */tag, /** @type {number} */ index) => {
				const tagLink = document.createElement("a");
				const tagName = escapeHTML(tag);
				tagLink.href = baseUrl + `/bookmarks?q=${encodeURIComponent("#" + tagName)}`;
				tagLink.target = "_blank";
				tagLink.rel = "noopener";
				tagLink.innerText = "#" + tagName;

				return (index == 0) ? [tagLink] : [new Text(" "), tagLink];
			});
			tagsSlot?.replaceWith(...tagElements);

			// insert divider into the divider slot
			/** @type {HTMLSlotElement | null} */ const dividerSlot = bookmarkElement.querySelector("slot[name=\"divider\"]");
			if(bookmark.tags.length > 0) {
				const divider = new Text("|");
				dividerSlot?.replaceWith(divider);
			}

			// insert bookmark description into the unnamed slot
			/** @type {HTMLSlotElement | null} */ const descriptionSlot = bookmarkElement.querySelector("slot:not([name])");
			const description = new Text(escapeHTML(bookmark.description));
			descriptionSlot?.replaceWith(description);

			// set link to our bookmark link element
			const bookmarkLink = bookmarkElement.querySelector("a");
			if(bookmarkLink !== null) {
				bookmarkLink.href = bookmark.url;
			}

			// run the transformation of the search engine and the used location for our bookmark element.
			// Might add classes to our bookmark element for example
			searchEngine.bookmarkTransformation(config, bookmarkElement);
			injectionLocation.bookmarkTransformation(config, bookmarkElement);
			bookmarkList.appendChild(bookmarkElement);
		}

		// run the transformation of the search engine and the used location for our injection root element.
		// Might add classes to our injection root element for example
		searchEngine.transformation(config, injectionElement);
		injectionLocation.transformation(config, injectionElement);

		// actually insert our injection element into the container from the main DOM
		insertFunction(injectionRoot, searchEngine, injectionElement);
	} catch(error) {
		const config = error.config;
		const showLogo = config?.showLogo ?? true;
		const errorMessage = ("message" in error)
			? error.message
			: error;

		// base structure of the element we want to inject in an error case
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

		// find our root element of said error base structure
		const injectionDoc = parser.parseFromString(htmlString, "text/html");
		const injectionElement = injectionDoc.body.querySelector("div#bookmark-list-container");
		if(injectionElement === null) {
			throw new Error("Linkding-Injector: invalid injection element (null)");
		}
		injectionElement.querySelectorAll(".openOptions").forEach((el) => {
			el.addEventListener("click", openOptionsPage);
		});

		// run the transformation of the search engine and the used location for our injection root element.
		// Might add classes to our injection root element for example
		searchEngine.transformation(config, injectionElement);
		injectionLocation.transformation(config, injectionElement);

		// actually insert our (error) injection element into the container from the main DOM
		insertFunction(injectionRoot, searchEngine, injectionElement);
		throw new Error("Linkding-Injector: " + errorMessage);
	}
}

// find the search engine
const searchEngine = getSearchEngine(window.location);
// then the search term of this search engine
const searchTerm = searchEngine.getSearchTerm(window.location);
// and then directly execute the query for our linkding bookmarks
const search = executeSearch(searchTerm);
// depending on the search engines settings,
// once the DOM content is loaded or the whole page is loaded, we actually inject our results
if(searchEngine.injectionStartEvent === "DOMContentLoaded") {
	document.addEventListener("DOMContentLoaded", injectResults);
} else if(searchEngine.injectionStartEvent === "load") {
	window.addEventListener("load", injectResults);
}
}
