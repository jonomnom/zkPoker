
import prompts from 'prompts';

export enum Actions {
    REGISTER,
    SHUFFLE,
    PROVIDE_DRAW_PROOF,
    OPEN_CARD,
    GAME_INFO,
    CHECK_WINNER,
    EXIT,
}

const actions = [
    { title: 'Register to the game', value: Actions.REGISTER },
    { title: 'Shuffle deck', value: Actions.SHUFFLE },
    { title: 'Provide draw proof', value: Actions.PROVIDE_DRAW_PROOF },
    { title: 'Open card', value: Actions.OPEN_CARD },
    { title: 'Game info', value: Actions.GAME_INFO },
    { title: 'Check winner', value: Actions.CHECK_WINNER },
    { title: 'Exit', value: Actions.EXIT },
];

export const interactiveLoop = async (handler: (action: Actions) => Promise<any>, globalMessage?: string) => {
    const { value } = await prompts({
        type: 'select',
        name: 'value',
        message: 'Pick an action',
        choices: actions,
        initial: 0,
        hint: globalMessage,
    });
    // exit the loop
    if (value == Actions.EXIT) {
        return;
    }
    try {
        await handler(value);
    } catch (e: any) {
        console.log('!! Transaction error:', e.reason, '!!');
    }
    await interactiveLoop(handler);
}