const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'formaction']);

const hasUnsafeStyleValue = (value: string): boolean => {
    return /expression\s*\(|url\s*\(\s*['"]?\s*javascript:/i.test(value);
};

const hasUnsafeUrlValue = (value: string): boolean => {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
    return normalized.startsWith('javascript:') || normalized.startsWith('data:text/html');
};

const stripDangerousMarkup = (doc: Document) => {
    doc.querySelectorAll('script, iframe, object, embed, template').forEach((node) => node.remove());

    doc.querySelectorAll('*').forEach((element) => {
        for (const attr of Array.from(element.attributes)) {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value || '';

            if (attrName.startsWith('on') || attrName === 'srcdoc') {
                element.removeAttribute(attr.name);
                continue;
            }

            if (attrName === 'style' && hasUnsafeStyleValue(attrValue)) {
                element.removeAttribute(attr.name);
                continue;
            }

            if (URL_ATTRS.has(attrName) && hasUnsafeUrlValue(attrValue)) {
                element.removeAttribute(attr.name);
            }
        }
    });
};

export const createSafePdfContainer = (html: string): HTMLDivElement => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    stripDangerousMarkup(doc);

    const container = document.createElement('div');
    doc.head.querySelectorAll('style').forEach((styleTag) => {
        container.appendChild(styleTag.cloneNode(true));
    });
    doc.body.childNodes.forEach((node) => {
        container.appendChild(node.cloneNode(true));
    });

    return container;
};
