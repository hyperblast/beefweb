import { useCallback, useContext, useRef } from 'react';
import ServiceContext from './service_context.js';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { subscribeAll } from './model_base.js';

export function useServices()
{
    return useContext(ServiceContext);
}

export function useSettingValue(settingName)
{
    const { settingsModel } = useServices();
    const metadata = settingsModel.metadata[settingName];
    return useSyncExternalStore(metadata.subscriber, metadata.getter);
}

export function useSetting(settingName)
{
    const { settingsModel } = useServices();
    const metadata = settingsModel.metadata[settingName];
    const value = useSyncExternalStore(metadata.subscriber, metadata.getter);
    return [value, metadata.setter];
}

function getSnapshot(context, selector, modelData)
{
    const oldData = modelData.current;
    const newData = selector(context);

    if (oldData === null)
        return modelData.current = newData;

    for (let key in oldData)
    {
        if (oldData[key] !== newData[key])
            return modelData.current = newData;
    }

    return oldData;
}

export function defineModelData(arg)
{
    const { selector, updateOn } = arg;

    return () => {
        const context = useServices();
        const modelData = useRef(null);
        const subscribe = useCallback(cb => subscribeAll(context, updateOn, cb), []);
        const snapshot = useCallback(() => getSnapshot(context, selector, modelData), []);
        return useSyncExternalStore(subscribe, snapshot);
    };
}
