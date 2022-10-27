const DOM = new DOMParser();

export function removeHTML(html: string) {
	return DOM.parseFromString(html, "text/html").body.textContent;
}
