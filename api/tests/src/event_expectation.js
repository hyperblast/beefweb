'use strict';

const ExpectationState = Object.freeze({
    initializing: 0,
    waitingFirstEvent: 1,
    waitingCondition: 2,
    done: 3,
});

class EventExpectation
{
    constructor(sourceFactory, condition, options)
    {
        this.sourceFactory = sourceFactory;
        this.condition = condition;
        this.options = options || {};
        this.state = ExpectationState.initializing;
        this.ready = new Promise(this.runReadyPromise.bind(this));
    }

    runReadyPromise(resolve, reject)
    {
        this.resolveReady = resolve;
        this.rejectReady = reject;
        this.done = new Promise(this.runDonePromise.bind(this));
    }

    runDonePromise(resolve, reject)
    {
        this.resolveDone = resolve;
        this.rejectDone = reject;

        this.source = this.sourceFactory(this.handleEvent.bind(this));
        this.timeout = setTimeout(this.handleTimeout.bind(this), 3000);

        if (this.options.useFirstEvent)
        {
            this.state = ExpectationState.waitingCondition;
            this.resolveReady();
        }
        else
        {
            this.state = ExpectationState.waitingFirstEvent;
        }
    }

    handleEvent(event)
    {
        if (this.state === ExpectationState.done)
            return;

        if (this.state === ExpectationState.waitingFirstEvent)
        {
            this.state = ExpectationState.waitingCondition;
            this.resolveReady();
            return;
        }

        this.lastEvent = event;

        if (!this.condition(event))
            return;

        this.complete();
        this.resolveDone();
    }

    handleTimeout()
    {
        if (this.state === ExpectationState.done)
            return;

        const waitingFirstEvent = this.state === ExpectationState.waitingFirstEvent;
        const error = new Error('Failed to recieve expected event');

        this.complete();

        if (waitingFirstEvent)
            this.rejectReady(error);

        this.rejectDone(error);
    }

    complete()
    {
        this.state = ExpectationState.done;
        this.source.close();
        clearTimeout(this.timeout);
    }
}

module.exports = EventExpectation;
