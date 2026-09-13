type Props = {
  label: string;
  value: string;
  tone?: 'good' | 'bad' | 'neutral';
};

export default function StatCard({ label, value, tone = 'neutral' }: Props) {
  return (
    <section className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
