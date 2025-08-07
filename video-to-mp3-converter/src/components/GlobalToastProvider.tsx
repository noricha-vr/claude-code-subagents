import { useApp } from '../context/AppContext';
import { ToastContainer } from './ToastNotification';

/**
 * グローバルトースト通知プロバイダー
 * アプリ全体のトースト通知を管理
 */
export function GlobalToastProvider() {
  const { errorHandler } = useApp();
  
  return (
    <ToastContainer
      notifications={errorHandler.state.notifications}
      onRemove={errorHandler.actions.removeNotification}
      position="top-right"
      maxToasts={5}
    />
  );
}

export default GlobalToastProvider;