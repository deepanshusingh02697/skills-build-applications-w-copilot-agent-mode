import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading: boolean;
  empty: boolean;
  emptyText: string;
  error?: string;
  children: ReactNode;
};

export function CapabilityCard({ title, description, loading, empty, emptyText, error, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
        {error && <div role="alert" className="alert alert-danger">Unable to load {title.toLowerCase()}: {error}</div>}
        {!loading && !error && empty && <p>{emptyText}</p>}
        {!loading && !error && !empty && children}
      </div>
    </section>
  );
}
