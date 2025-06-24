import React, { useState, useEffect } from "react";

type InterruptEntry = {
  start: Date;
  end: Date | null;
};

type RadialTrackerProps = {
  setInterruptions: React.Dispatch<React.SetStateAction<InterruptEntry[]>>;
};

function RadialTracker({ setInterruptions }: RadialTrackerProps) {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [interruptionElapsed, setInterruptionElapsed] = useState(0);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (secs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${seconds}`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && progress < 1260) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1); // tick time
        setProgress(() => Math.floor(((elapsed + 1) / (1000 * 60)) * 100));
      }, 1000); // each tick = 100ms
    }
    return () => clearInterval(interval);
  }, [isRunning, progress]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isInterrupted) {
      interval = setInterval(() => {
        setInterruptionElapsed((prev) => prev + 1);
      }, 1000); // 1-second intervals for cleaner hh:mm:ss
    }
    return () => clearInterval(interval);
  }, [isInterrupted]);

  return (
    <>
      <div className="flex flex-col items-center space-y-4 p-6">
        <p className="text-lg font-medium">
          You have finished {progress}% of your task
        </p>

        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#3b82f6"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
          <g transform="rotate(90, 50, 50)">
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className="fill-gray-800 text-xs font-semibold"
            >
              {formatTime(elapsed)}
            </text>
          </g>
          {isInterrupted && (
            <g transform="rotate(90, 50, 50)">
              <text
                x="50"
                y="80"
                textAnchor="middle"
                className="fill-red-600 text-[10px] font-medium"
              >
                {formatTime(interruptionElapsed)}
              </text>
            </g>
          )}
        </svg>

        <button
          onClick={() => {
            setIsRunning((prev) => !prev);
            if (isInterrupted) {
              setIsInterrupted(false);
              setInterruptions((prev) => {
                const updated = [...prev];
                if (updated.length > 0) {
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    end: new Date(),
                  };
                }
                return updated;
              });
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {elapsed === 0
            ? "Start Timer"
            : isRunning
            ? "Pause Timer"
            : "Resume Timer"}
        </button>
        <button
          onClick={() => {
            setIsRunning(false); // pause main timer
            setIsInterrupted(true);
            setInterruptionElapsed(0); // optional reset for visual timer
            setInterruptions((prev) => [
              ...prev,
              { start: new Date(), end: null },
            ]);
          }}
          disabled={!isRunning}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            isRunning
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
        >
          {isInterrupted ? "Running Interruption…" : "Interrupt"}
        </button>
      </div>
    </>
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
