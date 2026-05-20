import Link from 'next/link';
import { IconType } from 'react-icons'; // Importamos IconType
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  icon?: IconType; // Nueva prop para el icono
  quantity?: number;
  description?: string;
  lastUpdated?: string;
  link?: string;
  borderColorClass?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  icon: Icon, // Renombramos 'icon' a 'Icon' para usarlo como componente
  quantity,
  description,
  lastUpdated,
  link,
  borderColorClass = 'border-purple', // Valor por defecto si no se pasa
}) => {
  const trimmedLink = (link ?? "").trim();

  return (
    <div className={`${styles.card} ${styles[borderColorClass]}`}>
      <div className={styles.cardContent}>
        {(title || Icon) && ( // Renderiza si hay título o icono
          <div className={styles.titleSection}>
            {Icon && <Icon className={styles.titleIcon} />} {/* Renderiza el icono si existe */}
            {title && <h3 className={styles.title}>{title}</h3>}
          </div>
        )}
        {quantity !== undefined && (
          <div className={styles.counterSection}>
            <span className={styles.quantity}>{quantity}</span>
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
        {lastUpdated && <p className={styles.lastUpdated}>Última actualización : {lastUpdated}</p>}
        {trimmedLink && (
          <Link href={trimmedLink} className={styles.link}>
            Ver Detalles →
          </Link>
        )}
      </div>
    </div>
  );
};

export default Card;