export const defaultPlayerFeatures = Object.freeze({
    showTotalTime: true,
});

function defineFeatures(obj)
{
    return Object.freeze(Object.assign({}, defaultPlayerFeatures, obj));
}

const featuresByPlayer = {
    deadbeef: defineFeatures({}),
    foobar2000: defineFeatures({
        showTotalTime: false,
    })
};

export function getPlayerFeatures(name)
{
    return featuresByPlayer[name] || defaultPlayerFeatures;
}
