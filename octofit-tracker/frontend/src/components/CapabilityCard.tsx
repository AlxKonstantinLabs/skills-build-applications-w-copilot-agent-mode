import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Item = Record<string, unknown>;
type ViewState =
  | { status: 'loading' }
  | { status: 'success'; items: Item[] }
  | { status: 'error'; message: string };

type Props = {
  title: string;
  description: string;
  path: string;
  collection: string;
  emptyMessage: string;
  renderItem: (item: Item) => ReactNode;
};

function isItem(value: unknown): value is Item {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function CapabilityCard({ title, description, path, collection, emptyMessage, renderItem }: Props) {
  const [view, setView] = useState<ViewState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    getJson<unknown>(path).then((response) => {
      if (!isItem(response) || !Array.isArray(response[collection]) || !response[collection].every(isItem)) {
        throw new Error(`The ${title.toLowerCase()} response has an invalid format`);
      }
      if (active) {
        setView({ status: 'success', items: response[collection] });
      }
    }).catch((error: unknown) => {
      if (active) {
        const detail = error instanceof Error ? error.message : 'Unknown error';
        setView({ status: 'error', message: `Unable to load ${title.toLowerCase()}: ${detail}` });
      }
    });

    return () => {
      active = false;
    };
  }, [collection, path, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {view.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {view.status === 'error' && <p role="alert">{view.message}</p>}
        {view.status === 'success' && view.items.length === 0 && <p>{emptyMessage}</p>}
        {view.status === 'success' && view.items.length > 0 && (
          <ul className="list-group list-group-flush">
            {view.items.map((item, index) => <li className="list-group-item" key={String(item._id ?? index)}>{renderItem(item)}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
