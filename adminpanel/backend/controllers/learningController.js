import mongoose from 'mongoose';
import axios from 'axios';
import { LearningCourse, UserProgress } from '../models/learningModel.js';
import User from '../models/userModel.js';

// ── SOCKET EMITTER ────────────────────────────────────────────────────────────
const emitToUser = async (userId, event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, { event, data: { userId, ...data } });
    } catch (_) {}
};

// ── SCOPE HELPERS ─────────────────────────────────────────────────────────────
const getSectorUserIds = async (admin) => {
    if (admin.role === 'team-lead') {
        if (!admin.managedSector) return null;
        const users = await User.find({ unitSector: admin.managedSector }).select('_id');
        return users.map(u => u._id);
    }
    const users = await User.find({ isActive: true }).select('_id');
    return users.map(u => u._id);
};

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE MANAGEMENT (super-admin only)
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET ALL COURSES ───────────────────────────────────────────────────────────
export const getAllCourses = async (req, res) => {
    try {
        const { level, assetco, search, required } = req.query;
        const query = {};

        if (level) {
            const levels = level.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
            if (levels.length) query.level = { $in: levels };
        }
        if (assetco) query.assetco = assetco;
        if (required !== undefined) query.required = required === 'true';
        if (search) {
            query.$or = [
                { title:       { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags:        { $regex: search, $options: 'i' } },
            ];
        }

        const courses = await LearningCourse.find(query)
            .sort({ required: -1, level: 1, title: 1 })
            .lean();

        // Attach enrollment count to each course
        const enrollmentCounts = await UserProgress.aggregate([
            { $group: { _id: '$courseId', count: { $sum: 1 }, certified: { $sum: { $cond: ['$certificationEarned', 1, 0] } } } },
        ]);
        const enrollMap = {};
        enrollmentCounts.forEach(e => { enrollMap[e._id.toString()] = { enrolled: e.count, certified: e.certified }; });

        const coursesWithStats = courses.map(c => ({
            ...c,
            moduleCount: c.modules?.length || 0,
            examCount:   c.exam?.length || 0,
            enrolled:    enrollMap[c._id.toString()]?.enrolled  || 0,
            certified:   enrollMap[c._id.toString()]?.certified || 0,
        }));

        res.json({ success: true, courses: coursesWithStats, total: coursesWithStats.length });
    } catch (err) {
        console.error('Get all courses error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET SINGLE COURSE ─────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
    try {
        const course = await LearningCourse.findById(req.params.id).lean();
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.json({ success: true, course });
    } catch (err) {
        console.error('Get course by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── CREATE COURSE (super-admin only) ──────────────────────────────────────────
export const createCourse = async (req, res) => {
    try {
        const { title, description, level, assetco, modules, exam, required, tags, passingScore } = req.body;

        if (!title || !level || !assetco) {
            return res.status(400).json({ success: false, message: 'Title, level and assetco are required' });
        }

        const course = await LearningCourse.create({
            title,
            description:  description || '',
            level,
            assetco,
            modules:      modules || [],
            exam:         exam || [],
            required:     required || false,
            tags:         tags || [],
            passingScore: passingScore || 70,
        });

        res.status(201).json({ success: true, course });
    } catch (err) {
        console.error('Create course error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── UPDATE COURSE (super-admin only) ──────────────────────────────────────────
export const updateCourse = async (req, res) => {
    try {
        const course = await LearningCourse.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.json({ success: true, course });
    } catch (err) {
        console.error('Update course error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE COURSE (super-admin only) ──────────────────────────────────────────
export const deleteCourse = async (req, res) => {
    try {
        const course = await LearningCourse.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        // Remove all associated progress records
        await UserProgress.deleteMany({ courseId: req.params.id });

        res.json({ success: true, message: 'Course and all associated progress deleted' });
    } catch (err) {
        console.error('Delete course error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── ADD / UPDATE MODULE (super-admin only) ────────────────────────────────────
export const upsertModule = async (req, res) => {
    try {
        const course = await LearningCourse.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const { moduleId, title, content, videoUrl, terms, quiz, objectives, order, estimatedMinutes } = req.body;

        if (moduleId) {
            // Update existing module
            const mod = course.modules.id(moduleId);
            if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
            if (title)             mod.title            = title;
            if (content)           mod.content          = content;
            if (videoUrl !== undefined) mod.videoUrl    = videoUrl;
            if (terms)             mod.terms            = terms;
            if (quiz)              mod.quiz             = quiz;
            if (objectives)        mod.objectives       = objectives;
            if (order !== undefined)   mod.order        = order;
            if (estimatedMinutes)  mod.estimatedMinutes = estimatedMinutes;
        } else {
            // Add new module
            if (!title || !content || order === undefined) {
                return res.status(400).json({ success: false, message: 'title, content and order are required for new modules' });
            }
            course.modules.push({ title, content, videoUrl: videoUrl || '', terms: terms || [], quiz: quiz || [], objectives: objectives || [], order, estimatedMinutes: estimatedMinutes || 15 });
        }

        course.updatedAt = new Date();
        await course.save();

        res.json({ success: true, course });
    } catch (err) {
        console.error('Upsert module error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE MODULE (super-admin only) ─────────────────────────────────────────
export const deleteModule = async (req, res) => {
    try {
        const course = await LearningCourse.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const mod = course.modules.id(req.params.moduleId);
        if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });

        mod.deleteOne();
        course.updatedAt = new Date();
        await course.save();

        res.json({ success: true, message: 'Module deleted', course });
    } catch (err) {
        console.error('Delete module error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING ASSIGNMENT (team-lead and above)
// ═══════════════════════════════════════════════════════════════════════════════

// ── ASSIGN COURSE TO USER(S) ──────────────────────────────────────────────────
// Team-lead: can assign to their sector's users
// Executive/Super-admin: can assign to anyone
export const assignCourse = async (req, res) => {
    try {
        const { courseId, userIds, deadline } = req.body;

        if (!courseId || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'courseId and userIds are required' });
        }

        const course = await LearningCourse.findById(courseId).select('title');
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const results = { assigned: [], skipped: [], errors: [] };

        for (const userId of userIds) {
            try {
                if (!mongoose.isValidObjectId(userId)) { results.errors.push(userId); continue; }

                const user = await User.findById(userId).select('unitSector firstName lastName');
                if (!user) { results.errors.push(userId); continue; }

                if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
                    results.skipped.push(userId);
                    continue;
                }

                // Upsert enrollment with admin assignment tracking
                const existing = await UserProgress.findOne({ userId, courseId });
                if (existing) {
                    // Already enrolled — update deadline if provided
                    if (deadline) {
                        existing.deadline    = new Date(deadline);
                        existing.assignedBy  = req.admin._id;
                        existing.assignedAt  = new Date();
                        await existing.save();
                    }
                    results.skipped.push(userId);
                    continue;
                }

                await UserProgress.create({
                    userId,
                    courseId,
                    assignedBy: req.admin._id,
                    assignedAt: new Date(),
                    deadline:   deadline ? new Date(deadline) : null,
                    enrolledAt: new Date(),
                });

                // Notify user
                await emitToUser(userId, 'courseAssigned', {
                    courseId,
                    courseTitle: course.title,
                    assignedBy:  `${req.admin.firstName} ${req.admin.lastName}`,
                    deadline:    deadline || null,
                });

                results.assigned.push(userId);
            } catch (e) {
                results.errors.push(userId);
            }
        }

        res.status(201).json({
            success: true,
            message: `${results.assigned.length} user(s) enrolled, ${results.skipped.length} already enrolled, ${results.errors.length} error(s)`,
            results,
        });
    } catch (err) {
        console.error('Assign course error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS & ANALYTICS (team-lead and above)
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET ALL USER PROGRESS ─────────────────────────────────────────────────────
export const getAllProgress = async (req, res) => {
    try {
        const { courseId, userId, certified, unitSector, page = 1, limit = 50 } = req.query;

        const userIds = await getSectorUserIds(req.admin);
        if (!userIds) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        // Refine by unitSector (exec/super-admin only)
        let filteredIds = userIds;
        if (unitSector && req.admin.role !== 'team-lead') {
            const sectorUsers = await User.find({ unitSector, _id: { $in: userIds } }).select('_id');
            filteredIds = sectorUsers.map(u => u._id);
        }

        const query = { userId: { $in: filteredIds } };
        if (courseId) query.courseId = courseId;
        if (userId)   query.userId   = userId;
        if (certified !== undefined) query.certificationEarned = certified === 'true';

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await UserProgress.countDocuments(query);

        const progress = await UserProgress.find(query)
            .populate('userId',   'firstName lastName email unitSector position')
            .populate('courseId', 'title level assetco passingScore required')
            .sort({ lastAccessed: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            progress,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all progress error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── TRAINING COMPLETION STATS ─────────────────────────────────────────────────
export const getTrainingStats = async (req, res) => {
    try {
        const userIds = await getSectorUserIds(req.admin);
        if (!userIds) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const allProgress = await UserProgress.find({ userId: { $in: userIds } })
            .populate('courseId', 'title level required')
            .populate('userId',   'firstName lastName email unitSector')
            .lean();

        const totalEnrollments   = allProgress.length;
        const completedCourses   = allProgress.filter(p => p.progress === 100).length;
        const certifications     = allProgress.filter(p => p.certificationEarned).length;
        const avgProgress        = totalEnrollments
            ? Math.round(allProgress.reduce((s, p) => s + (p.progress || 0), 0) / totalEnrollments)
            : 0;

        // Per-course breakdown
        const courseMap = {};
        allProgress.forEach(p => {
            const cid = p.courseId?._id?.toString();
            if (!cid) return;
            if (!courseMap[cid]) {
                courseMap[cid] = {
                    courseId:    cid,
                    title:       p.courseId?.title,
                    level:       p.courseId?.level,
                    required:    p.courseId?.required,
                    enrolled:    0,
                    completed:   0,
                    certified:   0,
                    avgProgress: 0,
                    totalProgress: 0,
                };
            }
            courseMap[cid].enrolled++;
            if (p.progress === 100) courseMap[cid].completed++;
            if (p.certificationEarned) courseMap[cid].certified++;
            courseMap[cid].totalProgress += p.progress || 0;
        });

        const byCourse = Object.values(courseMap).map(c => ({
            ...c,
            avgProgress:     c.enrolled ? Math.round(c.totalProgress / c.enrolled) : 0,
            completionRate:  c.enrolled ? Math.round((c.completed / c.enrolled) * 100) : 0,
            certificationRate: c.enrolled ? Math.round((c.certified / c.enrolled) * 100) : 0,
        }));

        res.json({
            success: true,
            stats: {
                totalEnrollments,
                completedCourses,
                certifications,
                avgProgress,
                byCourse,
            },
        });
    } catch (err) {
        console.error('Training stats error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET PROGRESS FOR A SPECIFIC USER ──────────────────────────────────────────
export const getUserTrainingProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId).select('unitSector firstName lastName email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
        }

        const progress = await UserProgress.find({ userId })
            .populate('courseId', 'title level assetco passingScore required')
            .sort({ lastAccessed: -1 });

        res.json({
            success: true,
            user: { firstName: user.firstName, lastName: user.lastName, email: user.email },
            progress,
            total: progress.length,
        });
    } catch (err) {
        console.error('Get user training progress error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};