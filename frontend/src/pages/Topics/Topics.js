import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTopics } from "../../api/topicsApi";
import { createTrail } from "../../api/trailApi";
import PageLayout from "../../components/layout/PageLayout";
import styles from "./Topics.module.css";

const levelColors = {
  beginner: "#16a34a",
  intermediate: "#d97706",
  advanced: "#dc2626",
};

const levelLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [creatingTrailId, setCreatingTrailId] = useState(null);

  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef(null);

  // ── Fetch topics from API ────────────────────────────────────────
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTopics();
        setTopics(data);
      } catch (err) {
        console.error("Failed to load topics:", err);
        setError(err.response?.data?.message || "Failed to load topics.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Auto-scroll to highlighted topic from recommendations
  useEffect(() => {
    if (highlightId && highlightRef.current && !loading) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, loading]);

  const filtered = topics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(search.toLowerCase()) ||
      (topic.description || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Create trail & navigate ──────────────────────────────────────
  const handleTopicClick = async (topic) => {
    if (creatingTrailId) return; // prevent double-clicks

    try {
      setCreatingTrailId(topic._id);
      const data = await createTrail(topic._id, token);
      navigate(`/trail/${data.trail._id}`);
    } catch (err) {
      console.error("Failed to create trail:", err);
      alert(
        err.response?.data?.message ||
          "Failed to start trail. Please try again."
      );
    } finally {
      setCreatingTrailId(null);
    }
  };

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <PageLayout>
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading topics…</p>
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
        <div className={styles.header}>
          <h2 className={styles.title}>Choose a Topic</h2>
          <p className={styles.subtitle}>
            Select a topic to generate your personalized learning trail
          </p>
        </div>

        <input
          type="text"
          placeholder="🔍 Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        <div className={styles.grid}>
          {filtered.map((topic) => {
            const isCreating = creatingTrailId === topic._id;

            return (
              <div
                key={topic._id}
                ref={topic._id === highlightId ? highlightRef : null}
                className={`${styles.card} ${isCreating ? styles.cardCreating : ""} ${topic._id === highlightId ? styles.cardHighlighted : ""}`}
                onClick={() => handleTopicClick(topic)}
                style={{ pointerEvents: isCreating ? "none" : "auto" }}
              >
                <div className={styles.icon}>{topic.icon || "📘"}</div>
                <div className={styles.info}>
                  <h3 className={styles.topicTitle}>{topic.title}</h3>
                  <p className={styles.category}>
                    {topic.description || "Learning Trail"}
                  </p>
                  <div className={styles.meta}>
                    <span
                      className={styles.level}
                      style={{ color: levelColors[topic.level] || "#4f46e5" }}
                    >
                      ● {levelLabels[topic.level] || topic.level}
                    </span>
                    <span className={styles.modules}>
                      {topic.concepts?.length || 0} concepts
                    </span>
                  </div>
                </div>
                {isCreating && (
                  <div className={styles.creatingOverlay}>
                    <div className={styles.spinnerSmall} />
                    <span>Generating…</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            {topics.length === 0 ? (
              <p>No topics available yet. Ask an admin to create topics.</p>
            ) : (
              <p>No topics found for "{search}"</p>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default Topics;