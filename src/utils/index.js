export function delay(timeout = 500) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}