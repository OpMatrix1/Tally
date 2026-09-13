type Props = {
  title: string;
  detail: string;
};

export default function EmptyState({ title, detail }: Props) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
