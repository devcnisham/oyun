'use client';

import { useState } from 'react';
import styles from './PaymentGatewayDemo.module.css';

interface PaymentGatewayDemoProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentGatewayDemo({ amount, onSuccess, onCancel }: PaymentGatewayDemoProps) {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // Simulate API delay
    setTimeout(() => {
      onSuccess();
    }, 2500);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.demoBadge}>Test Mode</div>
          <button className={styles.closeBtn} onClick={onCancel} disabled={processing}>×</button>
          <div className={styles.merchantName}>OYUN</div>
          <div className={styles.amount}>₹{amount.toLocaleString('en-IN')}</div>
        </div>

        <div className={styles.body}>
          {processing ? (
            <div className={styles.processing}>
              <div className={styles.spinner} />
              <div className={styles.processingText}>Processing Payment...</div>
              <div className={styles.processingSub}>Please do not close this window</div>
            </div>
          ) : (
            <>
              <div className={styles.sectionTitle}>Select Payment Method</div>
              <div className={styles.methodsList}>
                <button className={styles.methodBtn} onClick={handlePay}>
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>📱</div>
                    <div className={styles.methodInfo}>
                      <span className={styles.methodTitle}>UPI</span>
                      <span className={styles.methodSub}>Google Pay, PhonePe, Paytm</span>
                    </div>
                  </div>
                  <span className={styles.arrow}>›</span>
                </button>

                <button className={styles.methodBtn} onClick={handlePay}>
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>💳</div>
                    <div className={styles.methodInfo}>
                      <span className={styles.methodTitle}>Card</span>
                      <span className={styles.methodSub}>Visa, MasterCard, RuPay</span>
                    </div>
                  </div>
                  <span className={styles.arrow}>›</span>
                </button>

                <button className={styles.methodBtn} onClick={handlePay}>
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>🏦</div>
                    <div className={styles.methodInfo}>
                      <span className={styles.methodTitle}>Net Banking</span>
                      <span className={styles.methodSub}>All Indian banks supported</span>
                    </div>
                  </div>
                  <span className={styles.arrow}>›</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
