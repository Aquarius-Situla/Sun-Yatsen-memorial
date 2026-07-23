export const Fragment = window.React.Fragment;
export const jsx = function(type, props, key) {
    const rest = { ...props };
    if (key !== undefined) rest.key = key;
    const children = rest.children;
    delete rest.children;
    
    if (children !== undefined) {
        if (Array.isArray(children)) {
            return window.React.createElement(type, rest, ...children);
        } else {
            return window.React.createElement(type, rest, children);
        }
    }
    return window.React.createElement(type, rest);
};
export const jsxs = jsx;
