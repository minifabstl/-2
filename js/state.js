export function createState(initialValue) {
    let value = initialValue;
    const subscribers = new Set();

    return {
        get() {
            return value;
        },
        set(newValue) {
            value = typeof newValue === 'function' ? newValue(value) : newValue;
            subscribers.forEach(callback => callback(value));
        },
        subscribe(callback) {
            subscribers.add(callback);
            callback(value);
            return () => {
                subscribers.delete(callback);
            };
        }
    };
}

export const atoms = {
    currentUser: createState(null),
    theme: createState('dark'),
    sidebarOpen: createState(false),
    searchQuery: createState(''),
    notifications: createState([])
};

export function getState(name) {
    if (!atoms[name]) throw new Error(`State atom ${name} not found`);
    return atoms[name].get();
}

export function setState(name, value) {
    if (!atoms[name]) throw new Error(`State atom ${name} not found`);
    atoms[name].set(value);
}

export function subscribeToState(name, callback) {
    if (!atoms[name]) throw new Error(`State atom ${name} not found`);
    return atoms[name].subscribe(callback);
}
