import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function toObjectId(value: unknown, label: string) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw badRequest(`${label} is invalid`);
  }
  return new mongoose.Types.ObjectId(value);
}

function normalizeMembers(input: unknown) {
  if (input === undefined) return [];
  if (!Array.isArray(input)) {
    throw badRequest('Team members must be an array');
  }
  return input.map((memberId, index) => {
    if (typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId)) {
      throw badRequest(`Team member at index ${index} is invalid`);
    }
    return new mongoose.Types.ObjectId(memberId);
  });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const userId = toObjectId(payload.userId, 'userId');
  const teamId = toObjectId(payload.teamId, 'teamId');
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutesValue = Number(payload.minutes);

  if (!type) {
    throw badRequest('Activity type is required');
  }
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw notFound('Team not found');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';

  if (!name) {
    throw badRequest('Team name is required');
  }
  if (!mascot) {
    throw badRequest('Team mascot is required');
  }

  const team = await Team.create({
    name,
    mascot,
    members: normalizeMembers(payload.members),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw notFound('User not found');
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const goalMatch = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : '';
  const recentFocus = recentActivity?.type ? String(recentActivity.type).toLowerCase() : '';

  const matches = await Workout.find({
    $or: [
      { focus: { $regex: new RegExp(goalMatch || recentFocus || '.*', 'i') } },
      { focus: { $regex: new RegExp(recentFocus || goalMatch || '.*', 'i') } },
    ],
  }).sort({ focus: 1, title: 1 }).lean();

  if (matches.length === 0) {
    return [];
  }

  return matches.map((workout) => ({
    ...workout,
    reason: recentActivity
      ? `Recent ${recentActivity.type} activity suggests ${workout.focus.toLowerCase()} work.`
      : `${user.name} is focused on ${user.fitnessGoal}, so ${workout.focus.toLowerCase()} training fits best.`,
  }));
}

export { User };
