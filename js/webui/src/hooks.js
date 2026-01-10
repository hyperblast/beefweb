import { useCallback, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import shallowEqual from 'shallowequal';
import ServiceContext from './service_context.js';
import { subscribeAll } from './model_base.js';

export function useServices()
{
    return useContext(ServiceContext);
}

export function useDispose(callback)
{
    return useEffect(() => callback, []);
}

export function usePlaylistModel()
{
    return useServices().playlistModel;
}

export function useColumnsSettingsModel()
{
    return useServices().columnsSettingsModel;
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

function getSnapshot(context, selector, store)
{
    const newData = selector(context);

    if (shallowEqual(store.current, newData))
        return store.current;

    return store.current = newData;
}

export function defineModelData(arg)
{
    const { selector, updateOn } = arg;

    return function useModelData()
    {
        const context = useServices();
        const store = useRef();
        const subscribe = useCallback(cb => subscribeAll(context, updateOn, cb), []);
        const snapshot = useCallback(() => getSnapshot(context, selector, store), []);
        return useSyncExternalStore(subscribe, snapshot);
    };
}


export const useCurrentView = defineModelData({
    selector: context => context.navigationModel.view,
    updateOn: { navigationModel: 'viewChange' }
});
