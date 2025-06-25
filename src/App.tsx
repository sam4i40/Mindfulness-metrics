import React, { useState, useEffect } from "react";

type InterruptEntry = {
  start: Date;
  end: Date | null;
};

type RadialTrackerProps = {
  setInterruptions: React.Dispatch<React.SetStateAction<InterruptEntry[]>>;
};

type RadialTimerProps = {
  progress: number;
  timeLeft: number;
};

type TimerControlProps = {
  timerStarted: boolean;
  isRunning: boolean;
  isInterrupted: boolean;
  onToggleRun: () => void;
};

type InterruptControlProps = {
  isRunning: boolean;
  isInterrupted: boolean;
  onStartInterrupt: () => void;
  onEndInterrupt: () => void;
};

type SessionTimeSelectorProps = {
  sessionMinutes: number;
  isRunning: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
};

function RadialTimer({ progress, timeLeft }: RadialTimerProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = (progress / 100) * circumference;

  // time format
  const formatTime = (secs: number) => {
    const hrs = String(Math.floor(secs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const secsR = String(secs % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secsR}`;
  };

  return (
    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#e5e7eb"
        strokeWidth="10"
        fill="none"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#3b82f6"
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <g transform="rotate(90,50,50)">
        <text
          x="50"
          y="55"
          textAnchor="middle"
          className="fill-gray-800 text-xs font-semibold"
        >
          {formatTime(timeLeft)}
        </text>
      </g>
    </svg>
  );
}

function TimerControl({
  timerStarted,
  isRunning,
  isInterrupted,
  onToggleRun,
}: TimerControlProps) {
  // If interrupted, we keep it showing “Pause Timer”
  const label = !timerStarted
    ? "Start Timer"
    : isRunning
    ? "Pause Timer"
    : "Resume Timer";

  return (
    <button
      onClick={onToggleRun}
      disabled={isInterrupted}
      className={`px-4 py-2 rounded-md transition-colors duration-200 ${
        isInterrupted
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      {label}
    </button>
  );
}

function InterruptControl({
  isRunning,
  isInterrupted,
  onStartInterrupt,
  onEndInterrupt,
}: InterruptControlProps) {
  if (isInterrupted) {
    return (
      <button
        onClick={onEndInterrupt}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Back to Focus
      </button>
    );
  }

  return (
    <button
      onClick={onStartInterrupt}
      disabled={!isRunning}
      className={`px-4 py-2 rounded-md transition ${
        isRunning
          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
          : "bg-gray-400 cursor-not-allowed text-white"
      }`}
    >
      Interrupt
    </button>
  );
}

function SessionTimeSelector({
  sessionMinutes,
  onIncrease,
  onDecrease,
  isRunning,
}: SessionTimeSelectorProps) {
  // Format “X hr Y min” for display below the input
  const hrs = Math.floor(sessionMinutes / 60);
  const mins = sessionMinutes % 60;
  const formatted =
    hrs > 0 ? `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} min` : `${mins} min`;

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="flex items-center space-x-2">
        <button
          onClick={onDecrease}
          disabled={sessionMinutes <= 10 || isRunning}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          −
        </button>

        <span className="w-16 text-center border rounded px-2 py-1 inline-block">
          {sessionMinutes} min
        </span>

        <button
          disabled={isRunning}
          onClick={onIncrease}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          +
        </button>
      </div>
    </div>
  );
}

function RadialTracker({ setInterruptions }: RadialTrackerProps) {
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [targetTime, setTargetTime] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [interruptionElapsed, setInterruptionElapsed] = useState(0);

  // Fix target time
  useEffect(() => {
    setTargetTime(sessionMinutes * 60);
  }, [sessionMinutes]);

  // Tick main timer
  useEffect(() => {
    if (!isRunning || timeLeft == 0) return;
    const id = setInterval(() => {
      setTimeLeft((e) => e - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, targetTime, timeLeft]);

  // Sync progress percent
  useEffect(() => {
    setProgress(Math.floor(((targetTime - timeLeft) / targetTime) * 100));
  }, [timeLeft, targetTime]);

  // Tick interruption timer
  useEffect(() => {
    if (!isInterrupted) return;
    const id = setInterval(() => {
      setInterruptionElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isInterrupted]);

  // Handle time completion
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      setIsRunning(false);
    }
  }, [timeLeft, isRunning]);

  // Handlers
  const toggleRun = () => {
    if (isInterrupted) {
      setIsInterrupted(false);
      setIsRunning(true);
      setInterruptions((prev) => {
        const a = [...prev];
        if (a.length) {
          a[a.length - 1] = { ...a[a.length - 1], end: new Date() };
        }
        return a;
      });
    } else {
      setIsRunning((r) => !r);
      if (!timerStarted) {
        setTimerStarted(true);
        setTargetTime(sessionMinutes * 60);
        setTimeLeft(targetTime);
      }
    }
  };

  const startInterrupt = () => {
    setIsRunning(false);
    setIsInterrupted(true);
    setInterruptionElapsed(0);
    setInterruptions((prev) => [...prev, { start: new Date(), end: null }]);
  };

  const endInterrupt = () => toggleRun();

  const increaseSession = () => setSessionMinutes((m) => m + 10);
  const decreaseSession = () => setSessionMinutes((m) => Math.max(15, m - 10));

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <h1 className="font-bold">You have finished {progress}% of your task</h1>

      <RadialTimer progress={progress} timeLeft={timeLeft} />

      <SessionTimeSelector
        sessionMinutes={sessionMinutes}
        isRunning={isRunning}
        onIncrease={increaseSession}
        onDecrease={decreaseSession}
      />

      <TimerControl
        timerStarted={timerStarted}
        isRunning={isRunning}
        isInterrupted={isInterrupted}
        onToggleRun={toggleRun}
      />

      <InterruptControl
        isRunning={isRunning}
        isInterrupted={isInterrupted}
        onStartInterrupt={startInterrupt}
        onEndInterrupt={endInterrupt}
      />
    </div>
  );
}

function App() {
  const [interruptions, setInterruptions] = useState<InterruptEntry[]>([]);

  return (
    <>
      <RadialTracker setInterruptions={setInterruptions} />
    </>
  );
}

export default App;
