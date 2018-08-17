export const ErrorType = Object.freeze({
    none: 'none',
    unknown: 'unknown',
    internal: 'internal',
    invalidParam: 'invalidParam',
    invalidState: 'invalidState',
    notFound: 'notFound',
    accessDenied: 'accessDenied'
});

export const SwitchParam = Object.freeze({
    toggle: 'toggle'
});

export const PlaybackState = Object.freeze({
    stopped: 'stopped',
    playing: 'playing',
    paused: 'paused'
});
