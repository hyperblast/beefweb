const defaultPosition = Object.freeze({ offset: 0 });

export default class ScrollManager
{
    constructor()
    {
        this.components = {};
        this.positions = {};
    }

    registerComponent(key, component)
    {
        this.components[key] = component;
    }

    unregisterComponent(key)
    {
        delete this.components[key];
    }

    getPosition(key)
    {
        return this.positions[key] || defaultPosition;
    }

    savePosition(key, offset)
    {
        this.positions[key] = Object.freeze({ offset });
    }

    scrollToItem(key, offsetItem)
    {
        const component = this.components[key];
        const position = Object.freeze({ offsetItem });

        if (component)
            component.scrollTo(position);
        else
            this.positions[key] = position;
    }
}
