import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

import {
  todayKey,
  last90Days,
  lastNDays,
  calcStreak,
} from "../utils/dateHelpers.js";

export const markComplete = async (req, res) => {
  try {
    const { habitId } = req.params;

    const { date } = req.body;

    const completedDate = date || todayKey();

    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    const log = await HabitLog.findOneAndUpdate(
      {
        userId: req.user._id,
        habitId,
        completedDate,
      },
      {
        $setOnInsert: {
          userId: req.user._id,
          habitId,
          completedDate,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    res.status(201).json(log);
  } catch (error) {
    console.error("Mark complete error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const unmarkComplete = async (req, res) => {
  try {
    const { habitId, date } = req.params;

    const completedDate = date || todayKey();

    await HabitLog.findOneAndDelete({
      userId: req.user._id,
      habitId,
      completedDate,
    });

    res.json({
      message: "Marked incomplete",
    });
  } catch (error) {
    console.error("Unmark complete error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getToday = async (req, res) => {
  try {
    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: todayKey(),
    });

    res.json(logs);
  } catch (error) {
    console.error("Get today logs error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end dates are required",
      });
    }

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: start,
        $lte: end,
      },
    });

    res.json(logs);
  } catch (error) {
    console.error("Get range error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getHeatmap = async (req, res) => {
  try {
    const days = last90Days();

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    const counts = {};

    for (const day of days) {
      counts[day] = 0;
    }

    for (const log of logs) {
      counts[log.completedDate] = (counts[log.completedDate] || 0) + 1;
    }

    const data = days.map((day) => ({
      date: day,
      count: counts[day] || 0,
    }));

    res.json(data);
  } catch (error) {
    console.error("Heatmap error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getHabitStats = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    const logs = await HabitLog.find({
      userId: req.user._id,
      habitId: habit._id,
    }).sort({
      completedDate: -1,
    });

    const dateKeys = logs.map((log) => log.completedDate);

    const { current, longest } = calcStreak(dateKeys);

    const createdKey = habit.createdAt.toISOString().slice(0, 10);

    const today = todayKey();

    const start = new Date(createdKey);

    const end = new Date(today);

    const totalDays =
      Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24))) + 1;

    const completionRate = Math.round((logs.length / totalDays) * 100);

    const monthly = {};

    for (const log of logs) {
      const month = log.completedDate.slice(0, 7);

      monthly[month] = (monthly[month] || 0) + 1;
    }

    res.json({
      habit,
      totalCompletions: logs.length,
      currentStreak: current,
      longestStreak: longest,
      completionRate,
      monthly,
    });
  } catch (error) {
    console.error("Habit stats error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllStats = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
      isArchived: false,
    });

    const days = lastNDays(30);

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    const perHabit = habits.map((habit) => {
      const hLogs = logs.filter(
        (log) => log.habitId.toString() === habit._id.toString(),
      );

      const keys = hLogs
        .map((log) => log.completedDate)
        .sort()
        .reverse();

      const { current, longest } = calcStreak(keys);

      return {
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        category: habit.category,
        completions30d: hLogs.length,
        currentStreak: current,
        longestStreak: longest,
      };
    });

    res.json({
      perHabit,
      days,
    });
  } catch (error) {
    console.error("All stats error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
