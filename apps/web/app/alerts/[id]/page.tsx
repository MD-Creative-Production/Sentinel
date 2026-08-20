import { Alert, MOCK_ALERTS } from '../types';
import '../alerts.css';

interface AlertDetailsProps {
  alert?: Alert;
}

export function AlertDetails({ alert }: AlertDetailsProps) {
  if (!alert) {
    return (
      <main className="alerts-page alert-not-found">
        <h1 className="alerts-title">Alert not found</h1>
        <a className="alert-back" href="/alerts">
          Back to alert feed
        </a>
      </main>
    );
  }

  return (
    <main className="alerts-page">
      <header className="alert-detail-header">
        <div>
          <a className="alert-back" href="/alerts">
            Back to alert feed
          </a>
          <h1 className="alert-detail-title">{alert.title}</h1>
          <p className="alert-detail-subtitle">
            {alert.id} · {alert.source} · {alert.network}
          </p>
        </div>
        <span className={`alert-severity alert-severity--${alert.severity}`}>{alert.severity}</span>
      </header>

      <div className="alert-detail-grid">
        <section className="alert-panel" aria-labelledby="alert-explanation-heading">
          <h2 id="alert-explanation-heading">Detection explanation</h2>
          <p className="alert-explanation">{alert.explanation}</p>
        </section>
        <section className="alert-panel" aria-labelledby="alert-risk-heading">
          <h2 id="alert-risk-heading">Risk score</h2>
          <div className="alert-score">
            <strong>{alert.riskScore}</strong>
            <span>/ 100</span>
          </div>
        </section>
        <section className="alert-panel" aria-labelledby="alert-metadata-heading">
          <h2 id="alert-metadata-heading">Alert metadata</h2>
          <dl className="alert-metadata">
            <div>
              <dt>Detected</dt>
              <dd>
                {new Date(alert.detectedAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </dd>
            </div>
            {alert.metadata.map(item => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="alert-panel" aria-labelledby="alert-events-heading">
          <h2 id="alert-events-heading">Related events</h2>
          <ol className="alert-events">
            {alert.events.map(event => (
              <li className="alert-event" key={event.id}>
                <strong>
                  {event.type} · {event.status}
                </strong>
                <p>{event.description}</p>
                <time dateTime={event.timestamp}>
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

export default function AlertDetailsPage({ params }: { params: { id: string } }) {
  return <AlertDetails alert={MOCK_ALERTS.find(alert => alert.id === params.id)} />;
}
