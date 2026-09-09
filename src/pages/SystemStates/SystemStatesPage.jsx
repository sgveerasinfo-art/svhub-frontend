import { useState } from 'react'
import {
  ConfirmModal,
  DeleteModal,
  EmptyCartState,
  EmptyOrdersState,
  EmptySearchState,
  ErrorToast,
  FormErrorState,
  FormFieldError,
  LoadingState,
  NetworkErrorState,
  NotFoundState,
  OutOfStockState,
  PaymentErrorState,
  ServerErrorState,
  SessionExpiredState,
  SkeletonState,
  SuccessToast,
} from '../../components/system/SystemState.jsx'
import './SystemStatesPage.css'

const STATES_LIST = [
  { id: '404', label: '1. 404 Not Found' },
  { id: '500', label: '2. 500 Server Error' },
  { id: 'network', label: '3. Network Error' },
  { id: 'cart', label: '4. Empty Cart' },
  { id: 'search', label: '5. Empty Search' },
  { id: 'orders', label: '6. Empty Orders' },
  { id: 'stock', label: '7. Out of Stock' },
  { id: 'loading', label: '8. Loading' },
  { id: 'skeleton', label: '9. Skeleton Loading' },
  { id: 'form-error', label: '10. Form Error' },
  { id: 'payment', label: '11. Payment Error' },
  { id: 'toast-success', label: '12. Success Toast' },
  { id: 'toast-error', label: '13. Error Toast' },
  { id: 'modal-confirm', label: '14. Confirm Modal' },
  { id: 'modal-delete', label: '15. Delete Modal' },
  { id: 'session', label: '16. Session Expired' },
]

