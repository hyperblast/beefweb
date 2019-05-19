export const defaultPlayerFeatures = Object.freeze({
    showTotalTime: true,
    linearVolumeControl: false,
});

function defineFeatures(obj)
{
    return Object.freeze(Object.assign({}, defaultPlayerFeatures, obj));
}

const featuresByPlayer = {
    deadbeef: defineFeatures({}),
    foobar2000: defineFeatures({
        showTotalTime: false,
        linearVolumeControl:  true,
    })
};

export function getPlayerFeatures(name)
{
    return featuresByPlayer[name] || defaultPlayerFeatures;
}
