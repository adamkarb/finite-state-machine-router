export const logger = (state, event, target) => {
    const { current, id } = state;
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    
    console.group(`%cFSM Router transition: %c${event} %c@ ${time}`, 'color: grey; font-weight: normal', 'font-weight: bold;', 'color: grey; font-weight: normal');
    console.log(`%cprev state: %c${current}\n`, 'color: grey; font-weight: bold;', 'color: black;');
    console.log(`%cevent: %c${event}\n`, 'color: blue; font-weight: bold;', 'color: black;');
    console.log(`%cnext state: %c#${id}.${target}\n`, 'color: green; font-weight: bold;', 'color: black;');
    console.groupEnd();
}

export const fakeUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16 | 0;
    let v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

const paramRegExp = /^:(.+)/;

export const isCurrentStack = (stateId, currentStack) => !!currentStack.split('.').find(state => state === stateId);
export const isDynamic = segment => paramRegExp.test(segment);
export const isRootSemgent = url => url.slice(1) === '';
export const segmentize = url => url.replace(/(^\/+|\/+$)/g, '').split('/');

export const injectUrlParameters = (path, params) => {
    const url = segmentize(path).map(seg => {
        if (isDynamic(seg)) {
            const segParam = seg.replace(':', '');

            if (Object.keys(params).includes(segParam)) {
                return params[segParam];
            } else {
                console.error(`Cannot push to a dynamic URL without supplying the proper parameters: ${seg} parameter is missing.`);
            }
        }

        return seg;
    });

    return '/' + url.join('/');
}

export const deriveStateFromUrl = (url, routeMap) => {
    let match = {
        params: {},
        path: url,
        stack: routeMap[url]
    }

    // 1. Exact match, no dynamic URL needed
    if (match.stack) {
        return match;
    }

    // 2. No exact match, check for dynamic URL match
    const dynamicPaths = Object.keys(routeMap).filter(route => route.match(/\/:/g));

    if (dynamicPaths.length) {
        // 2.1 Split url && route map into arrays, compare 1 by 1
        const urlSegments = segmentize(url);
        let params;
        const path = dynamicPaths.find(p => {
            const pathSegments = segmentize(p);
            params = {};

            if (pathSegments.length !== urlSegments.length) {
                return false;
            }

            // 2.2 infer parameter from URL from first segment array that matches in length
            return !pathSegments.map((pathSegment, i) => {
                if (isDynamic(pathSegment)) {
                    params[pathSegment.slice(1)] = urlSegments[i];
                    return true;
                } else if (pathSegment === urlSegments[i]) {
                    return true;
                }

                return false;
            }).includes(false);
        });

        return {
            params,
            path,
            stack: routeMap[path]
        }
    } else {
        return null;
    }
}