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

  return (
    <span
      className={`${styles.tag} ${styles[location]}`}
      aria-label="Ambiente actual: TEST"
    >
      AMBIENTE TEST
    </span>
  );
}
