const DOM = new DOMParser();

export function removeHTML(html: string) {
	return DOM.parseFromString(html, "text/html").body.textContent;
}

/**
 * An alias to (await fetch(input, init)).json()
 * @param input url to fetch
 * @param init fetch options
 */
export async function jsonFetch(input: RequestInfo | URL, init?: RequestInit) {
	const response = await fetch(input, init);
	if (response.ok) return response.json();
	throw response.statusText;
}

/**
 * An alias to (await fetch(input, data, init)).json()
 * @param input url to fetch
 * @param data data to send
 * @param init fetch options
 */
export async function jsonPost(
	input: RequestInfo | URL,
	data: unknown,
	init?: RequestInit
) {
	const response = await fetch(input, {
		...init,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (response.ok) return response.json();
	throw response.statusText;
}
