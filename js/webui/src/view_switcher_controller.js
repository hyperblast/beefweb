const minTouchDistance = 100;

export default class ViewSwitcherController
{
    constructor(navigationModel)
    {
        this.navigationModel = navigationModel;
        this.element = null;
        this.startX = null;
        this.startY = null;
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    start()
    {
        this.element = document.getElementById('app-container');
        this.element.addEventListener('touchstart', this.handleTouchStart);
        this.element.addEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchStart(event)
    {
        if (event.target instanceof HTMLInputElement)
            return;

        const { screenX, screenY } = event.changedTouches[0];

        this.startX = screenX;
        this.startY = screenY;
    }

    handleTouchEnd(event)
    {
        if (!this.startX || !this.startY)
            return;

        const { screenX, screenY } = event.changedTouches[0];

        const distanceX = screenX - this.startX;
        const distanceY = screenY - this.startY;

        this.startX = null;
        this.startY = null;

        if (Math.abs(distanceX) <= Math.abs(distanceY) || Math.abs(distanceX) < minTouchDistance)
            return;

        if (distanceY > 0)
            this.navigationModel.navigateToPrevious();
        else
            this.navigationModel.navigateToNext();
    }
}
