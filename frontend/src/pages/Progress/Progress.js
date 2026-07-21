import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyProgress } from "../../api/progressApi";
import PageLayout from "../../components/layout/PageLayout";
import styles from "./Progress.module.css";


function Progress() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch progress ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyProgress(token);
        setProgressData(data);
      } catch (err) {
        console.error("Failed to load progress:", err);
        setError(err.response?.data?.message || "Failed to load progress.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProgress();
  }, [token]);

  // ── Derive stats from progress records ───────────────────────────
  const trailMap = {};
  progressData.forEach((record) => {
    const trailId = record.trail?._id;
    if (!trailId) return;

    if (!trailMap[trailId]) {
      trailMap[trailId] = {
        id: trailId,
        title: record.trail.title || "Untitled Trail",
        status: record.trail.status,
        modules: [],
      };
    }
    trailMap[trailId].modules.push({
      title: record.module?.title || "Module",
      order: record.module?.order ?? 0,
      completionStatus: record.completionStatus,
      updatedAt: record.updatedAt,
    });
  });

  const trails = Object.values(trailMap).map((trail) => {
    const total = trail.modules.length;
    const completed = trail.modules.filter(
      (m) => m.completionStatus === "completed"
    ).length;
    const inProgress = trail.modules.filter(
      (m) => m.completionStatus === "in_progress"
    ).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { ...trail, total, completed, inProgress, progress };
  });

  const totalModulesCompleted = progressData.filter(
    (r) => r.completionStatus === "completed"
  ).length;
  const totalModulesInProgress = progressData.filter(
    (r) => r.completionStatus === "in_progress"
  ).length;
  const totalModules = progressData.length;
  const overallProgress =
    totalModules > 0
      ? Math.round((totalModulesCompleted / totalModules) * 100)
      : 0;

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading progress…</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <span style={{ fontSize: "48px" }}>⚠️</span>
            <p className={styles.loadingText}>{error}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className={styles.page}>

        {/* Header Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <h2 className={styles.bannerTitle}>My Progress</h2>
            <p className={styles.bannerSub}>Track your learning journey</p>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>✅ {totalModulesCompleted}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>▶️ {totalModulesInProgress}</span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>🛤️ {trails.length}</span>
              <span className={styles.statLabel}>Trails</span>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className={styles.levelCard}>
          <div className={styles.levelHeader}>
            <span className={styles.levelTitle}>Overall Completion</span>
            <span className={styles.levelNext}>
              {totalModulesCompleted} / {totalModules} modules
            </span>
          </div>
          <div className={styles.levelBar}>
            <div
              className={styles.levelFill}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className={styles.levelSub}>{overallProgress}% complete</p>
        </div>

        {/* Quick Stats */}
        <div className={styles.quickStats}>
          <div className={styles.quickStatCard}>
            <span className={styles.quickStatIcon}>📚</span>
            <span className={styles.quickStatValue}>{totalModules}</span>
            <span className={styles.quickStatLabel}>Total Modules</span>
          </div>
          <div className={styles.quickStatCard}>
            <span className={styles.quickStatIcon}>✅</span>
            <span className={styles.quickStatValue}>{totalModulesCompleted}</span>
            <span className={styles.quickStatLabel}>Completed</span>
          </div>
          <div className={styles.quickStatCard}>
            <span className={styles.quickStatIcon}>📊</span>
            <span className={styles.quickStatValue}>{overallProgress}%</span>
            <span className={styles.quickStatLabel}>Completion Rate</span>
          </div>
        </div>

        {/* Active Trails */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Trail Progress</h3>
          {trails.length > 0 ? (
            <div className={styles.trailList}>
              {trails.map((trail) => (
                <div
                  key={trail.id}
                  className={styles.trailCard}
                  onClick={() => navigate(`/trail/${trail.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.trailIcon}>📘</div>
                  <div className={styles.trailInfo}>
                    <div className={styles.trailHeader}>
                      <p className={styles.trailTitle}>{trail.title}</p>
                      <span className={styles.trailPercent}>
                        {trail.progress}%
                      </span>
                    </div>
                    <p className={styles.trailCategory}>
                      {trail.completed} completed · {trail.inProgress} in
                      progress · {trail.total} total
                    </p>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${trail.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No progress data yet. Start a trail to begin tracking!</p>
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  );
}

export default Progress;