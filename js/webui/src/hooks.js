import { useCallback, useContext } from 'react';
import shallowEqual from 'shallowequal';
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

function getSnapshot(context, selector)
{
    const oldData = context.modelData.get(selector);
    const newData = selector(context);

    if (shallowEqual(oldData, newData))
        return oldData;

    context.modelData.set(selector, newData);
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

export const useCurrentView = defineModelData({
    selector: context => context.navigationModel.view,
    updateOn: { navigationModel: 'viewChange' }
});
