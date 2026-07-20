import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTrailById } from "../../api/trailApi";
import PageLayout from "../../components/layout/PageLayout";
import styles from "./Trail.module.css";

const statusConfig = {
  completed: { icon: "✅", label: "Completed", color: "#16a34a" },
  in_progress: { icon: "▶️", label: "In Progress", color: "#4f46e5" },
  locked: { icon: "🔒", label: "Locked", color: "#94a3b8" },
};

function Trail() {
  const { trailId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [trail, setTrail] = useState(null);
  const [modules, setModules] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch trail data ─────────────────────────────────────────────
  useEffect(() => {
    const fetchTrail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTrailById(trailId, token);
        setTrail(data.trail);
        setModules(data.modules || []);
        setConcepts(data.concepts || []);
      } catch (err) {
        console.error("Failed to load trail:", err);
        setError(err.response?.data?.message || "Failed to load trail.");
      } finally {
        setLoading(false);
      }
    };

    if (trailId && token) fetchTrail();
  }, [trailId, token]);

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading trail…</p>
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
            <button className={styles.backLink} onClick={() => navigate("/topics")}>
              ← Back to Topics
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!trail) {
    return (
      <PageLayout>
        <div>Trail not found.</div>
      </PageLayout>
    );
  }

  // ── Build the roadmap ────────────────────────────────────────────
  // Generated modules are available; remaining concepts are locked
  const generatedConceptNames = new Set(modules.map((m) => m.concept));

  const roadmap = [];

  // Add generated modules (clickable)
  modules
    .sort((a, b) => a.order - b.order)
    .forEach((mod, idx) => {
      roadmap.push({
        id: mod._id,
        title: mod.title,
        duration: `${mod.duration || 30} mins`,
        difficulty: mod.difficulty,
        status: idx === 0 ? "in_progress" : "locked",
        isGenerated: true,
      });
    });

  // Add remaining concepts (locked, not yet generated)
  concepts
    .filter((c) => !generatedConceptNames.has(c.name))
    .sort((a, b) => a.order - b.order)
    .forEach((concept) => {
      roadmap.push({
        id: concept.name,
        title: concept.name,
        duration: "—",
        status: "locked",
        isGenerated: false,
      });
    });

  const totalConcepts = concepts.length || roadmap.length;
  const completedModules = 0; // Will be tracked via Progress later
  const progress = totalConcepts > 0
    ? Math.round((modules.length / totalConcepts) * 100)
    : 0;

  const topicData = trail.topic || {};

  const handleModuleClick = (item) => {
    if (item.isGenerated) {
      navigate(`/module/${item.id}`);
    }
  };

  return (
    <PageLayout>
      <div className={styles.page}>

        {/* Trail Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>{topicData.icon || "📘"}</span>
            <div>
              <h2 className={styles.title}>{trail.title}</h2>
              <p className={styles.description}>
                {topicData.description || "Your personalized learning trail"}
              </p>
            </div>
          </div>
          <div className={styles.progressBox}>
            <p className={styles.progressLabel}>{progress}% Generated</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressSub}>
              {modules.length} of {totalConcepts} modules generated
            </p>
          </div>
        </div>

        {/* Module List */}
        <div className={styles.moduleList}>
          <h3 className={styles.sectionTitle}>Modules</h3>
          {roadmap.map((item, index) => {
            const config = statusConfig[item.status] || statusConfig.locked;
            const isClickable = item.isGenerated;

            return (
              <div
                key={item.id}
                className={`${styles.moduleCard} ${
                  isClickable ? styles.clickable : styles.locked
                }`}
                onClick={() => handleModuleClick(item)}
              >
                <div className={styles.moduleNumber}>{index + 1}</div>
                <div className={styles.moduleInfo}>
                  <h4 className={styles.moduleTitle}>{item.title}</h4>
                  <p className={styles.moduleDuration}>
                    {item.isGenerated
                      ? `⏱ ${item.duration} · ${item.difficulty || ""}`
                      : "Not generated yet"}
                  </p>
                </div>
                <div
                  className={styles.moduleStatus}
                  style={{ color: config.color }}
                >
                  <span>{config.icon}</span>
                  <span className={styles.statusLabel}>{config.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        <button className={styles.backLink} onClick={() => navigate("/topics")}>
          ← Back to Topics
        </button>

      </div>
    </PageLayout>
  );
}

export default Trail;