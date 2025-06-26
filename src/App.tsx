import React, { useState, useRef, useEffect } from "react";
import {
  useSortable,
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { v4 as uuid } from "uuid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import confetti from "canvas-confetti";

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
  onReset: () => void;
};

type InterruptControlProps = {
  isRunning: boolean;
  isInterrupted: boolean;
  onStartInterrupt: () => void;
  onEndInterrupt: () => void;
};

type SessionTimeSelectorProps = {
  sessionMinutes: number;
  onIncrease: () => void;
  onDecrease: () => void;
};

type InterruptModalProps = {
  isInterrupted: boolean;
  onEndInterrupt: () => void;
};

type Task = {
  id: string;
  text: string;
};

type TaskItemProps = {
  task: Task;
  onDelete: (id: string) => void;
};

type ShowChartProps = {
  interruptions: InterruptEntry[];
};

type HourlyInterrupts = { [hour: number]: number };

type ChartDatum = {
  hourLabel: string;
  interruptedTime: string;
  minutesDecimal: number;
};

interface CelebrationModalProps {
  count: number;
  onClose: () => void;
}

function RadialTimer({ progress, timeLeft }: RadialTimerProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

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
        stroke="#e29578"
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
          className="fill-gray-900 text-l font-bold"
        >
          {formatTime(timeLeft)}
        </text>
      </g>
    </svg>
  );
}

