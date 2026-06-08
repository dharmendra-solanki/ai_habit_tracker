import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

const normalizeFrequency = (frequency) => {
  if (!frequency) return undefined;

  const value = String(frequency).toLowerCase();

  if (value === "daily") return "Daily";
  if (value === "weekly") return "Weekly";
  if (value === "monthly") return "Monthly";

  return frequency;
};

export const getHabit = async (req, res) => {
  try {
    const { includeArchived } = req.query;

    const filter = {
      userId: req.user._id,
    };

    if (includeArchived !== "true") {
      filter.isArchived = false;
    }

    const habits = await Habit.find(filter).sort({
      order: 1,
      createdAt: 1,
    });

    res.json(habits);
  } catch (error) {
    console.error("Get habits error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const createHabit = async (req, res) => {
  try {
    const { name, description, category, frequency, targetDays, color, icon } =
      req.body;

    if (!name) {
      return res.status(400).json({
        message: "Habit name is required",
      });
    }

    const count = await Habit.countDocuments({
      userId: req.user._id,
    });

    const habit = await Habit.create({
      userId: req.user._id,
      name,
      description,
      category,
      frequency: normalizeFrequency(frequency),
      targetDays,
      color,
      icon,
      order: count,
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error("Create habit error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    const fields = [
      "name",
      "description",
      "category",
      "frequency",
      "targetDays",
      "color",
      "icon",
      "order",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === "frequency") {
          habit[field] = normalizeFrequency(req.body[field]);
        } else {
          habit[field] = req.body[field];
        }
      }
    }

    await habit.save();

    res.json(habit);
  } catch (error) {
    console.error("Update habit error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    await HabitLog.deleteMany({
      habitId: habit._id,
      userId: req.user._id,
    });

    res.json({
      message: "Habit deleted successfully",
    });
  } catch (error) {
    console.error("Delete habit error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const archiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    habit.isArchived = !habit.isArchived;

    await habit.save();

    res.json(habit);
  } catch (error) {
    console.error("Archive habit error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const reorderHabit = async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        message: "order must be an array",
      });
    }

    await Promise.all(
      order.map((id, index) =>
        Habit.updateOne(
          {
            _id: id,
            userId: req.user._id,
          },
          {
            $set: {
              order: index,
            },
          },
        ),
      ),
    );

    res.json({
      message: "Habits reordered successfully",
    });
  } catch (error) {
    console.error("Reorder habit error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
