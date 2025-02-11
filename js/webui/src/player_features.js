export const defaultPlayerFeatures = Object.freeze({
    showTotalTime: false,
    prependToQueue: false,
});

function defineFeatures(obj)
{
    return Object.freeze(Object.assign({}, defaultPlayerFeatures, obj));
}

const featuresByPlayer = {
    deadbeef: defineFeatures({
        showTotalTime: true,
        prependToQueue: true,
    }),
    foobar2000: defineFeatures({
    })
};

export function getPlayerFeatures(name)
{
    return featuresByPlayer[name] || defaultPlayerFeatures;
}
