import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";

export default function CaseDetailView() {
  const { caseNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [hrCase, setHrCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [solutionText, setSolutionText] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  
  const statusOptions = ["Open", "In Progress", "Resolved", "Closed Complete", "Escalated"];
  
  // Check if this is a main case or a related case
  const isMainCase = location.state?.isMainCase ?? false;

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/hr-cases/${encodeURIComponent(caseNumber)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load case");
        if (!mounted) return;
        setHrCase(data.case);
        setSolutionText(data.case.solution_text || "");
        setStatus(data.case.status || "Open");
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Unable to load case");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [caseNumber]);

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === status) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/hr-cases/${encodeURIComponent(caseNumber)}/solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          solution_text: hrCase.solution_text || "",
          status: newStatus 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setHrCase(data.case);
      setStatus(data.case.status);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update status");
      setStatus(hrCase.status); // Reset to original status on error
    }
  };

  const handleSave = async () => {
    if (!solutionText.trim()) {
      setError("Please enter a solution before submitting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/hr-cases/${encodeURIComponent(caseNumber)}/solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          solution_text: solutionText,
          status: status // Use the selected status
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save solution");
      setHrCase(data.case);
      setEditing(false);
      setStatus(data.case.status);
      alert("Solution saved successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not save solution");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  if (error) return (
    <div className="container mt-5">
      <p className="text-danger">{error}</p>
      <Link to="/">Back to search</Link>
    </div>
  );

  if (!hrCase) return (
    <div className="container mt-5">
      <p>Case not found.</p>
      <Link to="/">Back to search</Link>
    </div>
  );

  return (
    <div className="container mt-5" style={{ maxWidth: 900 }}>
      <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>← Back</button>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="card-title">{hrCase.ticket_id} — {hrCase.short_desc}</h4>
          <div className="d-flex align-items-center gap-2 mb-2">
            <p className="text-muted small mb-0">{hrCase.category} • Priority: {hrCase.priority}</p>
            {isMainCase ? (
              <select 
                className="form-select form-select-sm w-auto" 
                value={status}
             onChange={(e) => handleStatusUpdate(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <span className="badge bg-secondary">{hrCase.status}</span>
            )}
          </div>
          <p>{hrCase.long_desc}</p>
          <p className="mb-1"><strong>Person Affected:</strong> {hrCase.reported_for}</p>
          <p className="mb-1"><strong>Assigned Group:</strong> {hrCase.assigned_group}</p>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5>Solution</h5>
          {hrCase.solution_text && (!isMainCase || !editing) ? (
            <>
              <div className="p-3 bg-light mb-3" style={{ whiteSpace: "pre-wrap" }}>{hrCase.solution_text}</div>
              {isMainCase && (
                <button className="btn btn-outline-primary" onClick={() => setEditing(true)}>Edit Solution</button>
              )}
            </>
          ) : isMainCase ? (
            <>
              <textarea
                className="form-control mb-2"
                rows={8}
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="Enter the solution details here..."
              />
              {error && <p className="text-danger">{error}</p>}
              <div>
                <button className="btn btn-primary me-2" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save & Close Case"}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { 
                    setEditing(false); 
                    setSolutionText(hrCase.solution_text || ""); 
                  }} 
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted">No solution recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
