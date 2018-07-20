export default class Timer
{
    constructor(callback, period)
    {
        this.period = period;
        this.callback = callback;
        this.intervalId = null;

        this.update = this.update.bind(this);
    }

    restart()
    {
        this.stop();
        this.lastTick = Date.now();
        this.intervalId = setInterval(this.update, this.period);
    }

    stop()
    {
        if (this.intervalId)
        {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    update()
    {
        const now = Date.now();
        const delta = now - this.lastTick;
        this.lastTick = now;
        this.callback(delta);
    }
}
