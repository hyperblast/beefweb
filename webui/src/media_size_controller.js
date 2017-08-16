export default class MediaSizeController
{
    constructor(model)
    {
        this.model = model;
    }

    start()
    {
        this.widthQuery = window.matchMedia("(max-width: 700px)");
        this.widthQuery.addListener(this.handleWidthChange.bind(this));
        this.handleWidthChange();
    }

    handleWidthChange()
    {
        this.model.setCompactMode(this.widthQuery.matches);
    }
}
