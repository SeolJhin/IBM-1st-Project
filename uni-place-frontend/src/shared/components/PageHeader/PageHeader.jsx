import styles from "./PageHeader.module.css";

export default function PageHeader({ image }) {
  return (
    <div
      className={styles.hero}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      {image && <div className={styles.overlay} />}
    </div>
  );
}
