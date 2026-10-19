"use client";

import styles from "./EnvironmentBanner.module.css";

type EnvironmentBannerProps = {
  location: "login" | "navigation";
};

const isTestEnvironment =
  process.env.NEXT_PUBLIC_APP_ENVIRONMENT?.trim().toUpperCase() === "TEST";

/**
 * Identificación visual del ambiente.
 * El valor se incorpora al build desde la configuración administrada del despliegue.
 */
export default function EnvironmentBanner({ location }: EnvironmentBannerProps) {
  if (!isTestEnvironment) {
    return null;
  }

  if (location === "login") {
    return (
      <div className={styles.loginNotice} aria-label="Contacto del ambiente TEST">
        <span className={styles.loginNoticeTitle}>Contacto</span>
        <span className={styles.loginNoticeDescription}>
          UATRETEST.INTERSISTEMAS.NET
        </span>
      </div>
    );
  }

  return (
    <span
      className={styles.navigationTag}
      aria-label="Ambiente actual: TEST"
    >
      AMBIENTE TEST
    </span>
  );
}
