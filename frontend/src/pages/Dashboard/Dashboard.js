import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyProgress } from "../../api/progressApi";
import PageLayout from "../../components/layout/PageLayout";
import { useAuth } from "../../context/AuthContext";
import { getMyTrails } from "../../api/trailApi";
import styles from "./Dashboard.module.css";

function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch progress to derive dashboard data ──────────────────────
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const data = await getMyProgress(token);
        setProgressData(data);
      } catch (err) {
        console.error("Failed to load progress:", err);
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
    });
  });

  const trails = Object.values(trailMap).map((trail) => {
    const total = trail.modules.length;
    const completed = trail.modules.filter(
      (m) => m.completionStatus === "completed"
    ).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { ...trail, total, completed, progress };
  });

  const totalModulesCompleted = progressData.filter(
    (r) => r.completionStatus === "completed"
  ).length;

  const totalTrails = trails.length;

  const userName = user?.name || "Learner";

  return (
    <PageLayout>
      <div className={styles.page}>

        {/* Welcome Banner */}
        <div className={styles.banner}>
          <div>
            <p className={styles.bannerGreeting}>
              Welcome back, {userName} 👋
            </p>
            <p className={styles.bannerSub}>
              {totalTrails > 0
                ? `You have ${totalTrails} active trail${totalTrails !== 1 ? "s" : ""}. Keep going! 🔥`
                : "Start learning by choosing a topic! 🚀"}
            </p>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>📚 {totalModulesCompleted}</span>
              <span className={styles.statLabel}>Modules Done</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>🛤️ {totalTrails}</span>
              <span className={styles.statLabel}>Active Trails</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Active Trails</h3>
            <button
              className={styles.viewAll}
              onClick={() => navigate("/topics")}
            >
              + New Trail
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
            </div>
          ) : trails.length > 0 ? (
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
                    <p className={styles.trailTitle}>{trail.title}</p>
                    <p className={styles.trailCategory}>
                      {trail.completed}/{trail.total} modules completed
                    </p>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${trail.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className={styles.trailPercent}>
                    {trail.progress}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No trails started yet.</p>
              <button
                className={styles.startBtn}
                onClick={() => navigate("/topics")}
              >
                🚀 Browse Topics
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Quick Actions</h3>
          </div>
          <div className={styles.achievementRow}>
            <div
              className={styles.achievementCard}
              onClick={() => navigate("/topics")}
              style={{ cursor: "pointer" }}
            >
              <span className={styles.achievementIcon}>📚</span>
              <span className={styles.achievementLabel}>Browse Topics</span>
            </div>
            <div
              className={styles.achievementCard}
              onClick={() => navigate("/progress")}
              style={{ cursor: "pointer" }}
            >
              <span className={styles.achievementIcon}>📈</span>
              <span className={styles.achievementLabel}>My Progress</span>
            </div>
            <div
              className={styles.achievementCard}
              onClick={() => navigate("/recommendations")}
              style={{ cursor: "pointer" }}
            >
              <span className={styles.achievementIcon}>✨</span>
              <span className={styles.achievementLabel}>For You</span>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}

export default Dashboard;