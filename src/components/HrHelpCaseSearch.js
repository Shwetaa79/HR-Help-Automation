import React, { useState } from "react";
import mockData from "../mockData.json";
import "bootstrap/dist/css/bootstrap.min.css";

export default function HrHelpCaseSearch() {
  const [query, setQuery] = useState("");
  const [mainCase, setMainCase] = useState(null);
  const [relatedCases, setRelatedCases] = useState([]);

  const handleSearch = () => {
    const found = mockData.find((c) =>
      c.caseNumber.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      const keywords = found.shortDescription
        .toLowerCase()
        .split(" ")
        .filter((w) => w.length > 3);

      const relatedRanked = mockData
        .filter((c) => c.caseNumber !== found.caseNumber)
        .map((c) => {
          const words = c.shortDescription.toLowerCase().split(" ");
          const matches = keywords.filter((kw) => words.includes(kw)).length;
          const score = Math.min((matches / keywords.length) * 100, 100);
          return { ...c, matchCount: matches, relevance: Math.round(score) };
        })
        .filter((c) => c.matchCount > 0)
        .sort((a, b) => b.relevance - a.relevance);

      setMainCase(found);
      setRelatedCases(relatedRanked);
    } else {
      setMainCase(null);
      setRelatedCases([]);
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

      {/* Search bar */}
      <div className="input-group mb-4 shadow-sm rounded-pill overflow-hidden">
        <span className="input-group-text bg-light border-0 ps-4">
          🔍
        </span>
        <input
          type="text"
          className="form-control border-0"
          placeholder="Search HR Case Number (e.g. HR-1001)"
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
        >
          Search
        </button>
      </div>

      {/* Main case */}
      {mainCase ? (
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

          {/* Related cases */}
          {relatedCases.length > 0 && (
            <>
              <h5 className="mb-3 text-center text-secondary fw-semibold">
                Related Cases
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
                        <div className="mt-3">
                          <small className="text-muted d-block mb-1">
                            Relevance Score
                          </small>
                          <div className="progress" style={{ height: "8px" }}>
                            <div
                              className={`progress-bar ${getProgressClass(
                                item.relevance
                              )}`}
                              role="progressbar"
                              style={{ width: `${item.relevance}%` }}
                              aria-valuenow={item.relevance}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <small className="text-muted">
                            {item.relevance}%
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        query && (
          <p className="text-center text-muted">
            No HR case found for “{query}”.
          </p>
        )
      )}
    </div>
  );
}
