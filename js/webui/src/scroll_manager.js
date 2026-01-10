const defaultPosition = Object.freeze({ item: 0, offset: 0 });

export default class ScrollManager
{
    constructor()
    {
        this.components = new Map();
        this.positions = new Map();
    }

    registerComponent(key, component)
    {
        this.components.set(key, component);
    }

    unregisterComponent(key)
    {
        this.components.delete(key);
    }

    getPosition(key)
    {
        return this.positions.get(key) || defaultPosition;
    }

    savePosition(key, item, offset)
    {
        this.positions.set(key, Object.freeze({ item, offset }));
    }

    scrollToItem(key, item)
    {
        const component = this.components.get(key);
        const position = Object.freeze({ item, offset: 0 });

        if (component)
            component.scrollTo(position);
        else
            this.positions.set(key, position);
    }
}