export default function SystemStatesPage() {
  const [activeState, setActiveState] = useState('404')
  const [mode, setMode] = useState('card') // 'page' | 'card' | 'inline'
  const [activeModal, setActiveModal] = useState(null)
  const [toasts, setToasts] = useState([])
  const [skelType, setSkelType] = useState('card')

  function triggerToast(type) {
    const id = Date.now()
    const newToast = {
      id,
      type,
      title: type === 'success' ? 'Order #SVH12345 Dispatched' : 'Payment Authorization Failed',
      message:
        type === 'success'
          ? 'Customer Priya Venkatesh has been sent tracking instructions.'
          : 'The bank declined the transaction. Please check card limits.',
    }
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  return (
    <div className="sys-showcase">
      {/* Page Header */}
      <header className="sys-showcase-header">
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--leaf-green)' }}>
            Design System · 16 Reusable States
          </p>
          <h1>SV Hub System-State Library</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--admin-mute)', fontSize: 14 }}>
            Explore consistent, brand-aligned empty states, error boundaries, loaders, toasts, and confirmation dialogs.
          </p>
        </div>
      </header>

      {/* Navigation Pills for all 16 States */}
      <nav className="sys-showcase-nav" aria-label="System States Selector">
        {STATES_LIST.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sys-nav-pill ${activeState === item.id ? 'is-active' : ''}`}
            onClick={() => {
              setActiveState(item.id)
              if (item.id === 'toast-success') triggerToast('success')
              if (item.id === 'toast-error') triggerToast('error')
              if (item.id === 'modal-confirm') setActiveModal('confirm')
              if (item.id === 'modal-delete') setActiveModal('delete')
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Interactive Preview Stage */}
      <main className="sys-preview-stage">
        {/* Display Mode Toggle */}
        <div className="sys-stage-controls">
          <span>Mode:</span>
          <button
            type="button"
            className={mode === 'card' ? 'is-active' : ''}
            onClick={() => setMode('card')}
          >
            Card
          </button>
          <button
            type="button"
            className={mode === 'page' ? 'is-active' : ''}
            onClick={() => setMode('page')}
          >
            Full Page
          </button>
          <button
            type="button"
            className={mode === 'inline' ? 'is-active' : ''}
            onClick={() => setMode('inline')}
          >
            Inline
          </button>
        </div>

        {/* 1. 404 Not Found */}
        {activeState === '404' && <NotFoundState mode={mode} />}

        {/* 2. 500 Server Error */}
        {activeState === '500' && <ServerErrorState mode={mode} />}

        {/* 3. Network Error */}
        {activeState === 'network' && <NetworkErrorState mode={mode} />}

        {/* 4. Empty Cart */}
        {activeState === 'cart' && <EmptyCartState mode={mode} />}

        {/* 5. Empty Search */}
        {activeState === 'search' && (
          <EmptySearchState
            mode={mode}
            query="Heirloom Quinoa"
            onClear={() => alert('Search input cleared')}
          />
        )}

        {/* 6. Empty Orders */}
        {activeState === 'orders' && <EmptyOrdersState mode={mode} />}

        {/* 7. Out of Stock */}
        {activeState === 'stock' && (
          <OutOfStockState
            mode={mode}
            productName="Kullakar Organic Heritage Rice (1kg)"
            onNotify={(email) => console.log('Subscribed:', email)}
          />
        )}

        {/* 8. Loading State */}
        {activeState === 'loading' && <LoadingState mode={mode} />}

        {/* 9. Skeleton Loading */}
        {activeState === 'skeleton' && (
          <div style={{ width: '100%', maxWidth: 720 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                className={`sys-chip ${skelType === 'card' ? 'is-active' : ''}`}
                onClick={() => setSkelType('card')}
              >
                Card Skeleton
              </button>
              <button
                type="button"
                className={`sys-chip ${skelType === 'table' ? 'is-active' : ''}`}
                onClick={() => setSkelType('table')}
              >
                Table Skeleton
              </button>
            </div>
            <SkeletonState type={skelType} count={2} />
          </div>
        )}

        {/* 10. Form Error State */}
        {activeState === 'form-error' && (
          <div style={{ width: '100%', maxWidth: 520, textAlign: 'left' }}>
            <FormErrorState
              title="Please check 2 highlighted fields"
              message="We could not confirm your order address due to missing information:"
              errors={[
                'PIN code must be a 6-digit postal code (e.g. 641002).',
                'Phone number must be a valid 10-digit Indian mobile number.',
              ]}
            />
            <div style={{ display: 'grid', gap: 14, background: '#FFF', padding: 20, borderRadius: 10, border: '1px solid var(--admin-line)' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Phone Number</label>
                <input
                  type="text"
                  defaultValue="98401"
                  style={{ width: '100%', minHeight: 38, padding: '0 10px', border: '1px solid var(--terracotta)', borderRadius: 6 }}
                />
                <FormFieldError message="Enter 10-digit mobile number." />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Postal PIN Code</label>
                <input
                  type="text"
                  defaultValue="641"
                  style={{ width: '100%', minHeight: 38, padding: '0 10px', border: '1px solid var(--terracotta)', borderRadius: 6 }}
                />
                <FormFieldError message="PIN code must have 6 digits." />
              </div>
            </div>
          </div>
        )}

        {/* 11. Payment Error */}
        {activeState === 'payment' && (
          <PaymentErrorState
            mode={mode}
            code="RZP_UPI_TIMEOUT_408"
            onRetry={() => alert('Initiating payment retry handshake...')}
          />
        )}

        {/* 12. Success Toast Preview */}
        {activeState === 'toast-success' && (
          <div style={{ display: 'grid', gap: 14, placeItems: 'center' }}>
            <SuccessToast
              title="Order #SVH12345 Marked as Shipped"
              message="BlueDart AWB #BLU-98214-IN recorded and dispatch email sent."
            />
            <button type="button" className="sys-btn sys-btn--primary" onClick={() => triggerToast('success')}>
              Trigger Live Success Toast
            </button>
          </div>
        )}

        {/* 13. Error Toast Preview */}
        {activeState === 'toast-error' && (
          <div style={{ display: 'grid', gap: 14, placeItems: 'center' }}>
            <ErrorToast
              title="Inventory Update Failed"
              message="Could not synchronize with warehouse. Please check connection."
              onRetry={() => alert('Retrying update...')}
            />
            <button type="button" className="sys-btn sys-btn--terracotta" onClick={() => triggerToast('error')}>
              Trigger Live Error Toast
            </button>
          </div>
        )}

        {/* 14. Confirm Modal Preview */}
        {activeState === 'modal-confirm' && (
          <div style={{ display: 'grid', gap: 14, placeItems: 'center' }}>
            <p style={{ color: 'var(--admin-mute)', margin: 0 }}>Click below to test the live modal overlay:</p>
            <button type="button" className="sys-btn sys-btn--primary" onClick={() => setActiveModal('confirm')}>
              Open Confirmation Modal
            </button>
          </div>
        )}

        {/* 15. Delete Modal Preview */}
        {activeState === 'modal-delete' && (
          <div style={{ display: 'grid', gap: 14, placeItems: 'center' }}>
            <p style={{ color: 'var(--admin-mute)', margin: 0 }}>Click below to test the destructive delete modal:</p>
            <button type="button" className="sys-btn sys-btn--terracotta" onClick={() => setActiveModal('delete')}>
              Open Delete Confirmation Modal
            </button>
          </div>
        )}

        {/* 16. Session Expired */}
        {activeState === 'session' && <SessionExpiredState mode={mode} />}
      </main>

      {/* Floating Live Toasts Tray */}
      {toasts.length > 0 && (
        <div className="sys-toast-tray" aria-live="polite">
          {toasts.map((toast) =>
            toast.type === 'success' ? (
              <SuccessToast
                key={toast.id}
                title={toast.title}
                message={toast.message}
                onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              />
            ) : (
              <ErrorToast
                key={toast.id}
                title={toast.title}
                message={toast.message}
                onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              />
            ),
          )}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'confirm' && (
        <ConfirmModal
          title="Mark Order as Shipped?"
          message="This will update Order #SVH12345 in the fulfillment system and dispatch an automated tracking SMS and email to the customer."
          confirmLabel="Yes, Mark Shipped"
          onConfirm={() => {
            setActiveModal(null)
            triggerToast('success')
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'delete' && (
        <DeleteModal
          title="Remove Item from Kitchen Stock?"
          message="Are you sure you want to permanently delete 'Kasthuri Manjal Soap'? This will remove it from all catalog collections and customer wishlists."
          confirmLabel="Yes, Delete Product"
          onConfirm={() => {
            setActiveModal(null)
            triggerToast('error')
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}
