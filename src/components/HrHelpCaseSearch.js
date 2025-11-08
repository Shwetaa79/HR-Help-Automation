import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

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
      if (!res.ok) throw new Error("Case not found or backend error");
      const data = await res.json();

      setMainCase(data.mainCase);
      setRelatedCases(data.relatedCases || []);
    } catch (err) {
      console.error(err);
      setError("No HR case found or server not responding.");
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
          placeholder="Search HR Case Number (e.g. HRT0000001)"
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
              <h5 className="card-title text-primary">{mainCase.caseNumber}</h5>
              <h6 className="card-subtitle mb-2 text-muted">
                {mainCase.shortDescription}
              </h6>
              <p className="card-text">{mainCase.longDescription}</p>
              <p>
                <strong>Person Affected:</strong> {mainCase.personAffected}
              </p>
              <span className={`badge ${getBadgeClass(mainCase.status)}`}>
                {mainCase.status}
              </span>
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
