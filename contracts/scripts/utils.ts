export const makeArray = (length: number) => {
    return Array.from({ length }).map((_, i) => i);
}

export const waterfall = async () => {

}

export const sleep = async (msec: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, msec)
    })
}
