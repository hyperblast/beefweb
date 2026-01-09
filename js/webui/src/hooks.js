import { useCallback, useContext, useEffect, useRef } from 'react';
import shallowEqual from 'shallowequal';
import ServiceContext from './service_context.js';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
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

function getSnapshot(context, selector)
{
    const oldData = context.modelData.get(selector);
    const newData = selector(context);

    if (shallowEqual(oldData, newData))
        return oldData;

    context.modelData.set(selector, newData);
    return newData;
}

function getKeyedSnapshot(context, selector, store, key)
{
    const oldData = store.current && shallowEqual(store.current.lastKey, key)
                    ? store.current.lastValue
                    : null;

    const newData = selector(context, key);

    if (shallowEqual(oldData, newData))
        return oldData;

    store.current = { lastKey: key, lastValue: newData };
    return newData;
}

export function defineModelData(arg)
{
    const { selector, updateOn } = arg;

    return () => {
        const context = useServices();
        const subscribe = useCallback(cb => subscribeAll(context, updateOn, cb), []);
        const snapshot = useCallback(() => getSnapshot(context, selector), []);
        return useSyncExternalStore(subscribe, snapshot);
    };
}

export function defineKeyedModelData(arg)
{
    const { selector, updateOn } = arg;

    return key => {
        const context = useServices();
        const store = useRef(null);
        const subscribe = useCallback(cb => subscribeAll(context, updateOn, cb), []);
        const snapshot = useCallback(() => getKeyedSnapshot(context, selector, store, key), [key]);
        return useSyncExternalStore(subscribe, snapshot);
    };
}

export const useCurrentView = defineModelData({
    selector: context => context.navigationModel.view,
    updateOn: { navigationModel: 'viewChange' }
});
