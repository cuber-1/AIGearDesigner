import { useMemo } from 'react'
import styles from './RecommendedParts.module.css'
import { findProducts, hasAffiliateTag } from '../lib/affiliates'

export default function RecommendedParts({ result }) {
  const products = useMemo(() => findProducts(result, 6), [result])
  if (products.length === 0) return null

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <div className={styles.label}>Recommended parts</div>
          <div className={styles.title}>Build it for real</div>
        </div>
        <div className={styles.subtitle}>
          Hand-picked components that match your design.
        </div>
      </div>

      <div className={styles.grid}>
        {products.map(p => (
          <a
            key={p.id}
            className={styles.card}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <div className={styles.cardIcon}>{p.icon}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardName}>{p.name}</div>
              <div className={styles.cardDesc}>{p.description}</div>
            </div>
            <div className={styles.cardCta}>
              View →
            </div>
          </a>
        ))}
      </div>

      <div className={styles.disclosure}>
        {hasAffiliateTag()
          ? 'As an Amazon Associate this site earns from qualifying purchases. Prices and availability shown on Amazon.'
          : 'Links are Amazon search results. Add VITE_AMAZON_TAG to your .env to monetize them.'}
      </div>
    </section>
  )
}
