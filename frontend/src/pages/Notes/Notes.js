import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getFullNotes } from "../../api/moduleApi";
import PageLayout from "../../components/layout/PageLayout";
import { getModuleById } from "../../api/moduleApi";
import styles from "./Notes.module.css";

function Notes() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch full notes from the API ─────────────────────────────────
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getFullNotes(moduleId, token);
        setNotes(res.data);
      } catch (err) {
        console.error("Failed to load full notes:", err);
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to generate notes. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (moduleId && token) fetchNotes();
  }, [moduleId, token]);

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Generating your full notes…</p>
            <p className={styles.loadingSubtext}>
              Our AI is crafting comprehensive, gamified study material just for you.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back to Module
            </button>
          </div>
          <div className={styles.errorContainer}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── No notes found ────────────────────────────────────────────────
  if (!notes) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back to Module
            </button>
          </div>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Notes not found.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back to Module
          </button>
        </div>

        {/* Title */}
        <div className={styles.titleRow}>
          <span className={styles.icon}>📖</span>
          <div>
            <h2 className={styles.title}>{notes.title}</h2>
            <p className={styles.subtitle}>Full Notes</p>
          </div>
        </div>

        {/* Sections */}
        <div className={styles.sections}>
          {notes.sections && notes.sections.map((section, index) => (
            <div key={index} className={styles.section}>
              <h3 className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>{index + 1}</span>
                {section.heading}
              </h3>
              <p className={styles.sectionContent}>{section.content}</p>
            </div>
          ))}
        </div>

        {/* Gamified Examples */}
        {notes.gamifiedExamples && notes.gamifiedExamples.length > 0 && (
          <div className={styles.gamifiedSection}>
            <h3 className={styles.gamifiedTitle}>🎮 Bonus Challenges</h3>
            <div className={styles.gamifiedList}>
              {notes.gamifiedExamples.map((example, index) => (
                <div key={index} className={styles.gamifiedCard}>
                  <span className={styles.gamifiedBadge}>Quest {index + 1}</span>
                  <p className={styles.gamifiedText}>{example}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Action */}
        <div className={styles.actions}>
          <button
            className={styles.quizBtn}
            onClick={() => navigate(`/quiz/${moduleId}`)}
          >
            🧠 Ready to take the Quiz?
          </button>
        </div>

      </div>
    </PageLayout>
  );
}

export default Notes;