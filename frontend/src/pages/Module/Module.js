import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getModuleById, getModuleContent } from "../../api/moduleApi";
import PageLayout from "../../components/layout/PageLayout";
import styles from "./Module.module.css";

const difficultyConfig = {
  beginner: { icon: "🌱", label: "Beginner", color: "#16a34a" },
  intermediate: { icon: "⚡", label: "Intermediate", color: "#f59e0b" },
  advanced: { icon: "🔥", label: "Advanced", color: "#ef4444" },
};

function Module() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [moduleMeta, setModuleMeta] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── 1. Fetch module metadata ─────────────────────────────────────
  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getModuleById(moduleId, token);
        setModuleMeta(data);
      } catch (err) {
        console.error("Failed to load module:", err);
        setError(err.response?.data?.message || "Failed to load module.");
      } finally {
        setLoading(false);
      }
    };

    if (moduleId && token) fetchModule();
  }, [moduleId, token]);

  // ── 2. Fetch AI-generated content once metadata is loaded ────────
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setContentLoading(true);
        const res = await getModuleContent(moduleId, token);
        setContent(res.data);
      } catch (err) {
        console.error("Failed to load content:", err);
        // Content generation may fail — we still show metadata
        setContent(null);
      } finally {
        setContentLoading(false);
      }
    };

    if (moduleMeta && token) fetchContent();
  }, [moduleMeta, moduleId, token]);

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading module…</p>
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
          <div className={styles.errorContainer}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!moduleMeta) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div>Module not found.</div>
        </div>
      </PageLayout>
    );
  }

  const diffConfig = difficultyConfig[moduleMeta.difficulty] || difficultyConfig.beginner;

  return (
    <PageLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span
            className={styles.difficultyBadge}
            style={{ backgroundColor: diffConfig.color + "18", color: diffConfig.color }}
          >
            {diffConfig.icon} {diffConfig.label}
          </span>
        </div>

        {/* Module Title */}
        <div className={styles.titleRow}>
          <div className={styles.icon}>📘</div>
          <div>
            <h2 className={styles.title}>{moduleMeta.title}</h2>
            <p className={styles.duration}>
              ⏱ {moduleMeta.duration} mins &nbsp;·&nbsp; {moduleMeta.concept}
            </p>
          </div>
        </div>

        {/* AI-generated content area */}
        {contentLoading ? (
          <div className={styles.contentLoadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>
              Generating personalised content…
            </p>
            <p className={styles.loadingSubText}>
              This may take a moment on first visit
            </p>
          </div>
        ) : content ? (
          <>
            {/* Introduction */}
            {content.introduction && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>📖 Introduction</h3>
                <p className={styles.cardText}>{content.introduction}</p>
              </div>
            )}

            {/* Objective */}
            {content.objective && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>🎯 Learning Objective</h3>
                <p className={styles.cardText}>{content.objective}</p>
              </div>
            )}

            {/* Main Content */}
            {content.content && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>📚 Content</h3>
                <div className={styles.cardText} style={{ whiteSpace: "pre-wrap" }}>
                  {content.content}
                </div>
              </div>
            )}

            {/* Key Points */}
            {content.keyPoints && content.keyPoints.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>💡 Key Concepts</h3>
                <ul className={styles.keyPoints}>
                  {content.keyPoints.map((point, index) => (
                    <li key={index} className={styles.keyPoint}>
                      <span className={styles.bullet}>→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples */}
            {content.examples && content.examples.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>🧪 Examples</h3>
                <ul className={styles.keyPoints}>
                  {content.examples.map((example, index) => (
                    <li key={index} className={styles.keyPoint}>
                      <span className={styles.bullet}>•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {content.summary && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>📝 Summary</h3>
                <p className={styles.cardText}>{content.summary}</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.card}>
            <p className={styles.cardText} style={{ textAlign: "center", color: "#94a3b8" }}>
              Content could not be generated. Please try again later.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            className={styles.notesBtn}
            onClick={() => navigate(`/notes/${moduleId}`)}
          >
            📖 View Full Notes
          </button>
          <button
            className={styles.quizBtn}
            onClick={() => navigate(`/quiz/${moduleId}`)}
          >
            🧠 Start Quiz
          </button>
        </div>

      </div>
    </PageLayout>
  );
}

export default Module;