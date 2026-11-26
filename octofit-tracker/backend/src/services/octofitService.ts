import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function validationError(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw validationError('Valid userId and teamId are required');
  }

  const input = _input as { userId?: unknown; teamId?: unknown; type?: unknown; minutes?: unknown };
  if (
    typeof input.userId !== 'string'
    || typeof input.teamId !== 'string'
    || !mongoose.isValidObjectId(input.userId)
    || !mongoose.isValidObjectId(input.teamId)
  ) {
    throw validationError('Valid userId and teamId are required');
  }
  if (typeof input.type !== 'string' || input.type.trim().length === 0) {
    throw validationError('Activity type is required');
  }
  if (typeof input.minutes !== 'number' || !Number.isFinite(input.minutes) || input.minutes <= 0) {
    throw validationError('Activity minutes must be a positive number');
  }

  const userId = new mongoose.Types.ObjectId(input.userId);
  const teamId = new mongoose.Types.ObjectId(input.teamId);
  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user) {
    throw validationError('User does not exist');
  }
  if (!team) {
    throw validationError('Team does not exist');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: input.type.trim(),
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw validationError('Team name is required');
  }

  const input = _input as { name?: unknown; mascot?: unknown; members?: unknown };
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    throw validationError('Team name is required');
  }
  if (typeof input.mascot !== 'string' || input.mascot.trim().length === 0) {
    throw validationError('Team mascot is required');
  }

  let memberIds: mongoose.Types.ObjectId[] = [];
  if (input.members !== undefined) {
    if (!Array.isArray(input.members)) {
      throw validationError('Team members must be an array');
    }

    memberIds = input.members.map((memberId) => {
      if (typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId)) {
        throw validationError('Team member IDs must be valid ObjectIds');
      }
      return new mongoose.Types.ObjectId(memberId);
    });

    const existingCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingCount !== memberIds.length) {
      throw validationError('One or more team members do not exist');
    }
  }

  const team = await Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members: memberIds,
  });

  if (memberIds.length > 0) {
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $set: { team: team._id } },
    );
  }

  return team.toObject();
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    { $sort: { totalPoints: -1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
  ]);

  return entries.map((entry, index) => ({
    teamName: entry.team.name,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(_userEmail: string) {
  if (typeof _userEmail !== 'string' || _userEmail.trim().length === 0) {
    throw validationError('A valid user email is required');
  }

  const escapedEmail = _userEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const user = await User.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();

  const activityFocus: Record<string, string> = {
    run: 'endurance',
    walk: 'endurance',
    cycle: 'endurance',
    swim: 'endurance',
    strength: 'strength',
    yoga: 'mobility',
  };

  const candidates: string[] = [];
  if (user.fitnessGoal) {
    candidates.push(user.fitnessGoal.toLowerCase());
  }
  if (recentActivity?.type) {
    const mappedFocus = activityFocus[recentActivity.type.toLowerCase()];
    if (mappedFocus) {
      candidates.push(mappedFocus);
    }
  }

  const uniqueCandidates = [...new Set(candidates)];
  const workouts = await Workout.find().lean();
  const matching = workouts
    .filter((workout) => uniqueCandidates.includes(workout.focus.toLowerCase()))
    .sort((first, second) =>
      uniqueCandidates.indexOf(first.focus.toLowerCase()) - uniqueCandidates.indexOf(second.focus.toLowerCase()),
    );
  const suggestions = matching.length > 0 ? matching : workouts;

  const reasonParts = [];
  if (user.fitnessGoal) {
    reasonParts.push(`your ${user.fitnessGoal} goal`);
  }
  if (recentActivity?.type) {
    reasonParts.push(`recent ${recentActivity.type} activity`);
  }
  const reason = reasonParts.length > 0
    ? `Recommended for ${reasonParts.join(' and ')}.`
    : 'Recommended as a general fitness workout.';

  return suggestions.map((workout) => ({ ...workout, reason }));
}

export { User };
