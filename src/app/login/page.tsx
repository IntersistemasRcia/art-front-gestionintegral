// app/signin/page.tsx
"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Person, Lock, Visibility, VisibilityOff, Mail } from "@mui/icons-material";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModal from "@/utils/ui/form/CustomModal";
import usuarioAPI from "@/data/usuarioAPI";
import styles from "./Signin.module.css";

export default function Signin() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  const [emailRecovery, setEmailRecovery] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const router = useRouter();

// ...existing code...
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Evita reentradas
    if (isLoading) {
      console.warn("handleSubmit: ya se está enviando, ignorando nuevo submit");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      // Forzar strings y trim para evitar FormDataEntryValue u objetos inesperados
      const loginUser = String(formData.get("loginUser") ?? "").trim();
      const loginPassword = String(formData.get("loginPassword") ?? "");

      console.debug("[Login] enviar credenciales", { loginUser, hasPassword: !!loginPassword });

      const res = await signIn("credentials", {
        loginUser,
        loginPassword,
        redirect: false,
      });

      console.debug("[Login] signIn result:", res);

      console.debug("[Login] signIn result:", res);

      if (res?.error) {
        // Intentar detectar si la API nos devolvió un link de restablecimiento
        const errorStr = String(res.error || "");

        const pendingEmail = errorStr.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
        if (pendingEmail && /requiere validaci[oó]n/i.test(errorStr)) {
          await usuarioAPI.reenviarCorreo(pendingEmail);
          setError(`Su cuenta requiere validación. Le enviamos un correo electrónico a ${pendingEmail} para que pueda verificarla y activar su acceso.`);
          return;
        }

        const resetRegex = /(https?:\/\/[^\s\"]*resetPassword\?[^\"\s]*)|(?:resetPassword\?[^\"\s]*)/i;
        const match = errorStr.match(resetRegex);
        if (match) {
          let urlStr = match[0];
          try {
            let searchPart = "";
            if (/^https?:\/\//i.test(urlStr)) {
              const u = new URL(urlStr);
              searchPart = u.search;
            } else {
              const idx = urlStr.indexOf("?");
              searchPart = idx >= 0 ? urlStr.substring(idx) : "";
            }
            const params = new URLSearchParams(searchPart);
            const email = params.get("email") || "";
            const token = params.get("token") || "";
            const target = 
              `/resetPassword?${new URLSearchParams({ email, token }).toString()}`;
            console.debug("[Login] redirigiendo a reset con:", { email, token });
            return router.push(target);
          } catch (e) {
            console.warn("[Login] no se pudo parsear el link de reset:", e);
          }
        }

        // Mostrar el error tal cual lo devuelve next-auth si no es un reset
        setError(errorStr);
        // También registrar para comparar primer/segundo click
        console.warn("[Login] error de signIn:", res.error);
      } else if (res?.ok) {
        // Éxito
        return router.push("/");
      } else {
        // Caso inesperado
        setError("Error desconocido en el proceso de autenticación");
        console.warn("[Login] signIn retornó resultado inesperado:", res);
      }
    } catch (err: unknown) {
      console.error("[Login] excepción en handleSubmit:", err);
      setError(err instanceof Error ? err.message : "Error inesperado al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailRecovery.trim()) {
      setRecoveryError("Por favor ingresa tu email");
      return;
    }

    setIsSendingEmail(true);
    setRecoveryError("");
    setRecoveryMessage("");

    try {
      await usuarioAPI.reestablecer(emailRecovery);
      
      setRecoveryMessage(
        "Se ha enviado un correo con las instrucciones para restablecer tu contraseña."
      );
      setEmailRecovery("");
      setTimeout(() => {
        setOpenForgotPassword(false);
        setRecoveryMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("[ForgotPassword] Error:", err);
      setRecoveryError(err instanceof Error ? err.message : "Error al enviar el correo de recuperación");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Box className={styles.loginContainer}>
      {/* LEFT PANEL */}
      <Box className={styles.leftCard}>
        <Box className={styles.centeredBlock}>
          
        </Box>
        
        <Box className={styles.logoBlock}>
          <Box className={styles.centeredBlock}>
              <h1 className={styles.mainTitle}>Gestión</h1>
              <Box className={styles.titleUnderline} />
          </Box>
         
          <Image
            src="/icons/LogoTexto.svg"
            alt="Logo ART Mutual Rural"
            width={350}
            height={350}
            className={styles.logo}
            priority
          />
        </Box>

        <Box className={styles.footerArea}>
          <Box className={styles.greenStripeFooter} />
          <h1 className={styles.footerText}>
            Aseguradora de Riesgos del Trabajo
            <br />
            del sector Agropecuario
          </h1>
        </Box>
      </Box>

      {/* RIGHT PANEL */}
      <Box className={styles.rightCard}>
        <Box className={styles.smallLogoWrap}>
          <Image
            src="/icons/Logo.svg"
            alt="logo small"
            width={75}
            height={75}
            priority
          />
        </Box>

        <Box className={styles.rightCardContent}>
          <h1 className={styles.formTitle}>Iniciar Sesión</h1>

          <Box component="form" onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <Alert severity="error" className={styles.error}>
                {error}
              </Alert>
            )}

            <label className={styles.fieldLabel}>Usuario</label>
            <TextField
              fullWidth
              id="loginUser"
              name="loginUser"
              placeholder="Ingrese clave"
              required
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#567a2e" }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <label className={styles.fieldLabel}>Contraseña</label>
            <TextField
              fullWidth
              id="loginPassword"
              name="loginPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Ingrese su contraseña"
              required
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#567a2e" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={isLoading}
                      sx={{ marginRight: '-4px' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  disabled={isLoading}
                  sx={{
                    color: "#567a2e",
                    "&.Mui-checked": { color: "#567a2e" },
                  }}
                />
              }
              label="Recordar Sesión"
              className={styles.rememberContainer}
            />

            <CustomButton
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
              size="mid"
            >
              INGRESAR AL SISTEMA
            </CustomButton>

            <Box className={styles.forgotPassword}>
              <a 
                className={styles.forgotLink} 
                onClick={() => setOpenForgotPassword(true)}
                style={{ cursor: 'pointer' }}
              >
                Olvidaste la contraseña?
              </a>
            </Box>
          </Box>
        </Box>
      </Box>

      <CustomModal
        open={openForgotPassword}
        onClose={() => setOpenForgotPassword(false)}
        title="Recuperar Contraseña"
        size="mid"
        actions={
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <CustomButton
              onClick={() => {
                setOpenForgotPassword(false);
                setRecoveryError("");
                setRecoveryMessage("");
                setEmailRecovery("");
              }}
              disabled={isSendingEmail}
              color="secondary"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              onClick={handleForgotPassword}
              isLoading={isSendingEmail}
              disabled={isSendingEmail}
              size="mid"
            >
              ENVIAR
            </CustomButton>
          </Box>
        }
      >
        <Typography variant="body1" sx={{ mb: 3, color: "#666", fontSize: "1.4rem", lineHeight: 1.7 }}>
          Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
        </Typography>
        
        {recoveryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {recoveryError}
          </Alert>
        )}
        
        {recoveryMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {recoveryMessage}
          </Alert>
        )}
        
        <TextField
          fullWidth
          type="email"
          label="Correo Electrónico"
          value={emailRecovery}
          onChange={(e) => setEmailRecovery(e.target.value)}
          disabled={isSendingEmail}
          placeholder="ejemplo@correo.com"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Mail sx={{ color: "#567a2e", fontSize: "2rem" }} />
              </InputAdornment>
            ),
            sx: { fontSize: "1.7rem" }
          }}
          InputLabelProps={{
            sx: { fontSize: "1.7rem" }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#567a2e',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#567a2e',
            },
          }}
        />
      </CustomModal>
    </Box>
  );
}