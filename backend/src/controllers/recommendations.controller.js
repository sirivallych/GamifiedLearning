const Mastery  = require('../models/Mastery');
const Trail    = require('../models/Trail');
const Module   = require('../models/Module');
const Topic    = require('../models/Topic');
const Progress = require('../models/Progress');

const { buildPrompt }                 = require('../services/ai/promptBuilder');
const { generateResponse }            = require('../services/ai/llm.service');
const { parseJSONObject, ParseError } = require('../services/ai/responseParser');

const REVISE_THRESHOLD = 0.5; // below this mastery score → flagged for concept revision

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Build the "Concepts to Revise" list from mastery data.
 * Returns concepts where mastery at the current difficulty < threshold.
 */
const _getConceptsToRevise = async (userId) => {
  const masteryRecords = await Mastery.find({ user: userId }).populate(
    'topic',
    'title icon'
  );

  return masteryRecords
    .map((m) => {
      const currentScore = m[m.currentDifficulty];
      return {
        concept:        m.concept,
        topicId:        m.topic?._id,
        topicTitle:     m.topic?.title,
        topicIcon:      m.topic?.icon,
        masteryPercent: Math.round(currentScore * 100),
      };
    })
    .filter((c) => c.masteryPercent < REVISE_THRESHOLD * 100)
    .sort((a, b) => a.masteryPercent - b.masteryPercent); // weakest first
};

/**
 * Build the "Suggested Revision" list from progress data.
 * Returns modules that are completed but may benefit from revisiting
 * (proxy for low quiz scores until QuizAttempt model is built).
 */
const _getSuggestedRevision = async (userId) => {
  const progressRecords = await Progress.find({
    user: userId,
    completionStatus: 'completed',
  })
    .populate('module', 'title concept difficulty')
    .populate({
      path: 'trail',
      select: 'title topic',
      populate: { path: 'topic', select: 'title icon' },
    });

  // Cross-reference with mastery — only suggest modules whose concept
  // mastery is below 70% (they completed it but didn't master it)
  const masteryRecords = await Mastery.find({ user: userId });
  const masteryMap = {};
  masteryRecords.forEach((m) => {
    masteryMap[m.concept] = Math.round(m[m.currentDifficulty] * 100);
  });

  return progressRecords
    .filter((p) => {
      const concept = p.module?.concept;
      const score = masteryMap[concept];
      return score !== undefined && score < 70;
    })
    .map((p) => ({
      moduleId:   p.module._id,
      title:      p.module.title,
      concept:    p.module.concept,
      trail:      p.trail?.title,
      topicIcon:  p.trail?.topic?.icon || '📘',
      score:      masteryMap[p.module.concept],
    }))
    .sort((a, b) => a.score - b.score); // lowest score first
};

/**
 * Generate AI-powered next-topic recommendations.
 * Uses the recommendation prompt with the student's learning context.
 */
const _getAIRecommendations = async (userId) => {
  try {
    // Gather student context
    const masteryRecords = await Mastery.find({ user: userId }).populate(
      'topic',
      'title'
    );

    const trails = await Trail.find({ user: userId }).populate('topic', 'title icon level');

    // Build completed topics summary
    const completedTopics = trails
      .filter((t) => t.status === 'completed' || t.status === 'active')
      .map((t) => {
        const topicMastery = masteryRecords.filter(
          (m) => m.topic?._id?.toString() === t.topic?._id?.toString()
        );
        const avgMastery =
          topicMastery.length > 0
            ? Math.round(
                topicMastery.reduce((sum, m) => sum + m[m.currentDifficulty] * 100, 0) /
                  topicMastery.length
              )
            : 0;
        return `${t.topic?.title || t.title} (${avgMastery}% mastery, ${t.status})`;
      });

    // Get all available topics
    const allTopics = await Topic.find({}, 'title level icon description');
    const trailTopicIds = trails.map((t) => t.topic?._id?.toString()).filter(Boolean);

    const availableTopics = allTopics
      .filter((t) => !trailTopicIds.includes(t._id.toString()))
      .map((t) => `${t.title} (${t.level})${t.description ? ': ' + t.description : ''}`);

    // Skip if no available topics
    if (availableTopics.length === 0) {
      return [];
    }

    // Build overall mastery snapshot
    const snapshot = masteryRecords.map(
      (m) => `${m.concept}: ${Math.round(m[m.currentDifficulty] * 100)}%`
    );

    const prompt = buildPrompt('recommendation', {
      completedTopics:
        completedTopics.length > 0 ? completedTopics.join('; ') : 'none yet',
      masterySnapshot:
        snapshot.length > 0 ? snapshot.join('; ') : 'no mastery data available',
      availableTopics: availableTopics.join('; '),
    });

    const llmResult = await generateResponse(prompt);
    const parsed = parseJSONObject(llmResult.content);

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      return [];
    }

    // Enrich with icons from matching topics
    return parsed.recommendations.map((rec) => {
      const matchingTopic = allTopics.find(
        (t) => t.title.toLowerCase() === rec.title.toLowerCase()
      );
      return {
        title:          rec.title,
        icon:           matchingTopic?.icon || '🚀',
        topicId:        matchingTopic?._id || null,
        category:       rec.category || 'General',
        level:          rec.suggestedLevel || 'beginner',
        reason:         rec.reason,
        confidence:     rec.confidence,
      };
    });
  } catch (error) {
    // AI recommendations are best-effort — don't fail the whole request
    console.error('[recommendations.controller] AI recommendation error:', error.message);
    return [];
  }
};

// ── Controllers ─────────────────────────────────────────────────────

// @desc    Get personalized recommendations — concepts to revise, revision modules, AI suggestions
// @route   GET /recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all three sections in parallel
    const [conceptsToRevise, suggestedRevision, nextTopics] = await Promise.all([
      _getConceptsToRevise(userId),
      _getSuggestedRevision(userId),
      _getAIRecommendations(userId),
    ]);

    res.status(200).json({
      conceptsToRevise,
      suggestedRevision,
      nextTopics,
    });
  } catch (err) {
    console.error('[recommendations.controller] getRecommendations error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Force-refresh AI recommendations (re-runs LLM analysis)
// @route   POST /recommendations/refresh
// @access  Private
exports.refreshRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Re-fetch everything fresh (AI recommendations will call LLM again)
    const [conceptsToRevise, suggestedRevision, nextTopics] = await Promise.all([
      _getConceptsToRevise(userId),
      _getSuggestedRevision(userId),
      _getAIRecommendations(userId),
    ]);

    res.status(200).json({
      conceptsToRevise,
      suggestedRevision,
      nextTopics,
    });
  } catch (err) {
    console.error('[recommendations.controller] refreshRecommendations error:', err.message);
    res.status(500).json({ message: err.message });
  }
};