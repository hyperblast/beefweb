import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import shallowEqual from 'shallowequal';
import ServiceContext from './service_context.js';
import { subscribeAll } from './model_base.js';
import { subscribeWindowResize } from './dom_utils.js';

export function useOverflowDetection(deps)
{
    const [overflow, setOverflow] = useState(false);
    const containerRef = useRef();

    useLayoutEffect(() => {
        const updateOverflow = () => {
            if (containerRef.current)
                setOverflow(containerRef.current.clientWidth < containerRef.current.scrollWidth);
        };

        updateOverflow();
        return subscribeWindowResize(updateOverflow);
    }, deps);

    return [overflow, containerRef];
}

export function useDispose(callback)
{
    return useEffect(() => callback, []);
}

export function useServices()
{
    return useContext(ServiceContext);
}

export function usePlaylistModel()
{
    return useServices().playlistModel;
}

export function useFileBrowserModel()
{
    return useServices().fileBrowserModel;
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
