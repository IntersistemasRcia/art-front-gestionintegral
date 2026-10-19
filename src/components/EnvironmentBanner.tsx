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
      <div className={styles.loginNotice} aria-label="Ambiente actual: TEST">
        <span className={styles.loginNoticeDescription}>AMBIENTE TEST</span>
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