function SessionTimeSelector({
  sessionMinutes,
  onIncrease,
  onDecrease,
}: SessionTimeSelectorProps) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="flex items-center space-x-2 justify-center gap-4 mt-4">
        <button
          onClick={onDecrease}
          disabled={sessionMinutes < 10}
          className="w-10 h-10 text-2xl text-white font-bold rounded-full bg-[#00444A] shadow-sm
          hover:bg-[#83c5be] transition-all duration-200 active:scale-90"
        >
          −
        </button>

        <span
          className="px-4 py-2 rounded-2xl bg-white border border-gray-300 shadow-inner 
        text-l text-[#006d77] font-bold tracking-wide"
        >
          {sessionMinutes} min
        </span>

        <button
          onClick={onIncrease}
          className="w-10 h-10 text-2xl text-white font-bold rounded-full bg-[#00444A] shadow-sm
          hover:bg-[#83c5be] transition-all duration-200 active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

function TimerControl({
  timerStarted,
  isRunning,
  onReset,
  onToggleRun,
}: TimerControlProps) {
  // If interrupted, we keep it showing “Pause Timer”
  const label = !timerStarted ? "Start" : isRunning ? "Pause" : "Resume";

  return (
    <div className="grid grid-cols-2 place-items-center gap-5">
      <button
        onClick={onToggleRun}
        className="w-40 h-12 rounded-full font-bold text-l text-white tracking-wide transition-all 
      duration-300 flex items-center justify-center shadow-md ring-1 ring-inset ring-white 
      bg-gradient-to-r from-[#00444A] to-[#579A97] hover:brightness-110 active:scale-90"
      >
        {label}
      </button>
      <button
        onClick={onReset}
        className="w-40 h-12 rounded-full font-bold text-l text-white tracking-wide transition-all 
      duration-300 flex items-center justify-center shadow-md ring-1 ring-inset ring-white 
      bg-gradient-to-r from-[#00444A] to-[#579A97] hover:brightness-110 active:scale-90"
      >
        Reset
      </button>
    </div>
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
      <InterruptModal
        isInterrupted={isInterrupted}
        onEndInterrupt={onEndInterrupt}
      />
    );
  }

  return (
    <button
      onClick={onStartInterrupt}
      disabled={!isRunning}
      className={`w-40 h-12 rounded-full font-bold text-l text-white tracking-wide transition-all 
        duration-300 flex items-center justify-center shadow-md ring-1 ring-inset ring-white
    ${
      isRunning
        ? "bg-gradient-to-r from-[#D06842] to-[#E08F72] hover:brightness-105 active:scale-90"
        : "bg-gray-400 cursor-not-allowed"
    }`}
    >
      Log Interruption
    </button>
  );
}

function CelebrationModal({ count, onClose }: CelebrationModalProps) {
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center justify-center backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div
        className="bg-white text-[#00444A] rounded-4xl shadow-lg p-6 w-11/12 max-w-md 
      text-center relative"
      >
        <h2 id="celebration-title" className="text-3xl font-bold mb-4">
          🎉 Congratulations!
        </h2>

        <p className="text-lg mb-6">
          You’ve finished your{" "}
          <span className="font-semibold text-[#D06842]">{ordinal(count)}</span>{" "}
          session.
        </p>

        <button
          onClick={onClose}
          className="w-20 h-10 text-m text-white font-bold rounded-lg bg-[#00444A] shadow-sm
          hover:bg-[#83c5be] transition-all duration-200 active:scale-90"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function InterruptModal({
  isInterrupted,
  onEndInterrupt,
}: InterruptModalProps) {
  const [interruptTime, setInterruptTime] = useState(0);

  useEffect(() => {
    setInterruptTime(0);
    const timer = setInterval(() => setInterruptTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isInterrupted]);

  const formatTime = (s: number) =>
    new Date(s * 1000).toISOString().substring(11, 19);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center justify-center backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interruption-title"
    >
      <div
        className="bg-white text-[#00444A] rounded-4xl shadow-lg p-6 w-12/12 max-w-md 
      text-center relative"
      >
        <h2 id="interruption-title" className="text-2xl font-bold mb-4">
          ⚠️ Session Interrupted
        </h2>
        <div className="text-2xl font-mono mb-4">
          {formatTime(interruptTime)}
        </div>
        <button
          onClick={onEndInterrupt}
          className="w-20 h-10 text-m text-white font-bold rounded-lg bg-[#00444A] shadow-sm
          hover:bg-[#83c5be] transition-all duration-200 active:scale-90"
        >
          Close
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
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Fix target time
  useEffect(() => {
    setTargetTime(sessionMinutes * 60);
  }, [sessionMinutes]);

  // Tick main timer
  useEffect(() => {
    if (!isRunning || timeLeft === 0) return () => {};
    const timer = setInterval(() => {
      setTimeLeft((e) => e - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Sync progress percentage
  useEffect(() => {
    setProgress(Math.floor(((targetTime - timeLeft) / targetTime) * 100));
  }, [timeLeft, targetTime]);

  // Handle time completion
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      setCompletedSessions((prev) => prev + 1);
      setShowModal(true);
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
      });
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
    setInterruptions((prev) => [...prev, { start: new Date(), end: null }]);
  };

  const endInterrupt = () => toggleRun();

  const increaseSession = () => setSessionMinutes((m) => m + 10);
  const decreaseSession = () => setSessionMinutes((m) => Math.max(10, m - 10));

  const onReset = () => {
    setSessionMinutes(60);
    setTargetTime(0);
    setTimerStarted(false);
    setTimeLeft(0);
    setProgress(0);
    setIsRunning(false);
    setIsInterrupted(false);
  };

  return (
    <>
      <div className="text-center py-3 text-4xl font-bold text-[#D87C5A] border-b border-gray-400">
        Mindful Metrics
      </div>

      <div className="grid grid-col-1 place-items-center gap-5">
        <h1 className="font-bold text-center text-xl text-[#006d77]">
          {timerStarted
            ? `You have finished ${progress}% of your task`
            : "Ready to focus?"}
        </h1>

        <RadialTimer progress={progress} timeLeft={timeLeft} />

        {!timerStarted && (
          <SessionTimeSelector
            sessionMinutes={sessionMinutes}
            onIncrease={increaseSession}
            onDecrease={decreaseSession}
          />
        )}

        <TimerControl
          timerStarted={timerStarted}
          isRunning={isRunning}
          isInterrupted={isInterrupted}
          onToggleRun={toggleRun}
          onReset={onReset}
        />

        <InterruptControl
          isRunning={isRunning}
          isInterrupted={isInterrupted}
          onStartInterrupt={startInterrupt}
          onEndInterrupt={endInterrupt}
        />

        {showModal && (
          <CelebrationModal
            count={completedSessions}
            onClose={() => {
              setShowModal(false);
              onReset();
            }}
          />
        )}
      </div>
    </>
  );
}

function TaskItem({ task, onDelete }: TaskItemProps) {
  const sortable = useSortable({ id: task.id });

  return (
    <div
      ref={sortable.setNodeRef}
      style={{ touchAction: "none" }}
      className="w-full grid grid-cols-[90%_10%] items-center bg-white px-4 py-2 rounded-xl shadow-md border border-gray-300 hover:shadow-lg transition"
    >
      {/* Description (Draggable) */}
      <div
        {...sortable.listeners}
        {...sortable.attributes}
        className="cursor-grab"
      >
        <p className="w-full text-sm tracking-wide whitespace-normal break-words pr-4">
          {task.text}
        </p>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="
        inline-flex items-center justify-center
        w-10 h-10                /* square hit-area */
        bg-transparent rounded-full
        focus:outline-none focus:bg-red-300
        transition-colors duration-200
      "
        aria-label="Delete task"
      >
        🗑️
      </button>
    </div>
  );
}

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const handleAdd = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: uuid(), text: newTask.trim() }]);
    setNewTask("");
  };

  const handleDelete = (id: string) =>
    setTasks(tasks.filter((t) => t.id !== id));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over?.id);
      setTasks(arrayMove(tasks, oldIndex, newIndex));
    }
  };

  return (
    <div className="grid grid-cols-1 place-items-center w-full gap-5 px-4 mt-4">
      <h1 className="text-2xl font-bold text-[#D87C5A] tracking-tight">
        Prioritized tasks today
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
        className="w-full grid grid-cols-[1fr_auto] items-center gap-3"
      >
        <label htmlFor="new-task" className="sr-only">
          New task description
        </label>
        <input
          id="new-task"
          type="text"
          aria-label="New task description"
          placeholder="Add new task…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="w-full min-w-0 border border-gray-300
                   px-4 py-3 rounded-lg shadow-sm
                   text-gray-800 placeholder-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-300
                   transition focus:bg-white"
        />
        <button
          type="submit"
          className="h-full px-5 font-bold text-white tracking-wide
                 bg-gradient-to-r from-[#00444A] to-[#579A97]
                 rounded-lg shadow-md hover:brightness-110
                 active:scale-95 transition duration-200"
        >
          Add
        </button>
      </form>
      <div className="grid grid-cols-1 place-items-center w-full gap-2">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onDelete={handleDelete} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function accumulateHourlyInterruptions(
  interruptions: InterruptEntry[]
): HourlyInterrupts {
  const hourly: HourlyInterrupts = {};

  for (const { start, end } of interruptions) {
    if (!end) continue;

    let current = new Date(start);
    const final = new Date(end);

    while (current < final) {
      const hour = current.getHours();
      const nextHour = new Date(current);
      nextHour.setHours(hour + 1, 0, 0, 0);

      const periodEnd = nextHour < final ? nextHour : final;
      const duration = periodEnd.getTime() - current.getTime();

      hourly[hour] = (hourly[hour] || 0) + duration;
      current = nextHour;
    }
  }

  return hourly;
}

function ShowChart({ interruptions }: ShowChartProps) {
  const [chartData, setChartData] = useState<ChartDatum[]>([]);

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#d0ed57",
    "#a4de6c",
    "#8dd1e1",
    "#d88884",
    "#a284d8",
  ];

  useEffect(() => {
    const hourlyData = accumulateHourlyInterruptions(interruptions);

    const data = Array.from({ length: 24 }, (_, hour) => {
      const totalMs = hourlyData[hour] || 0;
      const minutes = parseFloat((totalMs / 60000).toFixed(1));
      const seconds = parseFloat(((totalMs % 60000) / 1000).toFixed(1));
      return {
        hourLabel: `${hour}`,
        interruptedTime: `${minutes}m ${seconds}s`,
        minutesDecimal: totalMs / 60000,
      };
    });
    setChartData(data);
  }, [interruptions]);
  return (
    <div className="w-full overflow-x-auto h-[50vh]">
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hourLabel" interval={3} />
          <YAxis
            label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(value, name, props) => {
              const { payload } = props;
              return payload?.interruptedTime
                ? [`${payload.interruptedTime} interrupted`, ""]
                : [value, name];
            }}
          />
          <Bar dataKey="minutesDecimal">
            {chartData.map((entry, idx) => (
              <Cell key={entry.hourLabel} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  const [interruptions, setInterruptions] = useState<InterruptEntry[]>([]);
  const [chartVisible, setChartVisible] = useState(false);
  function useSwipeReveal(threshold = 30) {
    const startY = useRef(0);
    const atBottomOnStart = useRef(false);

    // helper to know if we're truly at the bottom
    const isAtBottom = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll =
        (document.documentElement.scrollHeight || 0) - window.innerHeight;
      return scrollTop >= maxScroll - 1;
    };

    useEffect(() => {
      const onTouchStart = (e: TouchEvent) => {
        startY.current = e.touches[0].clientY;
        atBottomOnStart.current = isAtBottom();
      };

      const onTouchMove = (e: TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const delta = startY.current - currentY;

        if (!chartVisible && atBottomOnStart.current && delta > threshold) {
          setChartVisible(true);
        } else if (chartVisible && delta < -threshold) {
          setChartVisible(false);
        }
      };

      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });

      return () => {
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
      };
    }, [chartVisible, threshold]);

    return chartVisible;
  }

  const showChart = useSwipeReveal(30);

  return (
    <div className="bg-[#edf6f9] text-gray-900 font-[Poppins] grid grid-cols-1 gap-5 relative min-h-screen">
      <RadialTracker setInterruptions={setInterruptions} />
      <TaskList />
      {showChart && <ShowChart interruptions={interruptions} />}
      <div className="grid grid-cols-1 text-gray-500 place-items-center bounce-2.5s infinite">
        <svg
          className="w-5 h-5 mb-1 animate-bounce"
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span className="text-sm">Swipe down to view chart</span>
      </div>
    </div>
  );
}

export default App;
