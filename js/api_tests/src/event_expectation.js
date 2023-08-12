const ExpectationState = Object.freeze({
    initializing: 0,
    waitingFirstEvent: 1,
    waitingCondition: 2,
    done: 3,
});

const defaultOptions = Object.freeze({
    useFirstEvent: false,
    timeout: 3000,
    includeEventData: false,
});

class EventExpectation
{
    constructor(sourceFactory, condition, options)
    {
        this.sourceFactory = sourceFactory;
        this.condition = condition;
        this.options = Object.assign({}, defaultOptions, options);
        this.state = ExpectationState.initializing;
        this.allEvents = [];
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

        this.timeout = setTimeout(
            this.handleTimeout.bind(this), this.options.timeout);

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

        if (this.options.includeEventData)
            this.allEvents.push(event);

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

        let errorMessage = "Failed to receive expected event";

        if (this.options.includeEventData)
        {
            errorMessage = errorMessage + ", events: " + JSON.stringify(this.allEvents, null, '  ');
        }

        const error = new Error(errorMessage);

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

export default EventExpectation;
