import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRecommendations, refreshRecommendations } from "../../api/recommendationsApi";
import PageLayout from "../../components/layout/PageLayout";
import styles from "./Recommendations.module.css";


function Recommendations() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await getRecommendations(token);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError(err.response?.data?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const result = await refreshRecommendations(token);
      setData(result);
    } catch (err) {
      console.error("Failed to refresh recommendations:", err);
      setError(err.response?.data?.message || "Failed to refresh recommendations");
    } finally {
      setRefreshing(false);
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 70) return "#16a34a";
    if (mastery >= 50) return "#d97706";
    return "#dc2626";
  };

  // ── Loading State ───────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <h2 className={styles.title}>✨ For You</h2>
            <p className={styles.subtitle}>Loading your personalized recommendations…</p>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.section}>
              <div className={styles.skeletonHeader} />
              <div className={styles.skeletonList}>
                {[1, 2].map((j) => (
                  <div key={j} className={styles.skeletonCard} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <h2 className={styles.title}>✨ For You</h2>
          </div>
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchRecommendations}>
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const { conceptsToRevise = [], suggestedRevision = [], nextTopics = [] } = data || {};
  const hasNoData =
    conceptsToRevise.length === 0 &&
    suggestedRevision.length === 0 &&
    nextTopics.length === 0;

  return (
    <PageLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>✨ For You</h2>
            <p className={styles.subtitle}>
              Personalized recommendations based on your learning progress
            </p>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh AI recommendations"
          >
            <span className={`${styles.refreshIcon} ${refreshing ? styles.spinning : ""}`}>
              🔄
            </span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Inline error banner (shown when refresh fails but old data exists) */}
        {error && data && (
          <div className={styles.errorBanner}>
            <span>⚠️ {error}</span>
            <button className={styles.dismissBtn} onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* All-empty state */}
        {hasNoData && (
          <div className={styles.emptyPageState}>
            <span className={styles.emptyPageIcon}>🎯</span>
            <h3 className={styles.emptyPageTitle}>No recommendations yet</h3>
            <p className={styles.emptyPageText}>
              Start learning a topic and completing quizzes to get personalised
              recommendations here.
            </p>
            <button className={styles.exploreBtn} onClick={() => navigate("/topics")}>
              Explore Topics →
            </button>
          </div>
        )}

        {/* Weak Concepts */}
        {conceptsToRevise.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>⚠️ Concepts to Revise</h3>
              <span className={styles.sectionBadge}>Based on quiz performance</span>
            </div>
            <div className={styles.weakList}>
              {conceptsToRevise.map((item, index) => (
                <div key={`weak-${index}`} className={styles.weakCard}>
                  <div className={styles.weakIcon}>{item.topicIcon || "📘"}</div>
                  <div className={styles.weakInfo}>
                    <p className={styles.weakConcept}>{item.concept}</p>
                    <p className={styles.weakTopic}>{item.topicTitle}</p>
                    <div className={styles.masteryBar}>
                      <div
                        className={styles.masteryFill}
                        style={{
                          width: `${item.masteryPercent}%`,
                          backgroundColor: getMasteryColor(item.masteryPercent),
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.masteryScore}>
                    <span style={{ color: getMasteryColor(item.masteryPercent) }}>
                      {item.masteryPercent}%
                    </span>
                    <span className={styles.masteryLabel}>mastery</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revision Modules */}
        {suggestedRevision.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>🔄 Suggested Revision</h3>
              <span className={styles.sectionBadge}>Modules to revisit</span>
            </div>
            <div className={styles.revisionList}>
              {suggestedRevision.map((mod) => (
                <div
                  key={mod.moduleId}
                  className={styles.revisionCard}
                  onClick={() => navigate(`/module/${mod.moduleId}`)}
                >
                  <div className={styles.revisionIcon}>{mod.topicIcon || "📘"}</div>
                  <div className={styles.revisionInfo}>
                    <p className={styles.revisionTitle}>{mod.title}</p>
                    <p className={styles.revisionTrail}>{mod.trail}</p>
                  </div>
                  <div className={styles.revisionScore}>
                    <span className={styles.scoreBadge}>Last: {mod.score}%</span>
                    <span className={styles.revisionArrow}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Topics (AI Powered) */}
        {nextTopics.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>🚀 Recommended Next Topics</h3>
              <span className={styles.sectionBadge}>AI powered suggestions</span>
            </div>
            <div className={styles.nextList}>
              {nextTopics.map((topic, index) => (
                <div
                  key={`next-${index}`}
                  className={styles.nextCard}
                  onClick={() =>
                    topic.topicId
                      ? navigate(`/topics?highlight=${topic.topicId}`)
                      : navigate("/topics")
                  }
                >
                  <div className={styles.nextIcon}>{topic.icon || "🚀"}</div>
                  <div className={styles.nextInfo}>
                    <p className={styles.nextTitle}>{topic.title}</p>
                    <p className={styles.nextCategory}>{topic.category}</p>
                    <p className={styles.nextReason}>💡 {topic.reason}</p>
                  </div>
                  <div className={styles.nextMeta}>
                    <span className={styles.levelBadge}>{topic.level}</span>
                    {topic.confidence && (
                      <span className={styles.confidenceBadge}>
                        {Math.round(topic.confidence * 100)}%
                      </span>
                    )}
                    <span className={styles.nextArrow}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section-level empty states (when only some sections are empty) */}
        {!hasNoData && conceptsToRevise.length === 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>⚠️ Concepts to Revise</h3>
            </div>
            <div className={styles.emptySection}>
              <span className={styles.emptySectionIcon}>✅</span>
              <p className={styles.emptySectionText}>
                All your concepts are on track! Keep up the great work.
              </p>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
}

export default Recommendations;