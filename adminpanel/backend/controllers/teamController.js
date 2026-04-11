import AdminTeam from '../models/adminTeamModel.js';
import User from '../models/userModel.js';

// ── Get my team ───────────────────────────────────────────────────────────────
export const getMyTeam = async (req, res) => {
  try {
    let team = await AdminTeam.findOne({ admin: req.user._id })
      .populate('members', 'firstName lastName otherName email role position unitSector isActive avatar lastActive points level')
      .lean();

    if (!team) {
      team = { admin: req.user._id, members: [], name: 'My Team' };
    }

    res.json({ success: true, team });
  } catch (err) {
    console.error('getMyTeam error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch team' });
  }
};

// ── Update my team members ────────────────────────────────────────────────────
export const updateMyTeam = async (req, res) => {
  const { members, name } = req.body;

  if (!Array.isArray(members)) {
    return res.status(400).json({ success: false, message: 'Members must be an array of user IDs' });
  }

  try {
    let team = await AdminTeam.findOne({ admin: req.user._id });
    if (!team) {
      team = new AdminTeam({ admin: req.user._id, members: [], name: name || 'My Team' });
    }

    team.members = members;
    if (name) team.name = name;
    await team.save();

    const populated = await AdminTeam.findById(team._id)
      .populate('members', 'firstName lastName otherName email role position unitSector isActive avatar lastActive points level')
      .lean();

    res.json({ success: true, team: populated });
  } catch (err) {
    console.error('updateMyTeam error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update team' });
  }
};

// ── Add member to team ────────────────────────────────────────────────────────
export const addTeamMember = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

  try {
    let team = await AdminTeam.findOne({ admin: req.user._id });
    if (!team) team = new AdminTeam({ admin: req.user._id, members: [] });

    if (!team.members.map(m => m.toString()).includes(userId)) {
      team.members.push(userId);
      await team.save();
    }

    const populated = await AdminTeam.findById(team._id)
      .populate('members', 'firstName lastName otherName email role position unitSector isActive avatar lastActive')
      .lean();

    res.json({ success: true, team: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

// ── Remove member from team ───────────────────────────────────────────────────
export const removeTeamMember = async (req, res) => {
  const { userId } = req.params;
  try {
    const team = await AdminTeam.findOne({ admin: req.user._id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    team.members = team.members.filter(m => m.toString() !== userId);
    await team.save();

    const populated = await AdminTeam.findById(team._id)
      .populate('members', 'firstName lastName otherName email role position unitSector isActive avatar lastActive')
      .lean();

    res.json({ success: true, team: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

// ── Get all available users to add to team ────────────────────────────────────
export const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('firstName lastName otherName email role position unitSector avatar')
      .sort({ firstName: 1 })
      .lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};
