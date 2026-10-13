import {
  Component,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { appRegistry, type AppKey } from '../../app-registry';

interface Props {
  appKey: AppKey;
  title: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; App: ComponentType }
  | { status: 'error'; message: string };

class Boundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { error: Error | null }
> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <Failure
          message="The app hit an unexpected error. The rest of the site is unaffected."
          onRetry={() => {
            this.setState({ error: null });
            this.props.onRetry();
          }}
        />
      );
    }
    return this.props.children;
  }
}

function Failure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="app-state app-state--error" role="alert">
      <p className="app-state__title">This app could not be started</p>
      <p>{message}</p>
      <button type="button" className="btn btn--ghost" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

/** Loads an app from the registry on demand and isolates its failures from the rest of the page. */
export default function AppHost({ appKey, title }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    appRegistry[appKey]()
      .then((mod) => !cancelled && setState({ status: 'ready', App: mod.default }))
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'The app code failed to load. Check your connection and try again.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.status === 'loading') {
    return (
      <div className="app-state" role="status">
        <span className="app-state__spinner" aria-hidden="true" />
        <p>Loading {title}…</p>
      </div>
    );
  }
  // Browsers cache a failed dynamic import, so a reload is the reliable way to retry loading.
  if (state.status === 'error')
    return <Failure message={state.message} onRetry={() => window.location.reload()} />;

  const { App } = state;
  return (
    <Boundary onRetry={retry}>
      <App />
    </Boundary>
  );
}
