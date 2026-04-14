export default function MetricCard({ label, value, type }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>

      <div className={`metric-val ${type}`}>
        {value}
      </div>

      <div className="metric-change">
        +5% from last week
      </div>
    </div>
  );
}