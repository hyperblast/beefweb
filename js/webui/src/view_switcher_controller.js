import { bindHandlers } from './utils.js';

const switchDistance = 100;

export default class ViewSwitcherController
{
    constructor(navigationModel)
    {
        this.navigationModel = navigationModel;
        this.startX = 0;
        this.startY = 0;
        this.lastPosition = 0;
        this.styleElement = null;
        bindHandlers(this);
    }

    start()
    {
        window.addEventListener('touchstart', this.handleTouchStart);
        window.addEventListener('touchmove', this.handleTouchMove);
        window.addEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchStart(event)
    {
        // nasty
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLAnchorElement ||
            event.target instanceof SVGElement)
        {
            return;
        }

        const { screenX, screenY } = event.changedTouches[0];

        this.startX = screenX;
        this.startY = screenY;
    }

    handleTouchMove(event)
    {
        const swipeDistance = this.getSwipeDistance(event);

        if (swipeDistance)
            this.moveContent(swipeDistance);
    }

    handleTouchEnd(event)
    {
        const swipeDistance = this.getSwipeDistance(event);

        this.startX = 0;
        this.startY = 0;

        if (swipeDistance >= switchDistance)
            this.navigationModel.navigateToPrevious();
        else if (swipeDistance <= -switchDistance)
            this.navigationModel.navigateToNext();

        this.moveContent(0);
    }

    moveContent(position)
    {
        if (position === this.lastPosition)
            return;

        this.lastPosition = position;

        if (!this.styleElement)
        {
            this.styleElement = document.createElement('style');
            document.head.appendChild(this.styleElement);
        }

        this.styleElement.innerText = `.panel-header, .panel-main { left: ${position}px; }`;
    }

    getSwipeDistance(event)
    {
        if (!this.startX || !this.startY)
            return 0;

        const { screenX, screenY } = event.changedTouches[0];

        const distanceX = screenX - this.startX;
        const distanceY = screenY - this.startY;

        return Math.abs(distanceX) > Math.abs(distanceY) ? distanceX : 0;
    }
}
