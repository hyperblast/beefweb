#include "../timers.hpp"

#include <catch.hpp>

namespace msrv {
namespace timers_tests {

class TestTimeSource : public TimeSource
{
public:
    TestTimeSource()
    {
        currentTime_ = steadyTime();
    }

    void update(DurationMs duration)
    {
        currentTime_ += duration;
    }

    virtual TimePointMs currentTime() override
    {
        return currentTime_;
    }

private:
    TimePointMs currentTime_;
};

TEST_CASE("timers")
{
    TestTimeSource timeSource;
    TimerQueue timerQueue(&timeSource);

    SECTION("calculate next timeout")
    {
        Timer timer1(&timerQueue, TimerCallback());
        Timer timer2(&timerQueue, TimerCallback());
        Timer timer3(&timerQueue, TimerCallback());

        auto now = timeSource.currentTime();

        REQUIRE_FALSE(timerQueue.nextTimeout());

        timer1.runOnce(DurationMs(200));
        REQUIRE(timerQueue.nextTimeout().value() == now + DurationMs(200));

        timer2.runPeriodic(DurationMs(100));
        REQUIRE(timerQueue.nextTimeout().value() == now + DurationMs(100));

        timer3.runPeriodic(DurationMs(150));
        REQUIRE(timerQueue.nextTimeout().value() == now + DurationMs(100));

        timer2.stop();
        REQUIRE(timerQueue.nextTimeout().value() == now + DurationMs(150));

        timer1.stop();
        REQUIRE(timerQueue.nextTimeout().value() == now + DurationMs(150));

        timer3.stop();
        REQUIRE_FALSE(timerQueue.nextTimeout());
    }

    SECTION("one time")
    {
        int runCount = 0;
        Timer timer(&timerQueue, [&] (Timer*) { runCount++; });

        timer.runOnce(DurationMs(100));

        SECTION("no run")
        {
            timeSource.update(DurationMs(50));
            timerQueue.execute();
            REQUIRE(runCount == 0);
        }

        SECTION("run once")
        {
            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount == 1);

            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount == 1);
        }
    }

    SECTION("periodic timer")
    {
        int runCount = 0;
        Timer timer(&timerQueue, [&] (Timer*) { runCount++; });

        timer.runPeriodic(DurationMs(100));

        SECTION("no run")
        {
            timeSource.update(DurationMs(50));
            timerQueue.execute();
            REQUIRE(runCount == 0);
        }

        SECTION("run once")
        {
            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount == 1);
        }

        SECTION("run twice")
        {
            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount == 1);

            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount == 2);
        }

        SECTION("no run twice if lagging")
        {
            timeSource.update(DurationMs(200));
            timerQueue.execute();
            REQUIRE(runCount == 1);
        }
    }

    SECTION("two timers")
    {
        int runCount1 = 0;
        int runCount2 = 0;

        Timer timer1(&timerQueue, [&] (Timer*) { runCount1++; });
        Timer timer2(&timerQueue, [&] (Timer*) { runCount2++; });

        SECTION("same time")
        {
            timer1.runOnce(DurationMs(100));
            timer2.runPeriodic(DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount1 == 1);
            REQUIRE(runCount1 == 1);
        }

        SECTION("different times")
        {
            timer1.runOnce(DurationMs(150));
            timer2.runPeriodic(DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount1 == 0);
            REQUIRE(runCount2 == 1);

            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount1 == 1);
            REQUIRE(runCount2 == 2);

            timeSource.update(DurationMs(100));
            timerQueue.execute();
            REQUIRE(runCount1 == 1);
            REQUIRE(runCount2 == 3);
        }
    }

    SECTION("modify in callback")
    {
        SECTION("stop in callback")
        {
            int callCount = 0;

            Timer timer(&timerQueue,  [&] (Timer* t)
            {
                t->stop();
                callCount++;
            });

            timer.runPeriodic(DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 1);
            REQUIRE(timer.state() == TimerState::STOPPED);

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 1);
        }

        SECTION("restart one shot in callback")
        {
            int callCount = 0;

            Timer timer(&timerQueue, [&] (Timer* t)
            {
                t->runOnce(DurationMs(100));
                callCount++;
            });

            timer.runOnce(DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 1);
            REQUIRE(timer.state() == TimerState::RUNNING);
            REQUIRE(timer.runAt() == timeSource.currentTime() + DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 2);
            REQUIRE(timer.state() == TimerState::RUNNING);
            REQUIRE(timer.runAt() == timeSource.currentTime() + DurationMs(100));
        }

        SECTION("restart periodic in callback")
        {
            int callCount = 0;
            bool willUpdatePeriod = true;

            Timer timer(&timerQueue, [&] (Timer* t)
            {
                if (willUpdatePeriod)
                {
                    t->runPeriodic(DurationMs(200));
                    willUpdatePeriod = true;
                }

                callCount++;
            });

            timer.runPeriodic(DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 1);
            REQUIRE(timer.state() == TimerState::RUNNING);
            REQUIRE(timer.period() == DurationMs(200));
            REQUIRE(timer.runAt() == timeSource.currentTime() + DurationMs(200));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 1);

            timeSource.update(DurationMs(200));
            timerQueue.execute();

            REQUIRE(callCount == 2);
        }

        SECTION("switch to one shot in callback")
        {
            int callCount = 0;
            bool willRunOnce = true;

            Timer timer(&timerQueue, [&] (Timer* t)
            {
                if (willRunOnce)
                {
                    t->runOnce(DurationMs(100));
                    willRunOnce = false;
                }

                callCount++;
            });

            timer.runPeriodic(DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 1);
            REQUIRE_FALSE(timer.isPeriodic());
            REQUIRE(timer.state() == TimerState::RUNNING);
            REQUIRE(timer.runAt() == timeSource.currentTime() + DurationMs(100));

            timeSource.update(DurationMs(100));
            timerQueue.execute();

            REQUIRE(callCount == 2);
            REQUIRE(timer.state() == TimerState::STOPPED);
        }
    }
}

}}
