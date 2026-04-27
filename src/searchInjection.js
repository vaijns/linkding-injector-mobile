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
 * @typedef {Object} InjectionLocation
 * @property {string} name
 * @property {(injectedElement: Element) => void} transformation
 * @property {(injectionRoot: Element, searchEngine: SearchEngine, injectionElement: Element) => void} insert
 */

///** @type { { [key: string]: InjectionLocation } } */
const injectionLocations = /** @type {const} */ Object.freeze({
	/** @type {InjectionLocation} */ top: {
		name: "top",
		transformation: (element) => {
			element.classList.add("injection-location-top");
		},
		insert: (injectionRoot, _, injectionElement) => {
			injectionRoot.prepend(injectionElement);
		}
	},
	/** @type {InjectionLocation} */ sidebar: {
		name: "sidebar",
		transformation: (element) => {
			element.classList.add("injection-location-sidebar");
		},
		insert: (injectionRoot, _, injectionElement) => {
			injectionRoot.prepend(injectionElement);
		}
	},
	// TODO: decide whether it is better to have brave as an extra InjectionLocation here,
	// or if the setTimeout functionality should be handled through an `if` based on the (currently unused) `searchEngine` parameter
	/** @type {InjectionLocation} */ sidebarBrave: {
		name: "sidebar",
		transformation: (element) => {
			element.classList.add("injection-location-sidebar");
		},
		insert: (injectionRoot, _, injectionElement) => {
			// Brave search seems to remove the injection box if it is injected too soon.
			// Wait a bit before injecting.
			window.setTimeout(() => {
				injectionRoot.prepend(injectionElement);
			}, 1600);
		}
	}
});

/**
 * @typedef {Object} InjectionContainerQueryResult
 * @property {Element} element
 * @property {InjectionLocation} location
 */

/**
 * @typedef {Object} InjectionContainerQuery
 * @property {string} name
 * @property {() => Promise<InjectionContainerQueryResult | Error>} tryResolve
 */

/**
 * @typedef {Object} SearchEngine
 * @property {string} name
 * @property {(location: Location) => SearchRequest} getSearchTerm
 * @property {(location: Location) => boolean} isMatch
 * @property {(injectedElement: Element) => void} transformation
 * @property {Array.<InjectionContainerQuery>} injectionQueries
 */

/**
 * @param {string} className
 * @returns {() => Promise<InjectionContainerQueryResult | Error>}
 */
function defaultTryResolveFunction(className) {
	return () => new Promise((resolve, _) => {
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
			location: injectionLocations.sidebar
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
		transformation: (element) => {
			element.classList.add("search-engine-duckduckgo");
		},
		injectionQueries: [{
			name: "duckduckgo-sidebar",
			tryResolve: defaultTryResolveFunction("section[data-area=sidebar]")
		}, {
			name: "duckduckgo-top",
			tryResolve: defaultTryResolveFunction("section[data-area=mainline]")
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
		transformation: (element) => {
			element.classList.add("search-engine-google");
		},
		injectionQueries: [{
			name: "google-sidebar",
			tryResolve: () => {
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
						location: injectionLocations.sidebar
					});
				});
			}
		}, {
			name: "google-top",
			tryResolve: defaultTryResolveFunction("#topstuff")
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
		transformation: (element) => {
			element.classList.add("search-engine-brave");
		},
		injectionQueries: [{
			name: "brave-sidebar",
			tryResolve: defaultTryResolveFunction("aside.sidebar")
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
		transformation: (element) => {
			element.classList.add("search-engine-kagi");
		},
		injectionQueries: [{
			name: "kagi-sidebar",
			tryResolve: defaultTryResolveFunction(".right-content-box > ._0_right_sidebar")
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
		transformation: (element) => {
			element.classList.add("search-engine-searx");
		},
		injectionQueries: [{
			name: "searx-sidebar",
			tryResolve: defaultTryResolveFunction("#sidebar")
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
		transformation: (element) => {
			element.classList.add("search-engine-qwant");
		},
		injectionQueries: [{
			name: "qwant-sidebar",
			tryResolve: () => {
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
								location: injectionLocations.sidebar
							});
						}
					});

					qwantObserver.observe(document.body, {
						childList: true,
						subtree: true
					});

				});
			}
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
					resolve(message);
				});
				port.postMessage({ searchTerm: searchTerm });
			} catch(err) {
				reject(err);
			}
		} else if(typeof chrome !== "undefined") {
			const port = chrome.runtime.connect({ name: "port-from-cs" });
			try {
				port.onMessage.addListener((message) => {
					resolve(message);
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
 * @param {Event} _
 */
async function injectResults(_) {
	const searchResult = await search;
	const injectionQueryResult = await searchEngine.injectionQueries.reduce(async (/** @type {Promise<InjectionContainerQueryResult | Error | null>} */ previousResult, current) => {
		return previousResult
			.then(async (val) => {
				if(val !== null && !(val instanceof Error)) {
					return val;
				}

				return await current.tryResolve();
			})
			.catch(async (_) => {
				return await current.tryResolve();
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

	let injectionElement = document.createElement("p");
	searchEngine.transformation(injectionElement);
	injectionLocation.transformation(injectionElement);

	// TODO: Just inserting the result as json for now. Instead, this is where the injection element should be built.
	injectionElement.innerText = JSON.stringify(searchResult);

	injectionLocation.insert(injectionRoot, searchEngine, injectionElement);
}

const searchEngine = getSearchEngine(window.location);
const search = executeSearch(searchEngine.getSearchTerm(window.location));
window.addEventListener("load", injectResults);
