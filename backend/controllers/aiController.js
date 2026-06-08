import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";

import { chatCompletion, SYSTEM_PROMPTS } from "../utils/aiService.js";
import { lastNDays, calcStreak, todayKey } from "../utils/dateHelpers.js";

const buildWeeklyContext = async (userId) => {
  const habits = await Habit.find({ userId, isArchived: false });

  const days = lastNDays(7);

  const logs = await HabitLog.find({
    userId,
    completedDate: {
      $gte: days[0],
      $lte: days[days.length - 1],
    },
  });

  const perHabit = habits.map((habit) => {
    const completedCount = logs.filter(
      (log) => String(log.habitId) === String(habit._id)
    ).length;

    return {
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      completedCount,
      targetDays: habit.targetDays,
    };
  });

  return { days, perHabit };
};

export const weeklyReport = async (req, res) => {
  try {
    const ctx = await buildWeeklyContext(req.user._id);

    if (!ctx.perHabit.length) {
      return res.json({
        content:
          "You don't have any active habits yet. Create your first habit to start tracking. I will generate a weekly report once you have some data.",
      });
    }

    const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}):\n\n${ctx.perHabit
      .map(
        (habit) =>
          `- ${habit.name} (${habit.category}, ${habit.frequency}): completed ${habit.completedCount} of the past 7 days, target ${habit.targetDays}/week`
      )
      .join("\n")}\n\nPlease write the personalised weekly report now.`;

    const { content } = await chatCompletion({
      system: SYSTEM_PROMPTS.weekly,
      user: userMsg,
    });

    await AIInsight.create({
      userId: req.user._id,
      type: "weekly",
      content,
    });

    res.json({ content });
  } catch (err) {
    console.error("Weekly report error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const suggestHabits = async (req, res) => {
  try {
    const { goals, productiveTime, struggles } = req.body;

    const userMsg = `User goals: ${goals || "not provided"}\nMost productive time: ${productiveTime || "not provided"}\nPast struggles: ${struggles || "not provided"}\n\nSuggest 3 personalised habits now. Return JSON only in this format: {"suggestions":[{"name":"","description":"","frequency":"Daily","category":"Fitness","icon":"","reason":""}]}`;

    const { content } = await chatCompletion({
      system: SYSTEM_PROMPTS.suggestion,
      user: userMsg,
    });

    let suggestions = [];

    try {
      const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
      suggestions = parsed.suggestions || [];
    } catch {
      suggestions = [];
    }

    if (!suggestions.length) {
      suggestions = [
        {
          name: "10-minute morning walk",
          description: "Start the day with light movement and fresh air.",
          frequency: "Daily",
          category: "Fitness",
          icon: "🚶",
          reason: "Low-friction way to build consistency early in the day.",
        },
        {
          name: "Read 5 pages",
          description: "Short daily reading to build a learning routine.",
          frequency: "Daily",
          category: "Learning",
          icon: "📚",
          reason: "Compounds into significant knowledge over weeks.",
        },
        {
          name: "2 minutes of mindful breathing",
          description: "Pause and breathe to reset focus and reduce stress.",
          frequency: "Daily",
          category: "Mindfulness",
          icon: "🧘",
          reason: "Tiny anchor habit that fits any schedule.",
        },
      ];
    }

    await AIInsight.create({
      userId: req.user._id,
      type: "suggestion",
      content: JSON.stringify(suggestions),
      meta: { goals, productiveTime, struggles },
    });

    res.json({ suggestions });
  } catch (err) {
    console.error("Suggest habits error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const recoveryPlan = async (req, res) => {
  try {
    const { habitId } = req.body;

    if (!habitId) {
      return res.status(400).json({
        message: "habitId is required",
      });
    }

    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    const logs = await HabitLog.find({
      userId: req.user._id,
      habitId,
    }).sort({ completedDate: -1 });

    const keys = logs.map((log) => log.completedDate);

    const { current, longest } = calcStreak(keys);

    const userMsg = `Habit: ${habit.name} (${habit.category}).\nDescription: ${habit.description || "none"}.\nCurrent streak: ${current} days. Longest ever: ${longest} days. The user just broke a streak. Write a warm, actionable 3-day recovery plan.`;

    const { content } = await chatCompletion({
      system: SYSTEM_PROMPTS.recovery,
      user: userMsg,
    });

    await AIInsight.create({
      userId: req.user._id,
      type: "recovery",
      content,
      meta: { habitId },
    });

    res.json({ content });
  } catch (err) {
    console.error("Recovery plan error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const chatAnalysis = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

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

    const context = habits
      .map((habit) => {
        const hLogs = logs.filter(
          (log) => String(log.habitId) === String(habit._id)
        );

        const byDow = [0, 0, 0, 0, 0, 0, 0];

        for (const log of hLogs) {
          const dow = new Date(log.completedDate).getDay();
          byDow[dow] += 1;
        }

        return `${habit.name} (${habit.category}): ${hLogs.length}/30 in last 30 days, by weekday [Sun:${byDow[0]}, Mon:${byDow[1]}, Tue:${byDow[2]}, Wed:${byDow[3]}, Thu:${byDow[4]}, Fri:${byDow[5]}, Sat:${byDow[6]}]`;
      })
      .join("\n");

    const userMsg = `User question: "${question}"\n\nUser data from last 30 days:\n${context || "No active habit data yet."}\n\nAnswer now.`;

    const { content } = await chatCompletion({
      system: SYSTEM_PROMPTS.chat,
      user: userMsg,
    });

    await AIInsight.create({
      userId: req.user._id,
      type: "chat",
      content,
      meta: { question },
    });

    res.json({ content });
  } catch (err) {
    console.error("Chat analysis error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const morningMotivation = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
      isArchived: false,
    });

    if (!habits.length) {
      return res.json({
        content:
          "Good morning! Add your first habit today and let's get the momentum started.",
      });
    }

    const days = lastNDays(30);

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    const ctx = habits
      .map((habit) => {
        const hLogs = logs
          .filter((log) => String(log.habitId) === String(habit._id))
          .map((log) => log.completedDate)
          .sort()
          .reverse();

        const { current } = calcStreak(hLogs);

        return `${habit.name}: current streak ${current}`;
      })
      .join("\n");

    const today = todayKey();

    const todayLogs = logs.filter((log) => log.completedDate === today);

    const done = todayLogs.length;
    const total = habits.length;

    const userMsg = `Today's habits and streaks:\n${ctx}\n\nDone today: ${done}/${total}. Write the morning message now.`;

    const { content } = await chatCompletion({
      system: SYSTEM_PROMPTS.morning,
      user: userMsg,
      temperature: 0.8,
    });

    await AIInsight.create({
      userId: req.user._id,
      type: "morning",
      content,
    });

    res.json({ content });
  } catch (err) {
    console.error("Morning motivation error:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};


