import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

export default function HrHelpCaseSearch() {
  const [query, setQuery] = useState("");
  const [mainCase, setMainCase] = useState(null);
  const [relatedCases, setRelatedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setMainCase(null);
    setRelatedCases([]);

    try {
      const res = await fetch(
        `http://localhost:5000/api/hr-cases/related/${encodeURIComponent(
          query.trim()
        )}`
      );
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Case not found or backend error");
      }

      console.log("Response data:", data); // Debug log

      if (!data.mainCase) {
        throw new Error("Case not found");
      }

      setMainCase(data.mainCase);
      setRelatedCases(data.relatedCases || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "No HR case found or server not responding.");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "Open":
        return "bg-warning text-dark";
      case "Closed Complete":
        return "bg-success";
      default:
        return "bg-danger";
    }
  };

  const getProgressClass = (val) => {
    if (val >= 70) return "bg-success";
    if (val >= 40) return "bg-warning";
    return "bg-danger";
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "900px" }}>
      <h3 className="text-center mb-4 fw-bold text-dark">
        HR Help Case Lookup
      </h3>

      {/* Search Bar */}
      <div className="input-group mb-4 shadow-sm rounded-pill overflow-hidden">
        <span className="input-group-text bg-light border-0 ps-4">🔍</span>
        <input
          type="text"
          className="form-control border-0"
          placeholder="Search HR Case Number (e.g. HR1188)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          style={{ backgroundColor: "#f9fafb" }}
        />
        <button
          className="btn btn-success px-4 rounded-pill"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Finding related HR cases...</p>
        </div>
      )}

      {/* Error message */}
      {error && !loading && (
        <p className="text-center text-danger">{error}</p>
      )}

      {/* Main Case */}
      {mainCase && !loading && (
        <div>
          <h5 className="mb-3 text-center text-success">Main Case</h5>
          <div
            className="card mb-5 border-0 shadow-sm"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body">
              <Link 
                to={`/case/${mainCase.caseNumber}`}
                state={{ isMainCase: true }}
                className="text-decoration-none"
              >
                <h5 className="card-title text-primary">{mainCase.caseNumber}</h5>
              </Link>
              <div className="d-flex justify-content-between mb-2">
                <h6 className="card-subtitle text-muted">
                  {mainCase.shortDescription}
                </h6>
                <div>
                  <span className={`badge ${getBadgeClass(mainCase.status)} me-2`}>
                    {mainCase.status}
                  </span>
                  <span className="badge bg-info">{mainCase.priority}</span>
                </div>
              </div>
              <p className="card-text">{mainCase.longDescription}</p>
              <div className="mb-2">
                <p className="mb-1">
                  <strong>Person Affected:</strong> {mainCase.personAffected}
                </p>
                <p className="mb-1">
                  <strong>Category:</strong> {mainCase.category}
                </p>
                <p className="mb-1">
                  <strong>Assigned To:</strong> {mainCase.assignedGroup}
                </p>
                <p className="mb-1">
                  <strong>Created:</strong> {new Date(mainCase.createdAt).toLocaleString()}
                </p>
                <p className="mb-1">
                  <strong>Submitted By:</strong> {mainCase.submittedBy}
                </p>
              </div>
              {mainCase.tags && (
                <div>
                  {mainCase.tags.split(";").map((tag, i) => (
                    <span key={i} className="badge bg-light text-dark me-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Cases */}
          {relatedCases.length > 0 ? (
            <>
              <h5 className="mb-3 text-center text-secondary fw-semibold">
                Related Cases (AI Matched)
              </h5>
              <div className="row g-4">
                {relatedCases.map((item) => (
                  <div className="col-md-6" key={item.caseNumber}>
                    <Link 
                      to={`/case/${item.caseNumber}`}
                      state={{ isMainCase: false }}
                      style={{ textDecoration: "none", color: "inherit" }}>
                      <div
                        className="card h-100 border-0 shadow-sm"
                        style={{
                          borderRadius: "12px",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-primary mb-0 fw-bold">
                              {item.caseNumber}
                            </h6>
                            <span
                              className={`badge ${getBadgeClass(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-muted small mb-2">
                            {item.shortDescription}
                          </p>
                          <p className="small">{item.longDescription}</p>
                          <p className="small mb-1">
                            <strong>Person Affected:</strong>{" "}
                            {item.personAffected}
                          </p>

                          {/* Relevance Score */}
                          <div className="mt-3">
                            <small className="text-muted d-block mb-1">
                              Relevance Score
                            </small>
                            <div
                              className="progress position-relative"
                              style={{
                                height: "10px",
                                backgroundColor: "#e9ecef",
                                borderRadius: "10px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                className={`progress-bar progress-bar-striped progress-bar-animated ${getProgressClass(
                                  item.relevance
                                )}`}
                                role="progressbar"
                                style={{
                                  width: `${item.relevance}%`,
                                  transition: "width 0.6s ease-in-out",
                                }}
                                aria-valuenow={item.relevance}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <small
                                className={`fw-semibold ${
                                  item.relevance >= 90
                                    ? "text-success"
                                    : "text-muted"
                                }`}
                              >
                                {item.relevance === 100
                                  ? "Perfect match (100%)"
                                  : `${item.relevance}%`}
                              </small>
                              {item.relevance >= 90 && (
                                <span role="img" aria-label="perfect">
                                  🌟
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted">
              No related cases found by AI.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
