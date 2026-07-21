const Trail = require('../models/Trail');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const Mastery = require('../models/Mastery');
const { generateModuleContent } = require('../services/ai.service');

// @desc    Create (or fetch existing) trail for a topic — no AI call, no modules yet
// @route   POST /trails
// @access  Private
exports.createTrail = async (req, res) => {
  try {
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ message: 'topicId is required' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (!topic.concepts || topic.concepts.length === 0) {
      return res.status(400).json({ message: 'This topic has no concepts defined yet' });
    }

    // ── Return existing trail if user already started one for this topic ──
    const existing = await Trail.findOne({
      user: req.user._id,
      topic: topic._id,
      status: { $in: ['active', 'generating'] },
    });

    if (existing) {
      const modules = await Module.find({ trail: existing._id }).sort({ order: 1 });
      return res.status(200).json({ trail: existing, modules });
    }

    const trail = await Trail.create({
      user: req.user._id,
      topic: topic._id,
      title: topic.title,
      status: 'generating',
    });

    try {
      const firstConcept = [...topic.concepts].sort((a, b) => a.order - b.order)[0];

      const ai = await generateModuleContent(topic.title, firstConcept.name, 'beginner');

      const module = await Module.create({
        trail: trail._id,
        concept: ai.concept,
        title: ai.title,
        content: ai.content,
        objective: ai.objective,
        keyPoints: ai.keyPoints,
        summary: ai.summary,
        sections: ai.sections,
        duration: ai.duration,
        difficulty: ai.difficulty,
        order: 0,
      });

      await Progress.create({
        user: req.user._id,
        trail: trail._id,
        module: module._id,
        completionStatus: 'in_progress',
      });

      await Mastery.findOneAndUpdate(
        { user: req.user._id, topic: topic._id, concept: firstConcept.name },
        { $setOnInsert: { beginner: 0.5, intermediate: 0.5, advanced: 0.5, currentDifficulty: 'beginner' } },
        { upsert: true, returnDocument: 'after' }
      );

      return res.status(201).json({ trail, modules: [module], module });
    } catch (aiErr) {
      console.error('[trail.controller] createTrail error:', aiErr);
      return res.status(502).json({ message: 'Module generation failed. Please try again.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all trails for the logged-in user
// @route   GET /trails
// @access  Private
exports.getMyTrails = async (req, res) => {
  try {
    const trails = await Trail.find({ user: req.user._id })
      .populate('topic', 'title icon level')
      .sort({ createdAt: -1 });

    const progressCounts = await Progress.aggregate([
      { $match: { user: req.user._id, trail: { $in: trails.map((t) => t._id) } } },
      {
        $group: {
          _id: '$trail',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$completionStatus', 'completed'] }, 1, 0] } },
        },
      },
    ]);

    const countsMap = new Map(progressCounts.map((p) => [p._id.toString(), p]));

    const trailsWithProgress = trails.map((trail) => {
      const counts = countsMap.get(trail._id.toString()) || { total: 0, completed: 0 };
      const progressPercent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

      return {
        _id: trail._id,
        title: trail.title,
        status: trail.status,
        topic: trail.topic,
        progressPercent,
        modulesCompleted: counts.completed,
        modulesTotal: counts.total,
        updatedAt: trail.updatedAt,
      };
    });

    res.status(200).json(trailsWithProgress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get trail details
// @route   GET /trails/:id
// @access  Private
exports.getTrailById = async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id).populate('topic');
    if (!trail) return res.status(404).json({ message: 'Trail not found' });

    if (trail.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const modules = await Module.find({ trail: trail._id }).sort({ order: 1 });

    res.status(200).json({
      trail,
      modules,
      concepts: trail.topic.concepts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Check if a trail exists for a given topic (for the logged-in user)
// @route   GET /trails/topic/:topicId
// @access  Private
exports.getTrailByTopic = async (req, res) => {
  try {
    const trail = await Trail.findOne({ user: req.user._id, topic: req.params.topicId });
    if (!trail) return res.status(404).json({ message: 'No trail started for this topic yet' });
    res.status(200).json(trail);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};