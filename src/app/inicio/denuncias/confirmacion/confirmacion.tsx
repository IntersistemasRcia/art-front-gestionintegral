"use client";
import React from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import styles from "../denuncias.module.css";
import type { DenunciaFormData, ConfirmacionProps } from "../types/tDenuncias";
import { FaTrash } from "react-icons/fa";
import { ThemeProvider, createTheme } from "@mui/material/styles";


const ConfirmacionDenuncia: React.FC<ConfirmacionProps> = ({
  form,
  isDisabled,
  uploadedFiles,
  errors,
  touched,
  onFileUpload,
  onFileRemove,
  onCheckboxChange,
  onBlur,
}) => {
  const localTheme = createTheme({
    typography: {
      fontSize: 18,
    },
  });

  return (
    <ThemeProvider theme={localTheme}>
      <>
      {/* Resumen de la Denuncia */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Resumen de la Denuncia
        </Typography>

        <Paper elevation={1} className={styles.summaryPaper}>
          <Typography variant="body2" color="text.secondary" className={styles.captionBlock}>
            Por favor, revise la información ingresada antes de enviar la
            denuncia.
          </Typography>

          <Box className={styles.summaryGrid}>
            <Box>
              <Typography
                variant="subtitle2"
                className={styles.summaryTitle}
              >
                Datos Iniciales
              </Typography>
              <Typography variant="body2">
                Teléfono: {form.telefonos}
              </Typography>
              <Typography variant="body2">
                Contacto: {form.apellidoNombres}
              </Typography>
              <Typography variant="body2">
                Fecha: {form.fechaOcurrencia}
              </Typography>
              <Typography variant="body2">Hora: {form.hora}</Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                className={styles.summaryTitle}
              >
                Datos del Trabajador
              </Typography>
              <Typography variant="body2">CUIL: {form.cuil}</Typography>
              <Typography variant="body2">Nombre: {form.nombre}</Typography>
              <Typography variant="body2">
                Documento: {form.docTipo} {form.docNumero}
              </Typography>
              <Typography variant="body2">Email: {form.email}</Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                className={styles.summaryTitle}
              >
                Datos del Empleador
              </Typography>
              <Typography variant="body2">CUIT: {form.empCuit}</Typography>
              <Typography variant="body2">Razón Social: {form.empRazonSocial}</Typography>
              <Typography variant="body2">Teléfono: {form.empTelefonos}</Typography>
              <Typography variant="body2">Email: {form.empEmail}</Typography>
            </Box>
          </Box>
        </Paper>
      </div>

      {/* Archivos Adjuntos */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Archivos Adjuntos
        </Typography>

        <Box className={styles.fileUploadBox}>
          <input
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className={styles.fileUploadHiddenInput}
            id="file-upload"
            multiple
            type="file"
            onChange={onFileUpload}
            disabled={isDisabled}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              disabled={isDisabled}
              className={styles.fileUploadButton}
            >
              📎 Seleccionar Archivos
            </Button>
          </label>
        </Box>

        {uploadedFiles.length > 0 && (
          <Paper elevation={1} className={styles.fileListPaper}>
            <List dense>
              {uploadedFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={" "}
                    secondary={
                      <a
                        href={URL.createObjectURL(file)}
                        download={file.name}
                        title={file.name}
                        className={styles.noUnderlineLink}
                      >
                        {file.name}
                      </a>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => onFileRemove(index)}
                      disabled={isDisabled}
                      className={styles.fileListRemoveBtn}
                    >
                      <FaTrash />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          className={styles.captionBlock}
        >
          Formatos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG. Tamaño máximo:
          10MB por archivo.
        </Typography>
      </div>

      {/* Términos y Condiciones */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Términos y Condiciones
        </Typography>

        <Paper elevation={1} className={styles.termsPaper}>
          <Typography variant="body2" paragraph>
            <strong>
              TÉRMINOS Y CONDICIONES PARA EL REGISTRO DE DENUNCIAS
            </strong>
          </Typography>

          <Typography variant="body2" paragraph>
            1. La información proporcionada es verídica y completa según mi
            conocimiento.
          </Typography>

          <Typography variant="body2" paragraph>
            2. Autorizo el tratamiento de los datos personales conforme a la Ley
            25.326 de Protección de Datos Personales.
          </Typography>

          <Typography variant="body2" paragraph>
            3. Entiendo que proporcionar información falsa puede tener
            consecuencias legales.
          </Typography>

          <Typography variant="body2" paragraph>
            4. Acepto que ART puede contactarme para verificar o solicitar
            información adicional.
          </Typography>

          <Typography variant="body2" paragraph>
            5. Los archivos adjuntos son relevantes al siniestro reportado y no
            contienen información confidencial de terceros.
          </Typography>
        </Paper>

        <FormControlLabel
          control={
            <Checkbox
              name="aceptoTerminos"
              checked={form.aceptoTerminos}
              onChange={onCheckboxChange}
              onBlur={() => onBlur("aceptoTerminos")}
              disabled={isDisabled}
              className={styles.termsCheckbox}
            />
          }
          label={
            <Typography variant="body2">
              <strong>Acepto los términos y condiciones</strong> *
            </Typography>
          }
        />

        {touched.aceptoTerminos && errors.aceptoTerminos && (
          <Typography
            variant="caption"
            color="error"
            className={styles.captionBlock}
          >
            {errors.aceptoTerminos}
          </Typography>
        )}
      </div>

      {/* Información Adicional */}
      <div className={styles.formSection}>
        <Paper elevation={1} className={styles.additionalInfoPaper}>
          <Typography
            variant="body2"
            className={styles.additionalInfoTitle}
          >
             Información Importante
          </Typography>

          <Typography variant="body2" paragraph>
            • Una vez enviada la pre-denuncia, recibirá un número de seguimiento.
          </Typography>

          <Typography variant="body2" paragraph>
            • Puede consultar el estado de su pre-denuncia en cualquier momento.
          </Typography>

          <Typography variant="body2" paragraph>
            • Si necesita adjuntar documentos adicionales, puede hacerlo
            posteriormente.
          </Typography>

          <Typography variant="body2">
            • Para consultas urgentes, comuníquese al:{" "}
            <strong>0800-XXX-XXXX</strong>
          </Typography>
        </Paper>
      </div>
      </>
    </ThemeProvider>
  );
};

export default ConfirmacionDenuncia;
