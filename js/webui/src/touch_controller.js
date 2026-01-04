const minTouchDistance = 100;

export default class TouchController
{
    constructor(navigationModel)
    {
        this.navigationModel = navigationModel;
        this.element = null;
        this.startX = null;
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    update()
    {
        const element = document.getElementsByClassName('panel-main')[0];
        if (element === this.element)
            return;

        this.element?.removeEventListener('touchstart', this.handleTouchStart);
        this.element?.removeEventListener('touchend', this.handleTouchEnd);

        this.startX = null;
        this.element = element;

        this.element?.addEventListener('touchstart', this.handleTouchStart);
        this.element?.addEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchStart(event)
    {
        this.startX = event.changedTouches[0].screenX;
    }

    handleTouchEnd(event)
    {
        if (!this.startX)
            return;

        const offset = event.changedTouches[0].screenX - this.startX;
        this.startX = null;

        if (offset >= minTouchDistance)
        {
            this.navigationModel.navigateToPrevious();
        }
        else if (offset <= -minTouchDistance)
        {
            this.navigationModel.navigateToNext();
        }
    }
}
